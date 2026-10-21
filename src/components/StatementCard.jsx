import React from "react";
import moment from "moment";

const STANCES = [
  { key: "accord", label: "D'accord", active: "bg-vote text-primary-foreground border-transparent" },
  { key: "mitigé", label: "Mitigé", active: "bg-muted text-foreground border-transparent" },
  { key: "desaccord", label: "Pas d'accord", active: "bg-debate text-slate-900 border-transparent" },
];

export default function StatementCard({ statement, onStance, busy }) {
  const total = statement.total || 0;
  const pct = (v) => (total ? (v / total) * 100 : 0);
  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-4">
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {statement.consensus && (
          <span className="rounded-full bg-vote/15 text-vote px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
            Point de consensus
          </span>
        )}
        {statement.divergence && (
          <span className="rounded-full bg-debate/15 text-debate px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
            Clivant
          </span>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {moment(statement.created_date).fromNow()}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{statement.content}</p>
      {total > 0 && (
        <div className="mt-3">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
            <div className="bg-vote" style={{ width: `${pct(statement.accord)}%` }} />
            <div className="bg-slate-400" style={{ width: `${pct(statement.mitigé)}%` }} />
            <div className="bg-debate" style={{ width: `${pct(statement.desaccord)}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {statement.accord} d'accord · {statement.mitigé} mitigé · {statement.desaccord} pas d'accord
          </p>
        </div>
      )}
      {statement.is_mine ? <p className="text-xs text-muted-foreground mt-3">Votre avis</p> : <div className="flex gap-2 mt-3">
        {STANCES.map((s) => (
          <button
            key={s.key}
            onClick={() => onStance?.(statement, s.key)}
            disabled={busy}
            className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98] ${
              statement.my_stance === s.key
                ? s.active
                : "bg-background/60 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>}
    </div>
  );
}
