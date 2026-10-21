import { seed } from "../server/seed.ts";
import { pool } from "../server/db.ts";
if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true")
  throw new Error("Le jeu fictif exige DEMO_MODE=true en production.");
try {
  await seed();
} finally {
  await pool.end();
}
