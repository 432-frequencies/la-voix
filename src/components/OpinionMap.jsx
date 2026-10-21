import React from "react";
import { Compass } from "lucide-react";

const COLORS = ["#38bdf8", "#f59e0b", "#a855f7"];
const NAMES = ["Groupe A", "Groupe B", "Groupe C"];
const TOPS = [50, 24, 74];

export default function OpinionMap({ data }) {
  const clusters = (data?.clusters || []).filter((c) => c.size > 0);
  if (!clusters.length) return null;
  const participants = data.participants || 0;

  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-5">
      <h3 className="font-display font-bold text-sm flex items-center gap-2">
        <Compass className="w-4 h-4 text-primary" /> Carte des opinions
      </h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        {participants} participant{participants > 1 ? "s" : ""} regroupé{participants > 1 ? "s" : ""} selon leurs positionnements similaires.
      </p>

      <div className="relative h-40 rounded-2xl bg-background/50 border border-border mb-5 overflow-hidden">
        <div
          className="absolute left-4 right-4 bottom-5 h-1 rounded-full"
          style={{ background: "linear-gradient(90deg, #f59e0b, #94a3b8, #38bdf8)" }}
        />
        <span className="absolute left-4 bottom-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Pas d'accord</span>
        <span className="absolute right-4 bottom-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">D'accord</span>
        {clusters.map((c, i) => {
          const pos = Math.min(100, Math.max(0, ((c.axis + 1) / 2) * 100));
          const size = 44 + Math.sqrt(c.share) * 52;
          const color = COLORS[i % COLORS.length];
          const top = Math.min(140 - size, Math.max(8, TOPS[i % TOPS.length] - size / 2));
          return (
            <div
              key={i}
              className="absolute rounded-full flex items-center justify-center border-2"
              style={{
                width: size,
                height: size,
                left: `calc(${pos}% - ${size / 2}px)`,
                top,
                background: `${color}26`,
                borderColor: color,
              }}
            >
              {data.my_cluster === i && (
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>Vous</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {clusters.map((c, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div key={i} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-sm font-semibold">{NAMES[i % NAMES.length]}</span>
                <span className="text-xs text-muted-foreground">{Math.round(c.share * 100)}% des participants</span>
                {data.my_cluster === i && (
                  <span className="rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">Vous</span>
                )}
              </div>
              {(c.label_statements || []).map((s, j) => (
                <p key={j} className="text-xs text-foreground/90 flex items-start gap-2 mt-1.5">
                  <span className={`font-bold shrink-0 tabular-nums ${s.mean > 0 ? "text-vote" : s.mean < 0 ? "text-debate" : "text-muted-foreground"}`}>
                    {s.mean > 0 ? "+" : ""}{Math.round(s.mean * 100)}
                  </span>
                  {s.content}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}