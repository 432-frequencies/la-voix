import { useAuth } from "@/lib/AuthContext";
import React, { useState } from "react";
import { api } from "@/api/client";
import { Check, ThumbsDown, MinusCircle, ThumbsUp, Loader2, ShieldCheck } from "lucide-react";

const CHOICES = [
  { value: "pour", label: "Pour", icon: ThumbsUp, base: "border-border bg-card hover:border-vote", selected: "border-vote bg-vote/10", iconColor: "text-vote" },
  { value: "contre", label: "Contre", icon: ThumbsDown, base: "border-border bg-card hover:border-debate", selected: "border-debate bg-debate/10", iconColor: "text-debate" },
  { value: "abstention", label: "Je m'abstiens", icon: MinusCircle, base: "border-border bg-card hover:border-slate-400", selected: "border-slate-400 bg-muted", iconColor: "text-slate-500" },
];

function Step({ state, num, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          state === "todo" ? "border-2 border-border text-muted-foreground bg-card" : "bg-primary text-primary-foreground"
        }`}
      >
        {state === "done" ? <Check className="w-3.5 h-3.5" /> : num}
      </div>
      <span className={`text-[10px] font-semibold ${state === "todo" ? "text-muted-foreground" : "text-foreground"}`}>{label}</span>
    </div>
  );
}

export default function VotePanel({ lawId, myVote, onVoted }) {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  if (myVote && !editing) {
    const label = myVote.choice === "pour" ? "Pour" : myVote.choice === "contre" ? "Contre" : "Abstention";
    return (
      <div className="rounded-2xl border border-vote/30 bg-vote/5 p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-vote font-semibold mb-1">
          <ShieldCheck className="w-5 h-5" />
          Votre vote a été enregistré
        </div>
        <p className="text-sm text-muted-foreground">
          Vous avez voté <strong className="text-foreground">{label}</strong>. Votre choix individuel n’est pas affiché publiquement.
        </p>
        <button className="underline mt-3" onClick={() => {setEditing(true);setSelected(myVote.choice);}}>Modifier mon vote</button>
      </div>
    );
  }

  const confirm = async () => {
    if (!isAuthenticated) { navigateToLogin(); return; }
    if (!selected || voting) return;
    setVoting(true);
    setError("");
    try {
      const res = await api.functions.invoke("CastVote", { law_id: lawId, choice: selected });
      onVoted(res.data?.vote || { choice: selected }, res.data?.results);
      setEditing(false);
    } catch (e) {
      setError(e.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Fil d'étapes */}
      <div className="flex items-center justify-between max-w-xs mx-auto px-2">
        <Step state="done" num="1" label="Comprendre" />
        <div className="flex-1 h-px bg-border mx-1" />
        <Step state="active" num="2" label="Voter" />
        <div className="flex-1 h-px bg-border mx-1" />
        <Step state={selected ? "active" : "todo"} num="3" label="Confirmer" />
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-display text-xl font-bold leading-snug mb-1 text-center">
          Êtes-vous favorable à cette proposition de loi ?
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          Un vote consultatif par compte et par loi. Vous pouvez modifier votre choix.
        </p>
      </div>

      <div className="space-y-2.5">
        {CHOICES.map((c) => (
          <button
            key={c.value}
            onClick={() => setSelected(c.value)}
            disabled={voting}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all active:scale-[0.99] disabled:opacity-60 ${
              selected === c.value ? c.selected : c.base
            }`}
          >
            <c.icon className={`w-5 h-5 ${selected === c.value ? c.iconColor : "text-muted-foreground"}`} />
            <span className="font-semibold flex-1 text-left">{c.label}</span>
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected === c.value ? "border-vote" : "border-border"
              }`}
            >
              {selected === c.value && <span className="w-2.5 h-2.5 rounded-full bg-vote" />}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Seuls les résultats collectifs sont publics. Votre participation est rattachée à votre compte ; elle ne vérifie pas votre identité civile.
        </p>
      </div>

      <button
        onClick={confirm}
        disabled={(isAuthenticated && !selected) || voting}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25 transition-all active:scale-[0.99] disabled:opacity-40"
      >
        {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAuthenticated ? "Confirmer mon choix" : "Se connecter pour voter")}
        {!voting && <Check className="w-5 h-5" />}
      </button>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <p className="text-xs text-muted-foreground text-center">Expérience de démonstration — vote consultatif.</p>
    </div>
  );
}