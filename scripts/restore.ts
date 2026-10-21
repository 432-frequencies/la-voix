import { readFile } from "node:fs/promises";
import { pool } from "../server/db.ts";
import { restore } from "../server/backup.ts";
const file = process.argv[2];
if (!file)
  throw new Error(
    "Usage : npm run db:restore -- sauvegarde.json (base cible déjà migrée et vide)",
  );
try {
  console.log(await restore(pool, JSON.parse(await readFile(file, "utf8"))));
} finally {
  await pool.end();
}
