import { z } from "zod";
import { pool } from "./db.ts";
import { get } from "./domain.ts";
import type { User } from "./auth.ts";
type Vector = Record<string, number>;
function distance(a: Vector, b: Vector) {
  let sum = 0,
    common = 0;
  for (const dim in a)
    if (dim in b) {
      sum += (a[dim] - b[dim]) ** 2;
      common++;
    }
  return common ? Math.sqrt(sum) : 999;
}
export async function opinionMap(body: unknown, user: User | null) {
  const { reform_id } = z.object({ reform_id: z.string().min(1) }).parse(body);
  await get("Reform", reform_id, user);
  const result = await pool.query(
    "SELECT t.created_by_id,t.statement_id,t.choice,s.content FROM stances t JOIN statements s ON s.id=t.statement_id WHERE t.reform_id=$1 ORDER BY t.created_by_id,t.statement_id",
    [reform_id],
  );
  const vectors: Record<string, Vector> = {};
  const contents: Record<string, string> = {};
  const scores: Record<string, number> = {
    accord: 1,
    mitigé: 0,
    desaccord: -1,
  };
  for (const row of result.rows) {
    vectors[row.created_by_id] ??= {};
    vectors[row.created_by_id][row.statement_id] = scores[row.choice];
    contents[row.statement_id] = row.content;
  }
  const ids = Object.keys(vectors);
  if (!ids.length) return { participants: 0, my_cluster: null, clusters: [] };
  let seed = ids[0];
  for (const id of ids)
    if (Object.keys(vectors[id]).length > Object.keys(vectors[seed]).length)
      seed = id;
  let centers = [vectors[seed]];
  const k = ids.length < 4 ? 1 : ids.length < 10 ? 2 : 3;
  while (centers.length < k) {
    let best: Vector | null = null,
      bestDistance = -1;
    for (const id of ids) {
      const v = vectors[id];
      if (centers.includes(v)) continue;
      const d = Math.min(...centers.map((c) => distance(v, c)));
      if (d > bestDistance) {
        bestDistance = d;
        best = v;
      }
    }
    if (!best) break;
    centers.push(best);
  }
  const mean = (members: string[]) => {
    const sums: Vector = {},
      counts: Vector = {};
    for (const id of members)
      for (const dim in vectors[id]) {
        sums[dim] = (sums[dim] || 0) + vectors[id][dim];
        counts[dim] = (counts[dim] || 0) + 1;
      }
    return {
      sums,
      counts,
      vector: Object.fromEntries(
        Object.keys(sums).map((dim) => [dim, sums[dim] / counts[dim]]),
      ),
    };
  };
  let groups: string[][] = [];
  for (let i = 0; i < 20; i++) {
    groups = centers.map(() => []);
    for (const id of ids) {
      let index = 0,
        dist = Infinity;
      centers.forEach((c, j) => {
        const d = distance(vectors[id], c);
        if (d < dist) {
          index = j;
          dist = d;
        }
      });
      groups[index].push(id);
    }
    centers = groups.map((members, j) =>
      members.length ? mean(members).vector : centers[j],
    );
  }
  const kept = groups.filter((g) => g.length);
  const my = kept.findIndex((g) => user && g.includes(user.id));
  return {
    participants: ids.length,
    my_cluster: my < 0 ? null : my,
    clusters: kept.map((members) => {
      const { sums, counts } = mean(members);
      const dimensions = Object.keys(sums);
      return {
        size: members.length,
        share: members.length / ids.length,
        axis:
          dimensions.reduce((s, d) => s + sums[d], 0) /
          dimensions.reduce((s, d) => s + counts[d], 0),
        label_statements: dimensions
          .map((d) => ({
            statement_id: d,
            content: contents[d],
            mean: sums[d] / counts[d],
            n: counts[d],
          }))
          .sort(
            (a, b) =>
              Math.abs(b.mean) - Math.abs(a.mean) ||
              a.statement_id.localeCompare(b.statement_id),
          )
          .slice(0, 2),
      };
    }),
  };
}
