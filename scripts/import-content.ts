import { readFile } from "node:fs/promises";
import { z } from "zod";
import { lawSchema, articleSchema } from "../server/domain.ts";
import { pool, transaction } from "../server/db.ts";
const filename = process.argv[2];
if (!filename)
  throw new Error("Usage : npm run content:import -- fichier.json [--apply]");
try {
  const bundle = z
    .object({
      laws: z.array(lawSchema.extend({ id: z.string().min(1) })).default([]),
      articles: z
        .array(articleSchema.extend({ id: z.string().min(1) }))
        .default([]),
    })
    .strict()
    .parse(JSON.parse(await readFile(filename, "utf8")));
  for (const rows of [bundle.laws, bundle.articles]) {
    const ids = rows.map((r) => r.id);
    if (new Set(ids).size !== ids.length)
      throw new Error("Identifiants dupliqués dans le fichier");
  }
  if (!process.argv.includes("--apply"))
    console.log(
      `Validation : ${bundle.laws.length} lois, ${bundle.articles.length} articles. Ajouter --apply pour importer.`,
    );
  else {
    await transaction(async (c) => {
      for (const { id, ...data } of bundle.laws)
        await c.query(
          "INSERT INTO laws(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_date=now()",
          [id, data],
        );
      for (const { id, law_id, ...data } of bundle.articles)
        await c.query(
          "INSERT INTO articles(id,law_id,data) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET law_id=excluded.law_id,data=excluded.data,updated_date=now()",
          [id, law_id, data],
        );
    });
    console.log(
      `Import terminé : ${bundle.laws.length} lois, ${bundle.articles.length} articles. Identifiants conservés.`,
    );
  }
} finally {
  await pool.end();
}
