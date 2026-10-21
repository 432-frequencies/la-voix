import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { getMigrations } from "better-auth/db/migration";
import { authOptions } from "./auth-options.ts";
import { pool, transaction } from "./db.ts";
export async function migrate() {
  const lock = await pool.connect();
  try {
    await lock.query("SELECT pg_advisory_lock(18442026)");
    const { runMigrations } = await getMigrations(authOptions);
    await runMigrations();
    await pool.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const name of (await readdir("db/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      const sql = await readFile(`db/migrations/${name}`, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existing = await pool.query(
        "SELECT checksum FROM schema_migrations WHERE name=$1",
        [name],
      );
      if (existing.rowCount) {
        if (existing.rows[0].checksum !== checksum)
          throw new Error(`Migration déjà appliquée et modifiée : ${name}`);
        continue;
      }
      await transaction(async (c) => {
        await c.query(sql);
        await c.query(
          "INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",
          [name, checksum],
        );
      });
    }
  } finally {
    await lock.query("SELECT pg_advisory_unlock(18442026)");
    lock.release();
  }
}
