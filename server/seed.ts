import { pool, transaction } from "./db.ts";
import { lawSchema } from "./domain.ts";
export async function seed() {
  // Never overwrite existing content or insert demonstration users with usable passwords.
  const future = new Date(Date.now() + 45 * 86400000)
    .toISOString()
    .slice(0, 10);
  const law = lawSchema.parse({
    title: "[Démo] Développer les bibliothèques de quartier",
    description:
      "Exemple fictif pour découvrir LA VOIX : ouvrir davantage les bibliothèques et faciliter leur accès.",
    full_text:
      "Article 1 — Les bibliothèques participantes proposent une ouverture supplémentaire chaque semaine.\n\nArticle 2 — Une évaluation publique est réalisée après un an.",
    category: "Éducation",
    status: "vote_programmé",
    vote_date: future,
    arguments_for: [
      "Faciliter l’accès à la culture.",
      "Offrir des espaces de travail gratuits.",
    ],
    arguments_against: [
      "Financement et effectifs à prévoir.",
      "Adapter les horaires aux besoins locaux.",
    ],
  });
  await transaction(async (c) => {
    await c.query(
      "INSERT INTO laws(id,data) VALUES($1,$2) ON CONFLICT DO NOTHING",
      ["demo-bibliotheques", law],
    );
    await c.query(
      "INSERT INTO articles(id,law_id,data) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
      [
        "demo-article-1",
        "demo-bibliotheques",
        {
          title: "[Démo] Présentation du projet",
          url: "https://example.org",
          source: "Source fictive",
          orientation: "neutre",
          summary:
            "Exemple d’article associé à la loi. Ce lien ne représente pas un média réel.",
        },
      ],
    );
  });
  console.log("Exemples fictifs disponibles. Aucun compte précréé.");
}
