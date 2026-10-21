import { seed } from "../server/seed.ts";
import { pool } from "../server/db.ts";
if (process.env.NODE_ENV === "production")
  throw new Error("Le jeu de démonstration est réservé au développement.");
try {
  await seed();
} finally {
  await pool.end();
}
