import React from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, User } from "lucide-react";

const orientationConfig = {
  "gauche": { label: "Gauche", color: "bg-rose-100 text-rose-700 border-rose-200", bar: "bg-rose-500" },
  "centre-gauche": { label: "Centre-gauche", color: "bg-orange-100 text-orange-700 border-orange-200", bar: "bg-orange-500" },
  "centre": { label: "Centre", color: "bg-gray-100 text-gray-700 border-gray-200", bar: "bg-gray-500" },
  "centre-droite": { label: "Centre-droite", color: "bg-sky-100 text-sky-700 border-sky-200", bar: "bg-sky-500" },
  "droite": { label: "Droite", color: "bg-blue-100 text-blue-700 border-blue-200", bar: "bg-blue-600" },
  "neutre": { label: "Neutre", color: "bg-slate-100 text-slate-700 border-slate-200", bar: "bg-slate-400" },
};

export default function ArticleCard({ article }) {
  const conf = orientationConfig[article.orientation] || orientationConfig["neutre"];

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="relative pl-4 py-3 border-l-2 border-transparent hover:border-foreground/20 transition-all">
        <div className={`absolute left-0 top-3 bottom-3 w-0.5 ${conf.bar}`} />
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Badge variant="outline" className={`${conf.color} font-medium`}>
            {conf.label}
          </Badge>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <h4 className="font-medium text-sm leading-snug text-foreground group-hover:text-primary transition-colors mb-1">
          {article.title}
        </h4>
        {article.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{article.summary}</p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium">{article.source}</span>
          {article.journalist && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {article.journalist}
              </span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}