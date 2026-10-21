import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { Landmark, Check, X, ChevronRight } from "lucide-react";
import moment from "moment";

export default function PastVotes() {
  const [laws, setLaws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const page = await api.entities.Law.filter(
          { assembly_result: { $ne: "non_voté" } },
          { sort: "-vote_date", limit: 50 }
        );
        setLaws(page.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || laws.length === 0) return null;

  const adopted = laws.filter((l) => l.assembly_result === "pour");
  const rejected = laws.filter((l) => l.assembly_result === "contre");

  const Row = ({ law }) => {
    const total = (law.assembly_for || 0) + (law.assembly_against || 0) + (law.assembly_abstain || 0);
    const isAdopted = law.assembly_result === "pour";
    return (
      <Link to={`/loi/${law.id}`} className="block">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-3.5 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isAdopted ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
              }`}
            >
              {isAdopted ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {isAdopted ? "Adopté" : "Rejeté"}
            </span>
            <span className="text-[10px] text-muted-foreground">{moment(law.vote_date).format("DD MMM YYYY")}</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
          </div>
          <h4 className="font-display text-sm font-bold leading-snug line-clamp-2 mb-2.5">{law.title}</h4>
          {total > 0 && (
            <div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                <div className="bg-vote" style={{ width: `${((law.assembly_for || 0) / total) * 100}%` }} />
                <div className="bg-slate-300" style={{ width: `${((law.assembly_abstain || 0) / total) * 100}%` }} />
                <div className="bg-debate" style={{ width: `${((law.assembly_against || 0) / total) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[10px] mt-1.5 text-muted-foreground">
                <span className="text-blue-400 font-semibold">Députés pour {law.assembly_for || 0}</span>
                <span>Abst. {law.assembly_abstain || 0}</span>
                <span className="text-amber-400">Contre {law.assembly_against || 0}</span>
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-2.5">
        <Landmark className="w-4 h-4 text-debate" />
        <h3 className="font-display font-bold">Votes passés · Scrutins 2026</h3>
      </div>
      <div className="space-y-4">
        {adopted.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80 mb-2">
              Adoptés ({adopted.length})
            </p>
            <div className="space-y-2.5">
              {adopted.map((law) => <Row key={law.id} law={law} />)}
            </div>
          </div>
        )}
        {rejected.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300/80 mb-2">
              Rejetés ({rejected.length})
            </p>
            <div className="space-y-2.5">
              {rejected.map((law) => <Row key={law.id} law={law} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}