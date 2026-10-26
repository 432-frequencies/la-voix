import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const raw = process.env.IOS_RELEASE_API_ORIGIN;
if (!raw) throw new Error("Définir IOS_RELEASE_API_ORIGIN pour valider le build iOS.");
const url = new URL(raw);
if (
  url.protocol !== "https:" ||
  url.origin !== raw ||
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(url.hostname) ||
  /(?:\.local|(?:^|\.)example\.(?:org|com|net)|(?:^|\.)trycloudflare\.com)$/.test(url.hostname)
)
  throw new Error("Le build Release doit cibler une API HTTPS de production stable.");

const appDir = path.resolve("ios/App/App");
const config = JSON.parse(await readFile(path.join(appDir, "capacitor.config.json"), "utf8"));
if (config.server?.url) throw new Error("server.url distant interdit dans le build Release.");
const assetDir = path.join(appDir, "public/assets");
const files = (await readdir(assetDir)).filter((name) => name.endsWith(".js"));
const assets = (await Promise.all(files.map((name) => readFile(path.join(assetDir, name), "utf8")))).join("\n");
if (!assets.includes(url.origin))
  throw new Error("L’origine de production ne figure pas dans les ressources iOS. Relancer ios:sync.");
if (assets.includes("trycloudflare.com"))
  throw new Error("Une URL de tunnel de développement est présente dans le build iOS.");
console.log(`Build iOS vérifié : ressources locales, API ${url.origin}.`);
