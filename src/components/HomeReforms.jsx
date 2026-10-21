import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { ArrowBigUp, Lightbulb } from "lucide-react";

export default function HomeReforms() {
  const [top, setTop] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.functions.invoke("GetReformFeed", {});
        const supports = res.data?.supports || {};
        const sorted = (res.data?.reforms || []).slice(0, 3).map((r) => ({ ...r, count: supports[r.id] || 0 }));
        setTop(sorted);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (!top.length) return null;

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-debate" /> Réformes citoyennes
        </h3>
        <Link to="/reformes" className="text-xs font-semibold text-vote">Proposer la vôtre</Link>
      </div>
      <div className="space-y-2">
        {top.map((r) => (
          <Link
            key={r.id}
            to={`/reforme/${r.id}`}
            className="block rounded-2xl border border-border bg-card/70 backdrop-blur p-3.5 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-vote/15 text-vote px-2 py-1.5 text-xs font-bold">
                <ArrowBigUp className="w-3.5 h-3.5" />
                {r.count}
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold leading-snug line-clamp-1">{r.title}</h4>
                <p className="text-[10px] text-muted-foreground">{r.category}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}