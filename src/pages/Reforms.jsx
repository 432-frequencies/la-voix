import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { Input } from "@/components/ui/input";
import ReformCard from "@/components/ReformCard";
import ReformComposer from "@/components/ReformComposer";
import { ArrowLeft, Search, Lightbulb, Users, Flame, Inbox } from "lucide-react";

const CATEGORIES = ["Économie", "Social", "Environnement", "Justice", "Éducation", "Sécurité", "Institutionnel", "Autre"];
const STATUS_FILTERS = [
  { value: "all", label: "Tous" },
  { value: "proposée", label: "Proposées" },
  { value: "en_debat", label: "En débat" },
  { value: "transmise", label: "Transmises" },
  { value: "integree", label: "Intégrées" },
];

export default function Reforms() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState({ reforms: [], supports: {}, my_supports: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("Toutes");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      (async () => {
        setLoading(true);
        try {
          const res = await api.functions.invoke("GetReformFeed", {
            status: status === "all" ? null : status,
            category: category === "Toutes" ? null : category,
            search: search.trim() || null,
          });
          if (!cancelled) setFeed(res.data);
        } catch (e) {
          console.error(e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, search ? 350 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, status, category]);

  const handleSupport = async (reform) => {
    if (!isAuthenticated) { navigateToLogin(); return; }
    setBusyId(reform.id);
    try {
      const res = await api.functions.invoke("SupportReform", { reform_id: reform.id, supported: !feed.my_supports[reform.id] });
      const d = res.data;
      setFeed((f) => ({
        ...f,
        supports: { ...f.supports, [reform.id]: d.supports },
        my_supports: { ...f.my_supports, [reform.id]: d.supported },
        reforms: f.reforms.map((r) => (r.id === reform.id ? { ...r, status: d.status } : r)),
      }));
    } catch (error) {
      toast({ title: "Action impossible", description: error.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const totalSupports = Object.values(feed.supports).reduce((s, v) => s + v, 0);
  const enDebat = feed.reforms.filter((r) => r.status === "en_debat").length;

  return (
    <div className="dark min-h-screen bg-background text-foreground relative overflow-hidden pt-[env(safe-area-inset-top)]">
      <div className="pointer-events-none absolute -top-32 -left-24 w-80 h-80 rounded-full bg-vote/20 blur-3xl" />
      <header className="relative z-30 max-w-2xl mx-auto px-4 pt-5 pb-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-debate" /> Réformes citoyennes
          </h1>
          <p className="text-[11px] text-muted-foreground">Proposez · Mettez en avant · Positionnez-vous — modèle vTaiwan</p>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
        <div className="rounded-2xl border border-debate/30 bg-gradient-to-br from-debate/15 via-card/60 to-card/60 backdrop-blur p-5 mb-5">
          <h2 className="font-display text-xl font-bold">Une idée pour la France ?</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Déposez votre proposition. Dès 25 mises en avant, elle passe automatiquement en débat citoyen.
          </p>
          <ReformComposer onCreated={(r) => navigate(`/reforme/${r.id}`)} />
        </div>

        <section className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-3.5">
            <Lightbulb className="w-5 h-5 text-debate mb-2" />
            <p className="font-display text-xl font-bold">{feed.reforms.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">propositions</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-3.5">
            <Users className="w-5 h-5 text-vote mb-2" />
            <p className="font-display text-xl font-bold">{totalSupports}</p>
            <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">mises en avant</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-3.5">
            <Flame className="w-5 h-5 text-debate mb-2" />
            <p className="font-display text-xl font-bold">{enDebat}</p>
            <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">en débat</p>
          </div>
        </section>

        <section className="space-y-2.5 my-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une réforme..."
              className="pl-9 h-11 bg-card/60 border-border"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
                  status === s.value ? "bg-primary text-primary-foreground border-transparent" : "bg-card/60 border-border text-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {["Toutes", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                  category === c ? "bg-secondary text-secondary-foreground border-transparent" : "bg-card/60 border-border text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-card/60 border border-border animate-pulse" />
            ))}
          </div>
        ) : feed.reforms.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucune réforme ne correspond. Proposez la première !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feed.reforms.map((r) => (
              <ReformCard
                key={r.id}
                reform={r}
                supports={feed.supports[r.id] || 0}
                mySupport={!!feed.my_supports[r.id]}
                onSupport={() => handleSupport(r)}
                busy={busyId === r.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}