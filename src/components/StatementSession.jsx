import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import React, { useState } from "react";
import { api } from "@/api/client";
import { Handshake, MinusCircle, XCircle, SkipForward, CheckCircle2, Sparkles } from "lucide-react";

const CHOICES = [
  { key: "accord", label: "D'accord", icon: Handshake },
  { key: "mitigé", label: "Mitigé", icon: MinusCircle },
  { key: "desaccord", label: "Pas d'accord", icon: XCircle },
];

export default function StatementSession({ reformId, queue, onFinish }) {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const statement = queue[index];

  if (!statement) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur p-8 text-center">
        <CheckCircle2 className="w-8 h-8 mx-auto text-vote mb-3" />
        <p className="font-display font-bold">Vous avez passé en revue tous les avis</p>
        <p className="text-xs text-muted-foreground mt-1">Votre positionnement alimente la carte des opinions.</p>
      </div>
    );
  }

  const advance = () => {
    const wasLast = index + 1 >= queue.length;
    setIndex(index + 1);
    if (wasLast) onFinish?.();
  };

  const choose = async (choice) => {
    if (!isAuthenticated) { navigateToLogin(); return; }
    setBusy(true);
    try {
      await api.entities.ReformStance.create({ reform_id: reformId, statement_id: statement.id, choice });
      advance();
    } catch (error) {
      toast({ title: "Action impossible", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-vote/30 bg-gradient-to-br from-vote/10 via-card/60 to-card/60 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-vote">
          <Sparkles className="w-3.5 h-3.5" /> Session de vote
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">Avis {index + 1} / {queue.length}</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden mb-4">
        <div className="h-full bg-vote rounded-full transition-all duration-300" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>
      <p className="text-lg leading-relaxed font-medium text-center py-6">{statement.content}</p>
      <div className={`flex gap-2 ${busy ? "opacity-50 pointer-events-none" : ""}`}>
        {CHOICES.map((c) => (
          <button
            key={c.key}
            onClick={() => choose(c.key)}
            disabled={busy}
            className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-xl border border-border bg-background/50 transition-all active:scale-[0.97]"
          >
            <c.icon className="w-5 h-5" />
            <span className="text-xs font-semibold">{c.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={advance}
        disabled={busy}
        className="w-full flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground font-semibold py-2"
      >
        Passer cet avis <SkipForward className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}