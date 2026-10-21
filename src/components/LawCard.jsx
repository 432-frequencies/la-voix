import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, Vote, Landmark, Flame } from "lucide-react";
import moment from "moment";

const categoryColors = {
  "Économie": "bg-blue-500/15 text-blue-600 font-semibold",
  "Social": "bg-rose-500/15 text-rose-600 font-semibold",
  "Environnement": "bg-emerald-500/15 text-emerald-600 font-semibold",
  "Justice": "bg-purple-500/15 text-purple-600 font-semibold",
  "Éducation": "bg-amber-500/15 text-amber-600 font-semibold",
  "Sécurité": "bg-red-500/15 text-red-600 font-semibold",
  "Institutionnel": "bg-indigo-500/15 text-indigo-600 font-semibold",
  "Autre": "bg-slate-500/15 text-slate-600 font-semibold",
};

const statusLabels = {
  "en_cours": "En cours",
  "vote_programmé": "Vote programmé",
  "adopté": "Adopté",
  "rejeté": "Rejeté",
};

const statusColors = {
  "en_cours": "bg-amber-100 text-amber-800 border-amber-200",
  "vote_programmé": "bg-blue-100 text-blue-800 border-blue-200",
  "adopté": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "rejeté": "bg-rose-100 text-rose-800 border-rose-200",
};

export default function LawCard({ law, results }) {
  const days = law.vote_date
    ? moment(law.vote_date).startOf("day").diff(moment().startOf("day"), "days")
    : null;
  const isUpcoming =
    days !== null && days >= 0 && (law.status === "en_cours" || law.status === "vote_programmé");
  const countdown =
    days === 0 ? "Vote aujourd'hui" : days === 1 ? "Vote demain" : `Dans ${days} jours`;
  const total = results?.total || 0;
  const pour = results?.pour || 0;
  const contre = results?.contre || 0;
  const abstention = results?.abstention || 0;
  const assemblyTotal = (law.assembly_for || 0) + (law.assembly_against || 0) + (law.assembly_abstain || 0);
  const pourPct = total ? (pour / total) * 100 : 0;
  const contrePct = total ? (contre / total) * 100 : 0;
  const abstentionPct = total ? (abstention / total) * 100 : 0;

  return (
    <Link to={`/loi/${law.id}`} className="block">
      <Card className="p-5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 border-2 border-border group rounded-2xl">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${categoryColors[law.category] || categoryColors["Autre"]} border-0`}>
              {law.category}
            </Badge>
            <Badge variant="outline" className={`${statusColors[law.status]} font-semibold`}>
              {statusLabels[law.status]}
            </Badge>
            {isUpcoming && (
              <Badge className="border-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-md shadow-fuchsia-500/25">
                <Flame className="w-3 h-3 mr-1" />
                {countdown}
              </Badge>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>

        <h3 className="font-display text-lg font-bold leading-snug mb-2 text-foreground tracking-tight">
          {law.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {law.description}
        </p>

        {law.vote_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>Vote Assemblée : {moment(law.vote_date).format("DD MMM YYYY")}</span>
          </div>
        )}

        {total > 0 ? (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Vote className="w-3.5 h-3.5" />
                {total} vote{total > 1 ? "s" : ""} citoyen{total > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              <div className="bg-vote" style={{ width: `${pourPct}%` }} />
              <div className="bg-slate-300" style={{ width: `${abstentionPct}%` }} />
              <div className="bg-debate" style={{ width: `${contrePct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] mt-1.5 text-muted-foreground">
              <span className="text-blue-600 font-semibold">Pour {Math.round(pourPct)}%</span>
              <span className="text-slate-500">Abst. {Math.round(abstentionPct)}%</span>
              <span className="text-amber-600">Contre {Math.round(contrePct)}%</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Vote className="w-3.5 h-3.5" />
            <span>Soyez le premier à voter</span>
          </div>
        )}

        {law.assembly_result !== "non_voté" && (
          <div className="text-xs mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
              <Landmark className="w-3.5 h-3.5" />
              <span>Assemblée (scrutin 2026) : <strong className={law.assembly_result === "pour" ? "text-primary" : "text-slate-600"}>{law.assembly_result === "pour" ? "Adopté" : "Rejeté"}</strong></span>
            </div>
            {(law.assembly_for || 0) + (law.assembly_against || 0) + (law.assembly_abstain || 0) > 0 && (
              <div className="flex h-1.5 rounded-full overflow-hidden bg-muted mb-1.5">
                <div className="bg-vote" style={{ width: `${((law.assembly_for || 0) / assemblyTotal) * 100}%` }} />
                <div className="bg-slate-300" style={{ width: `${((law.assembly_abstain || 0) / assemblyTotal) * 100}%` }} />
                <div className="bg-debate" style={{ width: `${((law.assembly_against || 0) / assemblyTotal) * 100}%` }} />
              </div>
            )}
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span className="text-blue-600 font-semibold">Députés pour {law.assembly_for || 0}</span>
              <span>Abst. {law.assembly_abstain || 0}</span>
              <span className="text-amber-600">Contre {law.assembly_against || 0}</span>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}