import React from "react";
import { GROUP_ORDER, SHORT_NAMES } from "./assemblyGroups";

export default function HemicycleChart({ groups }) {
  const voting = (groups || [])
    .map((g) => {
      const meta = GROUP_ORDER.find((m) => m.groupe === g.groupe) || { color: "#6b7280", family: "—" };
      return {
        ...g,
        color: meta.color,
        family: meta.family,
        votes: (g.pour || 0) + (g.contre || 0) + (g.abstention || 0),
      };
    })
    .filter((g) => g.votes > 0)
    .sort((a, b) => {
      const ia = GROUP_ORDER.findIndex((m) => m.groupe === a.groupe);
      const ib = GROUP_ORDER.findIndex((m) => m.groupe === b.groupe);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

  if (voting.length === 0) return null;

  const total = voting.reduce((t, g) => t + g.votes, 0);

  // Répartition des sièges par rangée (hémicycle)
  const rowCount = Math.max(3, Math.min(10, Math.round(Math.sqrt(total / 2.2)) + 2));
  const weights = Array.from({ length: rowCount }, (_, i) => rowCount - i);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const rows = weights.map((w) => Math.max(1, Math.round((total * w) / wSum)));
  let drift = total - rows.reduce((a, b) => a + b, 0);
  let i = rowCount - 1;
  while (drift !== 0) {
    rows[i] += drift > 0 ? 1 : -1;
    if (rows[i] < 1) rows[i] = 1;
    drift += drift > 0 ? -1 : 1;
    i = (i - 1 + rowCount) % rowCount;
  }

  // Attribution des sièges : de la rangée extérieure vers l'intérieure, gauche -> droite
  const seatList = [];
  const r0 = 62;
  const dr = 13.5;
  rows.forEach((count, rowIdx) => {
    const r = r0 + (rowCount - 1 - rowIdx) * dr;
    for (let j = 0; j < count; j++) {
      const angle = Math.PI - (Math.PI * (j + 0.5)) / count;
      seatList.push({ x: 200 + r * Math.cos(angle), y: 195 - r * Math.sin(angle), angle });
    }
  });

  // Chaque groupe occupe un bloc de sièges (gauche -> droite). Le vote est encodé
  // dans le rendu du siège : plein = pour, contour = contre, pâle = abstention.
  let idx = 0;
  const seatData = new Array(seatList.length);
  voting.forEach((g) => {
    const seq = [
      ["pour", g.pour || 0],
      ["contre", g.contre || 0],
      ["abstention", g.abstention || 0],
    ];
    seq.forEach(([type, n]) => {
      for (let k = 0; k < n && idx < seatData.length; k++, idx++) seatData[idx] = { type, color: g.color };
    });
  });

  const seatR = Math.max(2.2, 3.4 - rowCount * 0.12);

  return (
    <div>
      <div className="rounded-2xl bg-background/50 border border-border p-3">
        <svg viewBox="0 0 400 214" className="w-full h-auto">
          {seatList.map((s, i) => {
            const d = seatData[i];
            if (!d) return null;
            if (d.type === "contre") {
              return <circle key={i} cx={s.x} cy={s.y} r={seatR - 0.6} fill="none" stroke={d.color} strokeWidth={1.5} />;
            }
            return (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={seatR}
                fill={d.color}
                opacity={d.type === "abstention" ? 0.3 : 1}
              />
            );
          })}
          <text x="200" y="185" textAnchor="middle" className="fill-foreground" style={{ fontSize: 15, fontWeight: 700 }}>
            {total}
          </text>
          <text x="200" y="198" textAnchor="middle" style={{ fontSize: 8, fill: "hsl(220, 20%, 65%)" }}>
            députés votants
          </text>
        </svg>

        {/* Axe politique gauche -> droite */}
        <div className="mt-2">
          <div
            className="h-1.5 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #c53030, #ef4444, #f472b6, #34d399, #94a3b8, #fb923c, #fbbf24, #38bdf8, #3b82f6, #1e40af, #4a5fb0)",
            }}
          />
          <div className="flex justify-between mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Gauche</span>
            <span>Centre</span>
            <span>Droite</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-2.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "hsl(220, 20%, 65%)" }} />Pour
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border-2" style={{ borderColor: "hsl(220, 20%, 65%)", background: "transparent" }} />Contre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full opacity-30" style={{ background: "hsl(220, 20%, 65%)" }} />Abstention
          </span>
        </div>
      </div>

      {/* Répartition par groupe, de la gauche vers la droite */}
      <div className="mt-3 space-y-1.5">
        {voting.map((g) => {
          const gv = g.votes;
          return (
            <div key={g.groupe} className="flex items-center gap-2.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color }} title={g.family} />
              <span className="w-16 shrink-0 font-semibold text-foreground truncate" title={`${g.groupe} · ${g.family}`}>
                {SHORT_NAMES[g.groupe] || g.groupe}
              </span>
              <div className="flex h-1.5 flex-1 rounded-full overflow-hidden bg-muted">
                <div style={{ width: `${((g.pour || 0) / gv) * 100}%`, background: g.color }} />
                <div style={{ width: `${((g.contre || 0) / gv) * 100}%`, background: g.color, opacity: 0.3 }} />
              </div>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {g.pour || 0}P · {g.contre || 0}C · {g.abstention || 0}A
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}