import React from "react";
import { Link } from "react-router-dom";
import { ArrowBigUp } from "lucide-react";
import moment from "moment";

export const STATUS_LABELS = {
  "proposée": "Proposée",
  "en_debat": "En débat",
  "transmise": "Transmise",
  "integree": "Intégrée",
};

export const STATUS_STYLES = {
  "proposée": "bg-secondary text-secondary-foreground",
  "en_debat": "bg-debate/15 text-debate",
  "transmise": "bg-vote/15 text-vote",
  "integree": "bg-vote/25 text-vote",
};

export default function ReformCard({ reform, supports, mySupport, onSupport, busy }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-4 flex gap-3 items-stretch">
      <button
        onClick={(e) => { e.preventDefault(); onSupport?.(); }}
        disabled={busy}
        className={`shrink-0 flex flex-col items-center justify-center w-14 rounded-xl border transition-all active:scale-95 ${
          mySupport
            ? "bg-vote text-primary-foreground border-transparent"
            : "bg-background/60 border-border text-muted-foreground hover:text-foreground hover:border-vote/50"
        }`}
      >
        <ArrowBigUp className={`w-5 h-5 ${mySupport ? "fill-current" : ""}`} />
        <span className="text-sm font-bold">{supports ?? 0}</span>
      </button>
      <Link to={`/reforme/${reform.id}`} className="min-w-0 flex-1 group">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[reform.status] || STATUS_STYLES["proposée"]}`}>
            {STATUS_LABELS[reform.status] || reform.status}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
            {reform.category}
          </span>
        </div>
        <h3 className="font-display font-bold leading-snug group-hover:text-vote transition-colors">{reform.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{reform.summary}</p>
        <p className="text-[10px] text-muted-foreground mt-2">Proposée {moment(reform.created_date).fromNow()}</p>
      </Link>
    </div>
  );
}