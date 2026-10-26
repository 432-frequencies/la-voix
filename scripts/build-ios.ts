import { spawnSync } from "node:child_process";

const raw = process.env.IOS_API_ORIGIN;
let origin: URL;
try {
  origin = new URL(raw || "");
} catch {
  throw new Error("Définir IOS_API_ORIGIN avec l’URL HTTPS de l’API de test.");
}
if (
  origin.protocol !== "https:" ||
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(origin.hostname) ||
  origin.hostname.endsWith(".local") ||
  origin.username ||
  origin.password ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash
)
  throw new Error("IOS_API_ORIGIN doit être une origine HTTPS publique, sans chemin ni identifiants.");

for (const args of [["run", "build"], ["exec", "--", "cap", "sync", "ios"]]) {
  const result = spawnSync("npm", args, {
    env: { ...process.env, VITE_API_ORIGIN: origin.origin },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
