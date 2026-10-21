import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/api/client";
import { Card } from "@/components/ui/card";
import StatementCard from "@/components/StatementCard";
import StatementSession from "@/components/StatementSession";
import OpinionMap from "@/components/OpinionMap";
import { STATUS_LABELS, STATUS_STYLES } from "@/components/ReformCard";
import {
  ArrowLeft, Loader2, ArrowBigUp, Send, Users, TriangleAlert,
  Landmark, Lightbulb, Handshake
} from "lucide-react";
import moment from "moment";

const THRESHOLD = 25;

export default function ReformDetail() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [reform, setReform] = useState(null);
  const [overview, setOverview] = useState(null);
  const [targetLaw, setTargetLaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busySupport, setBusySupport] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [busyStance, setBusyStance] = useState(false);
  const [opinionMap, setOpinionMap] = useState(null);
  const [viewMode, setViewMode] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [reformData, ov] = await Promise.all([
          api.entities.Reform.get(id),
          api.functions.invoke("GetReformOverview", { reform_id: id }),
        ]);
        setReform(reformData);
        setOverview(ov.data);
        try {
          const om = await api.functions.invoke("GetOpinionMap", { reform_id: id });
          setOpinionMap(om.data);
        } catch (omErr) { console.error(omErr); }
        if (reformData.target_law_id) {
          try { setTargetLaw(await api.entities.Law.get(reformData.target_law_id)); } catch (e) { console.error(e); }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSupport = async () => {
    if (!isAuthenticated) { navigateToLogin(); return; }
    setBusySupport(true);
    try {
      const res = await api.functions.invoke("SupportReform", { reform_id: id, supported: !overview?.my_support });
      const d = res.data;
      setOverview((o) => ({ ...o, supports: d.supports, my_support: d.supported }));
      setReform((r) => ({ ...r, status: d.status }));
    } catch (error) {
      toast({ title: "Action impossible", description: error.message, variant: "destructive" });
    } finally {
      setBusySupport(false);
    }
  };

  const handleStance = async (statement, choice) => {
    if (!isAuthenticated) { navigateToLogin(); return; }
    if (statement.my_stance === choice) return;
    setBusyStance(true);
    try {
      const existing = await api.entities.ReformStance.filter(
        { statement_id: statement.id, reform_id: id },
        { limit: 1 }
      );
      if (existing.items?.length) {
        await api.entities.ReformStance.update(existing.items[0].id, { choice });
      } else {
        await api.entities.ReformStance.create({ statement_id: statement.id, reform_id: id, choice });
      }
      const ov = await api.functions.invoke("GetReformOverview", { reform_id: id });
      setOverview(ov.data);
    } catch (error) {
      toast({ title: "Action impossible", description: error.message, variant: "destructive" });
    } finally {
      setBusyStance(false);
    }
  };

  const postStatement = async () => {
    if (!isAuthenticated) { navigateToLogin(); return; }
    const content = text.trim();
    if (!content) return;
    setPosting(true);
    try {
      await api.entities.ReformStatement.create({ reform_id: id, content });
      setText("");
      const ov = await api.functions.invoke("GetReformOverview", { reform_id: id });
      setOverview(ov.data);
    } catch (error) {
      toast({ title: "Action impossible", description: error.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const refreshOverview = async () => {
    try {
      const ov = await api.functions.invoke("GetReformOverview", { reform_id: id });
      setOverview(ov.data);
    } catch (e) { console.error(e); }
  };

  const myUserId = overview?.user_id;
  const queue = useMemo(() => {
    const q = (overview?.statements || []).filter((s) => !s.my_stance && !s.is_mine);
    const arr = [...q];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [overview, myUserId]);

  if (loading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reform) {
    return (
      <div className="dark min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Réforme introuvable.</p>
        <Link to="/reformes" className="text-vote font-semibold underline">Retour aux réformes</Link>
      </div>
    );
  }

  const supports = overview?.supports ?? 0;
  const mySupport = !!overview?.my_support;
  const statements = overview?.statements || [];
  const effectiveView = viewMode || (queue.length > 0 ? "session" : "liste");
  const consensus = statements.filter((s) => s.consensus);
  const divergence = statements.filter((s) => s.divergence);
  const progress = Math.min(100, (supports / THRESHOLD) * 100);

  return (
    <div className="dark min-h-screen bg-background text-foreground relative overflow-hidden pt-[env(safe-area-inset-top)]">
      <div className="pointer-events-none absolute -top-32 -right-24 w-80 h-80 rounded-full bg-vote/15 blur-3xl" />
      <header className="relative z-30 sticky top-0 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-sm uppercase tracking-wide flex-1">Réforme citoyenne</h1>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-5 pb-16 space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[reform.status] || STATUS_STYLES["proposée"]}`}>
              {STATUS_LABELS[reform.status] || reform.status}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              {reform.category}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight tracking-tight">{reform.title}</h2>
          <p className="text-sm text-foreground/90 leading-relaxed mt-2">{reform.summary}</p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Proposée {moment(reform.created_date).fromNow()} · pipeline façon vTaiwan
          </p>
        </div>

        {reform.detail && (
          <Card className="p-5 rounded-2xl">
            <h3 className="font-display font-bold mb-2 text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-debate" /> Le détail
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{reform.detail}</p>
          </Card>
        )}

        {targetLaw && (
          <Link to={`/loi/${targetLaw.id}`} className="block">
            <Card className="p-4 rounded-2xl border-primary/20 bg-primary/5 flex items-center gap-3 hover:border-primary/40 transition-colors">
              <Landmark className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Cette réforme vise à {reform.target_action === "abroger" ? "abroger" : "modifier"} la loi
                  {reform.target_article ? ` · ${reform.target_article}` : ""}
                </p>
                <p className="text-sm font-semibold truncate">{targetLaw.title}</p>
              </div>
            </Card>
          </Link>
        )}

        {/* Mise en avant */}
        <Card className="p-5 rounded-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSupport}
              disabled={busySupport}
              className={`shrink-0 flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold transition-all active:scale-[0.98] ${
                mySupport
                  ? "bg-vote text-primary-foreground shadow-lg shadow-vote/30"
                  : "bg-vote/15 text-vote border border-vote/30 hover:bg-vote/25"
              }`}
            >
              <ArrowBigUp className={`w-5 h-5 ${mySupport ? "fill-current" : ""}`} />
              {mySupport ? "Soutenue" : "Mettre en avant"}
            </button>
            <div>
              <p className="font-display text-2xl font-bold">{supports}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">mise{supports > 1 ? "s" : ""} en avant</p>
            </div>
          </div>
          {reform.status === "proposée" ? (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-vote rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {THRESHOLD - supports > 0
                  ? `Encore ${THRESHOLD - supports} mise${THRESHOLD - supports > 1 ? "s" : ""} en avant pour passer en débat`
                  : "Seuil bientôt atteint"}
              </p>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-xs text-debate font-semibold">
              <Handshake className="w-4 h-4" />
              {reform.status === "en_debat" ? "Seuil atteint · la réforme est en débat citoyen" : "Transmise · étape institutionnelle en cours"}
            </div>
          )}
        </Card>

        {/* Synthèse vTaiwan */}
        {(consensus.length > 0 || divergence.length > 0) && (
          <Card className="p-5 rounded-2xl bg-primary/5 border-primary/20">
            <h3 className="font-display font-bold mb-1 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Synthèse du débat
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Ce sur quoi les citoyens se retrouvent, malgré leurs désaccords.</p>
            {consensus.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-vote">Points de consensus</p>
                {consensus.map((s) => (
                  <p key={s.id} className="text-sm text-foreground/90 flex gap-2">
                    <Handshake className="w-4 h-4 text-vote shrink-0 mt-0.5" />
                    {s.content}
                  </p>
                ))}
              </div>
            )}
            {divergence.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-debate">Points de divergence</p>
                {divergence.map((s) => (
                  <p key={s.id} className="text-sm text-foreground/90 flex gap-2">
                    <TriangleAlert className="w-4 h-4 text-debate shrink-0 mt-0.5" />
                    {s.content}
                  </p>
                ))}
              </div>
            )}
          </Card>
        )}

        {opinionMap && opinionMap.participants > 0 && <OpinionMap data={opinionMap} />}

        {/* Avis façon Polis */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display font-bold">Donner son avis</h3>
            {queue.length > 0 && (
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                <button
                  onClick={() => setViewMode("session")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${effectiveView === "session" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Session ({queue.length})
                </button>
                <button
                  onClick={() => setViewMode("liste")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${effectiveView === "liste" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Tous
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Une phrase courte, puis les autres se positionnent dessus : pas de likes, pas de réponses.
          </p>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 200))}
              onKeyDown={(e) => { if (e.key === "Enter") postStatement(); }}
              placeholder="Votre avis en une phrase..."
              maxLength={200}
              className="flex-1 h-11 rounded-xl bg-card/70 border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={postStatement}
              disabled={posting || !text.trim()}
              className="shrink-0 w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {effectiveView === "session" ? (
            <StatementSession reformId={id} queue={queue} onFinish={refreshOverview} />
          ) : statements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Aucun avis pour l'instant. Écrivez le premier !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statements.map((s) => (
                <StatementCard key={s.id} statement={s} onStance={handleStance} busy={busyStance} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}