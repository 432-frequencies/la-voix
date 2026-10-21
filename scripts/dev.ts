import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import dotenv from "dotenv";
import EmbeddedPostgres from "embedded-postgres";
if (process.env.NODE_ENV === "production")
  throw new Error("npm run dev est réservé au développement.");
await mkdir(".local", { recursive: true, mode: 0o700 });
dotenv.config({ quiet: true });
if (!existsSync(".env")) {
  await writeFile(
    ".env",
    `APP_URL=http://localhost:5173\nDATABASE_URL=postgresql://lavoix:${randomBytes(24).toString("hex")}@127.0.0.1:55432/lavoix\nBETTER_AUTH_SECRET=${randomBytes(48).toString("hex")}\nDEMO_MODE=true\n`,
    { mode: 0o600 },
  );
  dotenv.config({ quiet: true });
}
let pg: EmbeddedPostgres | undefined;
const children: ChildProcess[] = [];
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  await Promise.all(
    children.map(
      (child) =>
        new Promise<void>((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null)
            return resolve();
          child.once("exit", () => resolve());
          setTimeout(resolve, 3000).unref();
        }),
    ),
  );
  if (pg) await pg.stop();
  process.exit(code);
}
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => void stop());
try {
  const url = new URL(process.env.DATABASE_URL!);
  if (url.hostname === "127.0.0.1" && url.port === "55432") {
    pg = new EmbeddedPostgres({
      databaseDir: ".local/postgres",
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      port: 55432,
      persistent: true,
      onLog: () => {},
      onError: (message: unknown) => console.error(message),
    });
    if (!existsSync(".local/postgres/PG_VERSION")) await pg.initialise();
    await pg.start();
    const client = pg.getPgClient();
    await client.connect();
    const db = url.pathname.slice(1);
    if (!/^[a-z_][a-z0-9_]*$/.test(db)) throw new Error("Nom de base invalide");
    if (
      !(await client.query("SELECT 1 FROM pg_database WHERE datname=$1", [db]))
        .rowCount
    )
      await pg.createDatabase(db);
    await client.end();
  }
  const { migrate } = await import("../server/migrate.ts");
  await migrate();
  if (process.env.DEMO_MODE === "true") {
    const { seed } = await import("../server/seed.ts");
    await seed();
  }
  const { pool } = await import("../server/db.ts");
  await pool.end();
  for (const args of [
    ["exec", "tsx", "watch", "server/index.ts"],
    ["exec", "vite", "--", "--host", "127.0.0.1"],
  ]) {
    const child = spawn("npm", args, { stdio: "inherit", env: process.env });
    children.push(child);
    child.on("exit", (code) => {
      if (!stopping) void stop(code || 1);
    });
  }
  console.log(
    "LA VOIX : http://localhost:5173 — Courriels locaux : http://localhost:5173/dev-mail",
  );
} catch (error) {
  console.error(error);
  await stop(1);
}
