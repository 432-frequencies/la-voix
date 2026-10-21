import "dotenv/config";
export const production = process.env.NODE_ENV === "production";
export const appURL = process.env.APP_URL || "http://localhost:5173";
export const databaseURL = process.env.DATABASE_URL;
if (!databaseURL)
  throw new Error(
    "DATABASE_URL manquant. Lancez npm run dev ou configurez .env.",
  );
if (
  !process.env.BETTER_AUTH_SECRET ||
  process.env.BETTER_AUTH_SECRET.length < 32
)
  throw new Error(
    "BETTER_AUTH_SECRET doit contenir au moins 32 caractères aléatoires.",
  );
if (production && (!appURL.startsWith("https://") || !process.env.SMTP_HOST))
  throw new Error("La production nécessite APP_URL en HTTPS et SMTP_HOST.");
export const localMail = !production && !process.env.SMTP_HOST;
