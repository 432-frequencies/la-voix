import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../server/db.ts";
import { backup } from "../server/backup.ts";
const file =
  process.argv[2] ||
  `backups/la-voix-${new Date().toISOString().replaceAll(":", "-")}.json`;
try {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await writeFile(file, JSON.stringify(await backup(pool)), {
    mode: 0o600,
    flag: "wx",
  });
  console.log(
    `Sauvegarde privée créée : ${file}. Elle contient les comptes et leurs secrets d’authentification ; ne pas la publier.`,
  );
} finally {
  await pool.end();
}
