import { apiOrigin, isNativeApp } from "@/lib/runtime";
import {
  nativeSessionToken,
  saveNativeSession,
  clearNativeSession,
} from "@/lib/native-session";

export async function request(
  path,
  body,
  method = body === undefined ? "GET" : "POST",
) {
  if (isNativeApp && !apiOrigin)
    throw new Error("Adresse de l’API iPhone non configurée.");
  const token = await nativeSessionToken();
  const response = await fetch(`${apiOrigin}/api${path}`, {
    method,
    credentials: isNativeApp ? "omit" : "same-origin",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (isNativeApp && response.ok) {
    const issuedToken = response.headers.get("set-auth-token");
    if (issuedToken) await saveNativeSession(issuedToken);
    if (path === "/auth/sign-out") await clearNativeSession();
  }
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("Réponse serveur invalide. Réessayez dans un instant.");
  }
  if (!raw && !response.ok)
    throw new Error("Serveur indisponible. Réessayez dans un instant.");
  if (!response.ok) {
    const error = new Error(
      data.error || data.message || "La demande a échoué.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
const names = [
  "Law",
  "Article",
  "Vote",
  "Reform",
  "ReformSupport",
  "ReformStatement",
  "ReformStance",
];
export const api = {
  entities: Object.fromEntries(
    names.map((name) => [
      name,
      {
        filter: (query = {}, options = {}) =>
          request(`/entities/${name}/query`, { query, options }),
        count: async (query = {}) =>
          (
            await request(`/entities/${name}/query`, {
              query,
              options: { limit: 1 },
            })
          ).total,
        get: (id) => request(`/entities/${name}/${encodeURIComponent(id)}`),
        create: (body) => request(`/entities/${name}`, body),
        update: (id, body) =>
          request(`/entities/${name}/${encodeURIComponent(id)}`, body, "PATCH"),
      },
    ]),
  ),
  functions: {
    invoke: async (name, body = {}) => ({
      data: await request(`/actions/${name}`, body),
    }),
  },
  auth: { me: () => request("/me") },
};
