import { migrate } from "../server/migrate.ts";
import { pool } from "../server/db.ts";
try {
  await migrate();
  console.log("Migrations terminées.");
} finally {
  await pool.end();
}
