import express from "express";
import { rateLimit } from "express-rate-limit";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import { auth } from "./auth.ts";
import { pool } from "./db.ts";
import { appURL, production, localMail } from "./config.ts";
import { readLocalMail } from "./mail.ts";
import {
  HttpError,
  list,
  get,
  create,
  update,
  castVote,
  voteResults,
  supportReform,
  reformFeed,
  overview,
} from "./domain.ts";
import { opinionMap } from "./opinion.ts";
import path from "node:path";
export const app = express();
const iosOrigin = process.env.IOS_APP_ORIGIN;
app.disable("x-powered-by");
// Only configure proxy trust when the deployment actually has that many trusted hops.
if (process.env.TRUST_PROXY_HOPS)
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", (req, res, next) => {
  if (iosOrigin && req.headers.origin === iosOrigin) {
    res.setHeader("Access-Control-Allow-Origin", iosOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Expose-Headers", "set-auth-token");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.vary("Origin");
    if (req.method === "OPTIONS") return res.sendStatus(204);
  }
  next();
});
app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin !== new URL(appURL).origin &&
    req.headers.origin !== iosOrigin
  )
    return res.status(403).json({ error: "Origine de la requête refusée." });
  next();
});
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Trop de requêtes. Réessayez dans une minute." },
  }),
);
app.use("/api/auth", (req, _res, next) => {
  req.headers["x-client-ip"] = req.ip || req.socket.remoteAddress || "";
  next();
});
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json({ limit: "256kb" }));
app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});
app.get("/api/config", (_req, res) =>
  res.json({
    localMail,
    google: !!process.env.GOOGLE_CLIENT_ID,
    demo: process.env.DEMO_MODE === "true",
  }),
);
if (localMail)
  app.get("/api/dev/mail", async (req, res) => {
    // The inbox is a development-only tool containing verification links. Never expose it remotely.
    const address = req.socket.remoteAddress || "";
    if (
      !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address) ||
      !["localhost", "127.0.0.1"].includes(req.hostname)
    )
      throw new HttpError(403, "Boîte locale uniquement.");
    res.json(await readLocalMail());
  });
app.use("/api", async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.locals.user = session?.user || null;
  next();
});
app.get("/api/me", (_req, res) => res.json(res.locals.user));
app.post("/api/entities/:entity/query", async (req, res) =>
  res.json(await list(String(req.params.entity), req.body, res.locals.user)),
);
app.get("/api/entities/:entity/:id", async (req, res) =>
  res.json(
    await get(
      String(req.params.entity),
      String(req.params.id),
      res.locals.user,
    ),
  ),
);
app.post("/api/entities/:entity", async (req, res) =>
  res
    .status(201)
    .json(await create(String(req.params.entity), req.body, res.locals.user)),
);
app.patch("/api/entities/:entity/:id", async (req, res) =>
  res.json(
    await update(
      String(req.params.entity),
      String(req.params.id),
      req.body,
      res.locals.user,
    ),
  ),
);
app.post("/api/actions/:name", async (req, res) => {
  const user = res.locals.user;
  let result;
  switch (req.params.name) {
    case "CastVote":
      result = await castVote(req.body, user);
      break;
    case "GetVoteResults": {
      const d = z.object({ law_id: z.string().optional() }).parse(req.body);
      result = await voteResults(d.law_id);
      break;
    }
    case "GetReformFeed":
      result = await reformFeed(req.body, user);
      break;
    case "SupportReform":
      result = await supportReform(req.body, user);
      break;
    case "GetReformOverview":
      result = await overview(req.body, user);
      break;
    case "GetOpinionMap":
      result = await opinionMap(req.body, user);
      break;
    default:
      throw new HttpError(404, "Fonction indisponible.");
  }
  res.json(result);
});
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Route inconnue." }),
);
if (production || process.env.SERVE_WEB === "true") {
  app.use(express.static(path.resolve("dist")));
  app.get("/{*splat}", (_req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
}
app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof z.ZodError)
      return res.status(400).json({
        error: "Données invalides.",
        details: error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      });
    if (error instanceof HttpError)
      return res.status(error.status).json({ error: error.message });
    if (error.code === "23503")
      return res
        .status(400)
        .json({ error: "Une référence est introuvable ou incompatible." });
    if (error.code === "23505")
      return res.status(409).json({ error: "Cet élément existe déjà." });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "JSON invalide." });
    console.error("Erreur serveur", error.code || error.name);
    res
      .status(500)
      .json({ error: "Le serveur n’a pas pu traiter la demande." });
  },
);
