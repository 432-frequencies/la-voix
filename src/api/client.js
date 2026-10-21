export async function request(
  path,
  body,
  method = body === undefined ? "GET" : "POST",
) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
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
