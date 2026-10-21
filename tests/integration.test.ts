import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import type { Server } from "node:http";
const directory = await mkdtemp(path.join(os.tmpdir(), "lavoix-test-"));
const port = Number(process.env.TEST_PG_PORT || 55433),
  httpPort = Number(process.env.TEST_HTTP_PORT || 3002);
const password = randomBytes(24).toString("hex");
process.env.NODE_ENV = "test";
process.env.APP_URL = `http://localhost:${httpPort}`;
process.env.DATABASE_URL = `postgresql://tester:${password}@127.0.0.1:${port}/lavoix_test`;
process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("hex");
process.env.MAIL_DIR = path.join(directory, "mail");
delete process.env.SMTP_HOST;
const origin = process.env.APP_URL;
const pg = new EmbeddedPostgres({
  databaseDir: path.join(directory, "pg"),
  user: "tester",
  password,
  port,
  persistent: true,
  onLog: () => {},
  onError: () => {},
});
let poolClosed = false;
let server: Server;
let pool: typeof import("../server/db.ts").pool;
class Browser {
  cookies = new Map<string, string>();
  async call(
    route: string,
    body?: unknown,
    method = body === undefined ? "GET" : "POST",
    customOrigin = origin,
  ) {
    const r = await fetch(origin + route, {
      method,
      redirect: "manual",
      headers: {
        Origin: customOrigin,
        Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const c of r.headers.getSetCookie()) {
      const part = c.split(";")[0],
        i = part.indexOf("=");
      this.cookies.set(part.slice(0, i), part.slice(i + 1));
    }
    const text = await r.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: r.status, data, headers: r.headers };
  }
}
async function lastMail(email: string, subject: string) {
  const files = await readdir(process.env.MAIL_DIR!);
  const mails = await Promise.all(
    files.map(async (f) =>
      JSON.parse(await readFile(path.join(process.env.MAIL_DIR!, f), "utf8")),
    ),
  );
  return mails
    .filter((m) => m.to === email && m.subject.includes(subject))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}
const a = new Browser(),
  b = new Browser(),
  guest = new Browser();
let aId: string, bId: string, reformId: string, statementId: string;
async function register(browser: Browser, email: string) {
  const r = await browser.call("/api/auth/sign-up/email", {
    name: "Citoyen test",
    email,
    password: "Mot-de-passe-test-2026!",
    role: "admin",
    callbackURL: "/",
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal((await browser.call("/api/me")).data, null);
  const mail = await lastMail(email, "Confirmer");
  assert.ok(mail);
  const url = new URL(mail.url);
  const verified = await browser.call(url.pathname + url.search);
  assert.ok([200, 302].includes(verified.status), JSON.stringify(verified));
  const me = await browser.call("/api/me");
  assert.equal(me.data.emailVerified, true);
  assert.equal(me.data.role, "user");
  return me.data.id;
}
before(async () => {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("lavoix_test");
  const db = await import("../server/db.ts");
  pool = db.pool;
  const { migrate } = await import("../server/migrate.ts");
  await migrate();
  await migrate();
  const { seed } = await import("../server/seed.ts");
  await seed();
  await seed();
  const { app } = await import("../server/app.ts");
  server = await new Promise((resolve) => {
    const s = app.listen(httpPort, "127.0.0.1", () => resolve(s));
  });
});
after(async () => {
  if (server)
    await new Promise<void>((resolve) => server.close(() => resolve()));
  if (pool && !poolClosed) await pool.end();
  await pg.stop();
  await rm(directory, { recursive: true, force: true });
});
test("lecture publique, origine refusée et écritures anonymes interdites", async () => {
  assert.equal(
    (await guest.call("/api/entities/Law/demo-bibliotheques")).status,
    200,
  );
  assert.equal(
    (
      await guest.call("/api/actions/CastVote", {
        law_id: "demo-bibliotheques",
        choice: "pour",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await guest.call(
        "/api/actions/CastVote",
        {},
        "POST",
        "https://evil.invalid",
      )
    ).status,
    403,
  );
  const query = await guest.call("/api/entities/Law/query", {
    query: {},
    options: { limit: 1 },
  });
  assert.equal(query.data.total, 1);
  assert.equal(
    (
      await guest.call("/api/entities/Law/query", {
        query: { "id; DROP TABLE laws;--": "x" },
      })
    ).status,
    400,
  );
});
test("inscription avec confirmation, rôle non modifiable et connexion", async () => {
  aId = await register(a, "alice@example.test");
  bId = await register(b, "bob@example.test");
  assert.notEqual(aId, bId);
});
test("vote atomique, modification, résultats et isolation des comptes", async () => {
  const results = await Promise.all(
    Array.from({ length: 12 }, () =>
      a.call("/api/actions/CastVote", {
        law_id: "demo-bibliotheques",
        choice: "pour",
      }),
    ),
  );
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int n FROM votes WHERE created_by_id=$1",
        [aId],
      )
    ).rows[0].n,
    1,
  );
  await b.call("/api/actions/CastVote", {
    law_id: "demo-bibliotheques",
    choice: "contre",
  });
  const changed = await a.call("/api/actions/CastVote", {
    law_id: "demo-bibliotheques",
    choice: "abstention",
  });
  assert.equal(changed.data.results.total, 2);
  assert.equal(changed.data.results.abstention, 1);
  const mine = await a.call("/api/entities/Vote/query", {
    query: {},
    options: { limit: 10 },
  });
  assert.equal(mine.data.items.length, 1);
  assert.equal(mine.data.items[0].created_by_id, aId);
  const other = await a.call("/api/entities/Vote/query", {
    query: { created_by_id: bId },
  });
  assert.equal(other.data.total, 0);
  const anonymous = await guest.call("/api/entities/Vote/query", { query: {} });
  assert.equal(anonymous.data.total, 0);
  assert.equal(
    (
      await a.call("/api/actions/CastVote", {
        law_id: "missing",
        choice: "pour",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await a.call("/api/actions/CastVote", {
        law_id: "demo-bibliotheques",
        choice: "invalid",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await a.call("/api/actions/CastVote", {
        law_id: "demo-bibliotheques",
        choice: "pour",
        created_by_id: bId,
      })
    ).status,
    400,
  );
});
test("réformes, soutiens idempotents, seuil et intégrité des prises de position", async () => {
  const created = await a.call("/api/entities/Reform", {
    title: "Bibliothèque ouverte",
    summary: "Proposition de test",
    category: "Éducation",
  });
  assert.equal(created.status, 201);
  reformId = created.data.id;
  assert.equal(created.data.created_by_id, undefined);
  const support = () =>
    a.call("/api/actions/SupportReform", {
      reform_id: reformId,
      supported: true,
    });
  await Promise.all([support(), support(), support()]);
  assert.equal((await support()).data.supports, 1);
  for (let i = 0; i < 24; i++) {
    const id = `supporter-${i}`;
    await pool.query(
      'INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt",role) VALUES($1,$2,$3,true,now(),now(),$4)',
      [id, id, `${id}@example.test`, "user"],
    );
    await pool.query(
      "INSERT INTO supports(id,reform_id,created_by_id) VALUES($1,$2,$3)",
      [id, reformId, id],
    );
  }
  assert.equal((await support()).data.status, "en_debat");
  const removed = await a.call("/api/actions/SupportReform", {
    reform_id: reformId,
    supported: false,
  });
  assert.equal(removed.data.supports, 24);
  assert.equal(removed.data.status, "en_debat");
  const statement = await a.call("/api/entities/ReformStatement", {
    reform_id: reformId,
    content: "Ouvrir le samedi.",
  });
  statementId = statement.data.id;
  assert.equal(statement.status, 201);
  assert.equal(
    (
      await a.call("/api/entities/ReformStance", {
        reform_id: reformId,
        statement_id: statementId,
        choice: "accord",
      })
    ).status,
    403,
  );
  const stance = await b.call("/api/entities/ReformStance", {
    reform_id: reformId,
    statement_id: statementId,
    choice: "accord",
  });
  assert.equal(stance.status, 201);
  assert.equal(
    (
      await a.call(
        `/api/entities/ReformStance/${stance.data.id}`,
        { choice: "desaccord" },
        "PATCH",
      )
    ).status,
    404,
  );
  const other = await a.call("/api/entities/Reform", {
    title: "Autre",
    summary: "Autre réforme",
  });
  assert.equal(
    (
      await a.call("/api/entities/ReformStance", {
        reform_id: other.data.id,
        statement_id: statementId,
        choice: "accord",
      })
    ).status,
    400,
  );
  const ov = await guest.call("/api/actions/GetReformOverview", {
    reform_id: reformId,
  });
  assert.equal(ov.data.statements[0].accord, 1);
  assert.equal(ov.data.statements[0].created_by_id, undefined);
  const opinion = await guest.call("/api/actions/GetOpinionMap", {
    reform_id: reformId,
  });
  assert.equal(opinion.data.participants, 1);
  assert.equal(opinion.data.my_cluster, null);
  assert.equal(opinion.data.clusters[0].members, undefined);
  const feed = await guest.call("/api/actions/GetReformFeed", { limit: 1 });
  assert.equal(feed.data.total, 2);
  assert.equal(feed.data.next_offset, 1);
});
test("agrégations complètes au-delà des anciennes limites de 500 lignes", async () => {
  for (let i = 0; i < 510; i++) {
    const id = `many-${i}`;
    await pool.query(
      'INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt",role) VALUES($1,$1,$2,true,now(),now(),$3)',
      [id, `${id}@example.test`, "user"],
    );
    await pool.query(
      "INSERT INTO stances(id,reform_id,statement_id,created_by_id,choice) VALUES($1,$2,$3,$1,$4)",
      [id, reformId, statementId, "accord"],
    );
  }
  const opinion = await guest.call("/api/actions/GetOpinionMap", {
    reform_id: reformId,
  });
  assert.equal(opinion.data.participants, 511);
  const ov = await guest.call("/api/actions/GetReformOverview", {
    reform_id: reformId,
  });
  assert.equal(ov.data.statements[0].total, 511);
  assert.equal(ov.data.statements[0].consensus, true);
});
test("récupération de compte, invalidation des sessions et jeton à usage unique", async () => {
  await a.call("/api/auth/request-password-reset", {
    email: "alice@example.test",
    redirectTo: "/reset-password",
  });
  const mail = await lastMail("alice@example.test", "Réinitialiser");
  assert.ok(mail);
  const url = new URL(mail.url);
  const landing = await guest.call(url.pathname + url.search);
  assert.equal(landing.status, 302);
  const token = new URL(
    landing.headers.get("location")!,
    origin,
  ).searchParams.get("token");
  assert.ok(token);
  const reset = await guest.call("/api/auth/reset-password", {
    token,
    newPassword: "Un-autre-mot-de-passe-2026!",
  });
  assert.equal(reset.status, 200);
  assert.equal((await a.call("/api/me")).data, null);
  assert.notEqual(
    (
      await guest.call("/api/auth/reset-password", {
        token,
        newPassword: "Encore-un-mot-de-passe!",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await a.call("/api/auth/sign-in/email", {
        email: "alice@example.test",
        password: "Un-autre-mot-de-passe-2026!",
      })
    ).status,
    200,
  );
  await a.call("/api/auth/sign-out", {});
  assert.equal((await a.call("/api/me")).data, null);
});
test("sauvegarde cohérente, restauration dans une base vide et refus d’écrasement", async () => {
  const { backup, restore } = await import("../server/backup.ts");
  const snapshot = JSON.parse(JSON.stringify(await backup(pool)));
  await pg.createDatabase("lavoix_restore");
  const { Pool } = await import("pg");
  const target = new Pool({
    connectionString: process.env.DATABASE_URL!.replace(
      "/lavoix_test",
      "/lavoix_restore",
    ),
  });
  try {
    const { getMigrations } = await import("better-auth/db/migration");
    const { authOptions } = await import("../server/auth-options.ts");
    await (
      await getMigrations({ ...authOptions, database: target })
    ).runMigrations();
    await target.query(await readFile("db/migrations/001_domain.sql", "utf8"));
    const counts = await restore(target, snapshot);
    assert.equal(counts.votes, 2);
    assert.equal(counts.stances, 511);
    assert.deepEqual(
      (await target.query("SELECT choice FROM votes ORDER BY id")).rows,
      (await pool.query("SELECT choice FROM votes ORDER BY id")).rows,
    );
    await assert.rejects(() => restore(target, snapshot), /n’est pas vide/);
  } finally {
    await target.end();
  }
});
test("clôture appliquée côté serveur et filtre des votes passés", async () => {
  await pool.query(
    `UPDATE laws SET data=jsonb_set(data,'{assembly_result}','"pour"') WHERE id='demo-bibliotheques'`,
  );
  assert.equal(
    (
      await b.call("/api/actions/CastVote", {
        law_id: "demo-bibliotheques",
        choice: "pour",
      })
    ).status,
    409,
  );
  const past = await guest.call("/api/entities/Law/query", {
    query: { assembly_result: { $ne: "non_voté" } },
  });
  assert.equal(past.data.total, 1);
});
test("les données persistent après redémarrage réel de PostgreSQL", async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
  poolClosed = true;
  await pg.stop();
  await pg.start();
  const client = pg.getPgClient();
  await client.connect();

  // getPgClient uses the postgres database; reconnect explicitly to the application database.
  await client.end();
  const { Client } = await import("pg");
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  assert.equal(
    (await db.query("SELECT count(*)::int n FROM votes")).rows[0].n,
    2,
  );
  await db.end();
});
