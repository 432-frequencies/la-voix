import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool, transaction } from "./db.ts";
import type { User } from "./auth.ts";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const categories = [
  "Économie",
  "Social",
  "Environnement",
  "Justice",
  "Éducation",
  "Sécurité",
  "Institutionnel",
  "Autre",
] as const;
export const lawSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    description: z.string().trim().min(1).max(10000),
    full_text: z.string().max(200000).default(""),
    category: z.enum(categories).default("Autre"),
    status: z
      .enum(["en_cours", "vote_programmé", "adopté", "rejeté"])
      .default("en_cours"),
    vote_date: z.iso.date().nullable().optional(),
    assembly_result: z.enum(["pour", "contre", "non_voté"]).default("non_voté"),
    arguments_for: z.array(z.string().max(2000)).max(50).default([]),
    arguments_against: z.array(z.string().max(2000)).max(50).default([]),
    assembly_for: z.number().int().nonnegative().default(0),
    assembly_against: z.number().int().nonnegative().default(0),
    assembly_abstain: z.number().int().nonnegative().default(0),
    assembly_groups: z
      .array(
        z.object({
          groupe: z.string(),
          membres: z.number().nonnegative(),
          pour: z.number().nonnegative(),
          contre: z.number().nonnegative(),
          abstention: z.number().nonnegative(),
        }),
      )
      .default([]),
  })
  .strict();
export const articleSchema = z
  .object({
    law_id: z.string().min(1),
    title: z.string().trim().min(1).max(300),
    url: z
      .url()
      .refine(
        (v) => ["http:", "https:"].includes(new URL(v).protocol),
        "URL HTTP ou HTTPS requise",
      ),
    source: z.string().trim().min(1).max(200),
    journalist: z.string().max(200).optional(),
    orientation: z
      .enum([
        "gauche",
        "centre-gauche",
        "centre",
        "centre-droite",
        "droite",
        "neutre",
      ])
      .default("neutre"),
    summary: z.string().max(10000).optional(),
  })
  .strict();
const reformSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(2000),
    detail: z.string().max(20000).default(""),
    category: z.enum(categories).default("Autre"),
    target_law_id: z.string().min(1).optional(),
    target_action: z.enum(["modifier", "abroger"]).optional(),
    target_article: z.string().max(200).optional(),
  })
  .strict();
const stanceSchema = z
  .object({
    reform_id: z.string().min(1),
    statement_id: z.string().min(1),
    choice: z.enum(["accord", "mitigé", "desaccord"]),
  })
  .strict();
const tables = {
  Law: "laws",
  Article: "articles",
  Vote: "votes",
  Reform: "reforms",
  ReformSupport: "supports",
  ReformStatement: "statements",
  ReformStance: "stances",
} as const;
const privateEntities = new Set(["Vote", "ReformSupport", "ReformStance"]);
const metadata = ["id", "created_date", "updated_date"];
const fields: Record<string, string[]> = {
  Law: [
    ...metadata,
    "title",
    "category",
    "status",
    "vote_date",
    "assembly_result",
  ],
  Article: [...metadata, "law_id"],
  Vote: [...metadata, "law_id", "created_by_id", "choice"],
  Reform: [
    ...metadata,
    "title",
    "category",
    "status",
    "created_by_id",
    "target_law_id",
  ],
  ReformSupport: [...metadata, "reform_id", "created_by_id"],
  ReformStatement: [...metadata, "reform_id", "created_by_id"],
  ReformStance: [
    ...metadata,
    "reform_id",
    "statement_id",
    "created_by_id",
    "choice",
  ],
};
function table(entity: string) {
  const t = Object.hasOwn(tables, entity)
    ? tables[entity as keyof typeof tables]
    : null;
  if (!t) throw new HttpError(404, "Ressource inconnue");
  return t;
}
function column(entity: string, field: string) {
  if (!fields[entity]?.includes(field))
    throw new HttpError(400, "Champ de filtre invalide");
  if (
    ["title", "category", "vote_date"].includes(field) ||
    (entity === "Law" && ["status", "assembly_result"].includes(field))
  )
    return `data->>'${field}'`;
  return `"${field}"`;
}
export function record(row: Record<string, any>, entity?: string) {
  const { data, ...rest } = row;
  // Public contributions never expose account identifiers. Personal stances/votes remain private.
  if (entity === "Reform" || entity === "ReformStatement")
    delete rest.created_by_id;
  return { ...data, ...rest };
}
export function requireUser(user: User | null): User {
  if (!user || !user.emailVerified)
    throw new HttpError(
      401,
      "Connectez-vous avec une adresse confirmée pour participer.",
    );
  return user;
}
function where(
  entity: string,
  query: Record<string, unknown>,
  user: User | null,
) {
  const values: unknown[] = [];
  const parts: string[] = [];
  const add = (v: unknown) => {
    values.push(v);
    return `$${values.length}`;
  };
  if (privateEntities.has(entity))
    parts.push(`created_by_id=${add(user?.id || "")}`);
  for (const [key, value] of Object.entries(query)) {
    const col = column(entity, key);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const v = value as Record<string, unknown>;
      if ("$in" in v) {
        const arr = z.array(z.string()).max(20).parse(v.$in);
        parts.push(`${col}=ANY(${add(arr)}::text[])`);
      } else if ("$ne" in v)
        parts.push(`${col}<>${add(z.string().max(100).parse(v.$ne))}`);
      else if ("$gte" in v)
        parts.push(`${col}>=${add(z.string().max(100).parse(v.$gte))}`);
      else if ("$regex" in v && key === "title") {
        const term = z
          .string()
          .max(200)
          .parse(v.$regex)
          .replace(/[\\%_]/g, "\\$&");
        parts.push(`${col} ILIKE ${add("%" + term + "%")}`);
      } else throw new HttpError(400, "Filtre invalide");
    } else parts.push(`${col}=${add(z.string().max(300).parse(value))}`);
  }
  return { sql: parts.length ? " WHERE " + parts.join(" AND ") : "", values };
}
const listSchema = z.object({
  query: z.record(z.string(), z.unknown()).default({}),
  options: z
    .object({
      sort: z.string().default("-created_date"),
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).max(1000000).default(0),
      fields: z.array(z.string()).optional(),
    })
    .default({ sort: "-created_date", limit: 50, offset: 0 }),
});
export async function list(entity: string, body: unknown, user: User | null) {
  const t = table(entity);
  const { query, options } = listSchema.parse(body);
  const { sql, values } = where(entity, query, user);
  const desc = options.sort.startsWith("-");
  const order = column(entity, options.sort.replace(/^-/, ""));
  const total = await pool.query(
    `SELECT count(*)::int AS n FROM ${t}${sql}`,
    values,
  );
  const result = await pool.query(
    `SELECT * FROM ${t}${sql} ORDER BY ${order} ${desc ? "DESC" : "ASC"} NULLS LAST, id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, options.limit, options.offset],
  );
  return {
    items: result.rows.map((r) => record(r, entity)),
    total: total.rows[0].n,
    next_offset:
      options.offset + result.rows.length < total.rows[0].n
        ? options.offset + result.rows.length
        : null,
  };
}
export async function get(entity: string, id: string, user: User | null) {
  const result = await list(
    entity,
    { query: { id }, options: { limit: 1 } },
    user,
  );
  if (!result.items.length) throw new HttpError(404, "Élément introuvable");
  return result.items[0];
}
export async function create(
  entity: string,
  body: unknown,
  maybeUser: User | null,
) {
  const user = requireUser(maybeUser);
  let result;
  if (entity === "Reform") {
    const { target_law_id, ...data } = reformSchema.parse(body);
    result = await pool.query(
      "INSERT INTO reforms(id,created_by_id,target_law_id,data) VALUES($1,$2,$3,$4) RETURNING *",
      [randomUUID(), user.id, target_law_id || null, data],
    );
  } else if (entity === "ReformStatement") {
    const d = z
      .object({
        reform_id: z.string().min(1),
        content: z.string().trim().min(1).max(200),
      })
      .strict()
      .parse(body);
    result = await pool.query(
      "INSERT INTO statements(id,reform_id,created_by_id,content) VALUES($1,$2,$3,$4) RETURNING *",
      [randomUUID(), d.reform_id, user.id, d.content],
    );
  } else if (entity === "ReformStance") {
    const d = stanceSchema.parse(body);
    const statement = await pool.query(
      "SELECT created_by_id FROM statements WHERE id=$1 AND reform_id=$2",
      [d.statement_id, d.reform_id],
    );
    if (!statement.rowCount)
      throw new HttpError(400, "Affirmation et réforme incompatibles");
    if (statement.rows[0].created_by_id === user.id)
      throw new HttpError(
        403,
        "Vous ne pouvez pas vous positionner sur votre propre avis.",
      );
    result = await pool.query(
      "INSERT INTO stances(id,reform_id,statement_id,created_by_id,choice) VALUES($1,$2,$3,$4,$5) ON CONFLICT(created_by_id,statement_id) DO UPDATE SET choice=excluded.choice,updated_date=now() WHERE stances.reform_id=excluded.reform_id RETURNING *",
      [randomUUID(), d.reform_id, d.statement_id, user.id, d.choice],
    );
    if (!result.rowCount)
      throw new HttpError(400, "Affirmation et réforme incompatibles");
  } else throw new HttpError(403, "Cette écriture n’est pas autorisée.");
  return record(result.rows[0], entity);
}
export async function update(
  entity: string,
  id: string,
  body: unknown,
  maybeUser: User | null,
) {
  const user = requireUser(maybeUser);
  if (entity !== "ReformStance")
    throw new HttpError(403, "Cette écriture n’est pas autorisée.");
  const { choice } = z
    .object({ choice: z.enum(["accord", "mitigé", "desaccord"]) })
    .strict()
    .parse(body);
  const r = await pool.query(
    "UPDATE stances SET choice=$1,updated_date=now() WHERE id=$2 AND created_by_id=$3 RETURNING *",
    [choice, id, user.id],
  );
  if (!r.rowCount) throw new HttpError(404, "Position introuvable");
  return record(r.rows[0]);
}
export async function voteResults(lawId?: string) {
  const rows = await pool.query(
    `SELECT law_id,choice,count(*)::int AS n FROM votes ${lawId ? "WHERE law_id=$1" : ""} GROUP BY law_id,choice`,
    lawId ? [lawId] : [],
  );
  const results: Record<string, Record<string, number>> = {};
  if (lawId) results[lawId] = { total: 0, pour: 0, contre: 0, abstention: 0 };
  for (const r of rows.rows) {
    results[r.law_id] ??= { total: 0, pour: 0, contre: 0, abstention: 0 };
    results[r.law_id][r.choice] = r.n;
    results[r.law_id].total += r.n;
  }
  return { results };
}
export async function castVote(body: unknown, maybeUser: User | null) {
  const user = requireUser(maybeUser);
  const d = z
    .object({
      law_id: z.string().min(1),
      choice: z.enum(["pour", "contre", "abstention"]),
    })
    .strict()
    .parse(body);
  // Enforce the closure already displayed by the original UI when an assembly result exists.
  const r = await transaction(async (c) => {
    const law = await c.query("SELECT data FROM laws WHERE id=$1 FOR SHARE", [
      d.law_id,
    ]);
    if (!law.rowCount) throw new HttpError(400, "Loi introuvable");
    if (law.rows[0].data.assembly_result !== "non_voté")
      throw new HttpError(409, "Le vote est clôturé pour ce texte.");
    return c.query(
      "INSERT INTO votes(id,law_id,created_by_id,choice) VALUES($1,$2,$3,$4) ON CONFLICT(created_by_id,law_id) DO UPDATE SET choice=excluded.choice,updated_date=now() RETURNING *",
      [randomUUID(), d.law_id, user.id, d.choice],
    );
  });
  return {
    vote: record(r.rows[0]),
    results: (await voteResults(d.law_id)).results[d.law_id],
  };
}
export async function supportReform(body: unknown, maybeUser: User | null) {
  const user = requireUser(maybeUser);
  const d = z
    .object({ reform_id: z.string().min(1), supported: z.boolean() })
    .strict()
    .parse(body);
  return transaction(async (c) => {
    const r = await c.query(
      "SELECT status FROM reforms WHERE id=$1 FOR UPDATE",
      [d.reform_id],
    );
    if (!r.rowCount) throw new HttpError(404, "Réforme introuvable");
    if (d.supported)
      await c.query(
        "INSERT INTO supports(id,reform_id,created_by_id) VALUES($1,$2,$3) ON CONFLICT(created_by_id,reform_id) DO NOTHING",
        [randomUUID(), d.reform_id, user.id],
      );
    else
      await c.query(
        "DELETE FROM supports WHERE reform_id=$1 AND created_by_id=$2",
        [d.reform_id, user.id],
      );
    const n = await c.query(
      "SELECT count(*)::int AS n FROM supports WHERE reform_id=$1",
      [d.reform_id],
    );
    const changed = r.rows[0].status === "proposée" && n.rows[0].n >= 25;
    if (changed)
      await c.query(
        "UPDATE reforms SET status='en_debat',updated_date=now() WHERE id=$1",
        [d.reform_id],
      );
    return {
      supported: d.supported,
      supports: n.rows[0].n,
      status: changed ? "en_debat" : r.rows[0].status,
      status_changed: changed,
      threshold: 25,
    };
  });
}
export async function reformFeed(body: unknown, user: User | null) {
  const d = z
    .object({
      status: z.string().nullable().optional(),
      category: z.string().nullable().optional(),
      search: z.string().max(200).nullable().optional(),
      offset: z.number().int().nonnegative().default(0),
      limit: z.number().int().min(1).max(100).default(50),
    })
    .parse(body);
  const q: Record<string, unknown> = {};
  if (d.status) q.status = d.status;
  if (d.category) q.category = d.category;
  if (d.search) q.title = { $regex: d.search };
  const { sql, values } = where("Reform", q, user);
  const total = await pool.query(
    `SELECT count(*)::int n FROM reforms${sql}`,
    values,
  );
  const r = await pool.query(
    `SELECT r.*, (SELECT count(*)::int FROM supports s WHERE s.reform_id=r.id) support_count FROM reforms r${sql} ORDER BY support_count DESC,created_date DESC,id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, d.limit, d.offset],
  );
  const mine = user
    ? await pool.query(
        "SELECT reform_id FROM supports WHERE created_by_id=$1",
        [user.id],
      )
    : { rows: [] };
  const supports: Record<string, number> = {};
  const my_supports: Record<string, boolean> = {};
  mine.rows.forEach((r) => {
    my_supports[r.reform_id] = true;
  });
  return {
    reforms: r.rows.map(({ support_count, ...row }) => {
      supports[row.id] = support_count;
      return record(row, "Reform");
    }),
    supports,
    my_supports,
    total: total.rows[0].n,
    next_offset:
      d.offset + r.rows.length < total.rows[0].n
        ? d.offset + r.rows.length
        : null,
  };
}
export async function overview(body: unknown, user: User | null) {
  const { reform_id } = z.object({ reform_id: z.string().min(1) }).parse(body);
  await get("Reform", reform_id, user);
  const r = await pool.query(
    `SELECT s.*,count(t.id)::int total,
 count(t.id) FILTER(WHERE t.choice='accord')::int accord,
 count(t.id) FILTER(WHERE t.choice='mitigé')::int "mitigé",
 count(t.id) FILTER(WHERE t.choice='desaccord')::int desaccord,
 max(t.choice) FILTER(WHERE t.created_by_id=$2) my_stance
 FROM statements s LEFT JOIN stances t ON t.statement_id=s.id WHERE s.reform_id=$1 GROUP BY s.id ORDER BY s.created_date DESC,s.id`,
    [reform_id, user?.id || ""],
  );
  const s = await pool.query(
    "SELECT count(*)::int n, count(*) FILTER(WHERE created_by_id=$2)::int mine FROM supports WHERE reform_id=$1",
    [reform_id, user?.id || ""],
  );
  return {
    supports: s.rows[0].n,
    my_support: s.rows[0].mine > 0,
    user_id: user?.id || null,
    statements: r.rows.map((row) => ({
      ...record(row, "ReformStatement"),
      is_mine: row.created_by_id === user?.id,
      consensus: row.total >= 3 && row.accord / row.total >= 0.7,
      divergence:
        row.total >= 3 &&
        row.accord / row.total >= 0.35 &&
        row.accord / row.total <= 0.6,
    })),
  };
}
