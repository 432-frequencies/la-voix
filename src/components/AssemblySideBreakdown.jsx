import React from "react";
import { GROUP_ORDER } from "./assemblyGroups";

const SIDES = [
  { key: "gauche", label: "Gauche", color: "#ef4444" },
  { key: "centre", label: "Centre", color: "#fbbf24" },
  { key: "droite", label: "Droite", color: "#3b82f6" },
];

function familyOf(groupe) {
  const f = GROUP_ORDER.find((m) => m.groupe === groupe)?.family;
  return f ? f.toLowerCase() : "autres";
}

export default function AssemblySideBreakdown({ groups }) {
  const stats = SIDES.map((s) => {
    const gs = (groups || []).filter((g) => familyOf(g.groupe) === s.key);
    const pour = gs.reduce((t, g) => t + (g.pour || 0), 0);
    const contre = gs.reduce((t, g) => t + (g.contre || 0), 0);
    const abstention = gs.reduce((t, g) => t + (g.abstention || 0), 0);
    return { ...s, pour, contre, abstention, total: pour + contre + abstention };
  });

  const totalPour = stats.reduce((t, s) => t + s.pour, 0);
  const totalAll = stats.reduce((t, s) => t + s.total, 0);
  if (totalAll === 0) return null;

  const leading = [...stats].sort((a, b) => b.pour - a.pour)[0];
  const leadingPct = totalPour ? Math.round((leading.pour / totalPour) * 100) : 0;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Par camp politique
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.key} className="rounded-xl border border-border bg-background/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="font-display text-sm font-bold">{s.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{s.total} votants</span>
            </div>
            {s.total > 0 ? (
              <>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
                  <div style={{ width: `${(s.pour / s.total) * 100}%`, background: s.color }} />
                  <div style={{ width: `${(s.contre / s.total) * 100}%`, background: s.color, opacity: 0.25 }} />
                  <div style={{ width: `${(s.abstention / s.total) * 100}%`, background: "hsl(220, 15%, 45%)", opacity: 0.4 }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>
                    <strong className="text-foreground">{Math.round((s.pour / s.total) * 100)}%</strong> pour
                  </span>
                  <span>{s.contre} contre</span>
                  <span>{s.abstention} abst.</span>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground">Aucun vote enregistré</p>
            )}
          </div>
        ))}
      </div>
      {leading.pour > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Ce texte a été soutenu majoritairement par la{" "}
          <strong className="text-foreground" style={{ color: leading.color }}>
            {leading.label.toLowerCase()}
          </strong>{" "}
          ({leadingPct}% des voix « pour »).
        </p>
      )}
    </div>
  );
}