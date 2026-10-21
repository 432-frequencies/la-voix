import type pg from "pg";
import { z } from "zod";
// Order respects foreign keys. SQL identifiers below only come from this fixed list or DB metadata.
export const backupTables = [
  "user",
  "account",
  "session",
  "verification",
  "laws",
  "articles",
  "votes",
  "reforms",
  "supports",
  "statements",
  "stances",
] as const;
const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"';
const format = z
  .object({
    format: z.literal("la-voix-backup-v1"),
    created_at: z.string(),
    tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  })
  .strict();
export async function backup(database: pg.Pool) {
  const client = await database.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const tables: Record<string, unknown[]> = {};
    for (const t of backupTables)
      tables[t] = (await client.query(`SELECT * FROM ${quote(t)}`)).rows;
    await client.query("COMMIT");
    return {
      format: "la-voix-backup-v1",
      created_at: new Date().toISOString(),
      tables,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export async function restore(database: pg.Pool, input: unknown) {
  const snapshot = format.parse(input);
  if (
    Object.keys(snapshot.tables).sort().join() !==
    [...backupTables].sort().join()
  )
    throw new Error("Liste des tables incompatible");
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `LOCK TABLE ${backupTables.map(quote).join(",")} IN ACCESS EXCLUSIVE MODE`,
    );
    for (const t of backupTables)
      if ((await client.query(`SELECT 1 FROM ${quote(t)} LIMIT 1`)).rowCount)
        throw new Error(`Restauration refusée : ${t} n’est pas vide.`);
    for (const table of backupTables) {
      const columns = (
        await client.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1",
          [table],
        )
      ).rows.map((r) => r.column_name as string);
      for (const row of snapshot.tables[table]) {
        const keys = Object.keys(row);
        if (
          keys.length !== columns.length ||
          keys.some((k) => !columns.includes(k))
        )
          throw new Error(`Schéma incompatible : ${table}`);
        await client.query(
          `INSERT INTO ${quote(table)}(${keys.map(quote).join(",")}) VALUES(${keys.map((_, i) => "$" + (i + 1)).join(",")})`,
          keys.map((k) => row[k]),
        );
      }
    }
    await client.query("COMMIT");
    return Object.fromEntries(
      backupTables.map((t) => [t, snapshot.tables[t].length]),
    );
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
