import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import {
  Search, Users, Flame, ArrowRight, Bell, FileText, Calendar, Clock,
  Leaf, HeartPulse, GraduationCap, Coins, Shield, Scale, Activity,
  MessageSquare, ChevronRight, Landmark, BarChart3, Lightbulb
} from "lucide-react";
import PastVotes from "@/components/PastVotes";
import HomeReforms from "@/components/HomeReforms";
import ShareButton from "@/components/ShareButton";
import moment from "moment";

const LOGO_IMG = "/logo.svg";
const CAT_ART = {
  Environnement: "from-emerald-950 via-emerald-700 to-teal-500",
  Social: "from-rose-950 via-rose-700 to-orange-500",
  Éducation: "from-blue-950 via-blue-700 to-cyan-500",
  Économie: "from-amber-950 via-amber-700 to-yellow-500",
  Sécurité: "from-indigo-950 via-indigo-700 to-blue-500",
  Justice: "from-violet-950 via-violet-700 to-fuchsia-500",
};

function LawArt({ category }) {
  return <div aria-hidden="true" className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${CAT_ART[category] || "from-slate-900 via-slate-700 to-slate-500"}`}><Landmark className="h-20 w-20 text-white/30" strokeWidth={1} /></div>;
}

const themes = [
  { label: "Écologie", cat: "Environnement", icon: Leaf, cls: "from-emerald-400/25 to-emerald-400/5 text-emerald-300" },
  { label: "Santé", cat: "Social", icon: HeartPulse, cls: "from-rose-400/25 to-rose-400/5 text-rose-300" },
  { label: "Éducation", cat: "Éducation", icon: GraduationCap, cls: "from-blue-400/25 to-blue-400/5 text-blue-300" },
  { label: "Pouvoir d'achat", cat: "Économie", icon: Coins, cls: "from-amber-400/25 to-amber-400/5 text-amber-300" },
  { label: "Sécurité", cat: "Sécurité", icon: Shield, cls: "from-indigo-400/25 to-indigo-400/5 text-indigo-300" },
  { label: "Justice", cat: "Justice", icon: Scale, cls: "from-violet-400/25 to-violet-400/5 text-violet-300" },
];

const statuses = [
  { value: "all", label: "Tous les statuts" },
  { value: "en_cours", label: "En cours" },
  { value: "vote_programmé", label: "Vote programmé" },
  { value: "adopté", label: "Adopté" },
  { value: "rejeté", label: "Rejeté" },
];

const stages = ["Dépôt", "Commission", "En débat", "Vote", "Promulgation"];
const stageIndex = (status) =>
  status === "en_cours" ? 2 : status === "vote_programmé" ? 3 : status === "adopté" ? 4 : 0;

const readingTime = (law) => {
  const words = (law.full_text || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

export default function Home() {
  const [laws, setLaws] = useState([]);
  const [results, setResults] = useState({});
  const [openCount, setOpenCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [totalVoters, setTotalVoters] = useState(0);
  const [myVotes, setMyVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const query = {};
        if (category !== "Toutes") query.category = category;
        if (status !== "all") query.status = status;
        if (search.trim()) {
          query.title = { $regex: search.trim(), $options: "i" };
        }
        const page = await api.entities.Law.filter(query, { sort: "-vote_date", limit: 50 });
        const items = page.items || [];
        const today = moment().startOf("day");
        const dayDiff = (l) =>
          l.vote_date ? moment(l.vote_date).startOf("day").diff(today, "days") : null;
        items.sort((a, b) => {
          const da = dayDiff(a), db = dayDiff(b);
          const ua = da !== null && da >= 0 ? 0 : 1;
          const ub = db !== null && db >= 0 ? 0 : 1;
          if (ua !== ub) return ua - ub;
          if (ua === 0) return (da ?? 1e9) - (db ?? 1e9);
          return (db ?? -1e9) - (da ?? -1e9);
        });
        setLaws(items);
        const [cnt, upcnt, res, myVotesPage] = await Promise.all([
          api.entities.Law.count({ status: { $in: ["en_cours", "vote_programmé"] } }),
          api.entities.Law.count({ vote_date: { $gte: moment().format("YYYY-MM-DD") } }),
          api.functions.invoke("GetVoteResults", {}),
          api.entities.Vote.filter({}, { limit: 200 }),
        ]);
        const vmap = {};
        (myVotesPage.items || []).forEach((v) => { vmap[v.law_id] = v.choice; });
        setMyVotes(vmap);
        setOpenCount(cnt ?? 0);
        setUpcomingCount(upcnt ?? 0);
        const map = res.data?.results || {};
        setResults(map);
        setTotalVoters(Object.values(map).reduce((s, r) => s + (r?.total || 0), 0));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [search, category, status]);

  const isUpcoming = (law) => {
    if (law.status !== "en_cours" && law.status !== "vote_programmé") return false;
    if (!law.vote_date) return false;
    return moment(law.vote_date).startOf("day").diff(moment().startOf("day"), "days") >= 0;
  };
  const featured = laws.find(isUpcoming);
  const rest = laws.filter((l) => l !== featured);
  const featuredDays = featured?.vote_date
    ? moment(featured.vote_date).startOf("day").diff(moment().startOf("day"), "days")
    : null;
  const featuredCountdown =
    featuredDays === 0 ? "Vote aujourd'hui" : featuredDays === 1 ? "Vote demain" : `Dans ${featuredDays} jours`;
  const featuredStage = featured ? stageIndex(featured.status) : 0;

  const resetFilters = () => {
    setCategory("Toutes");
    setStatus("all");
    setSearch("");
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Halos décoratifs */}
      <div className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-debate/15 blur-3xl" />

      {/* Header */}
      <header className="relative z-30 max-w-2xl mx-auto px-4 pt-5 pb-1 flex items-center gap-3">
        <Image src={LOGO_IMG} alt="LA VOIX" className="w-11 h-11 rounded-xl" />
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold leading-tight tracking-tight">LA VOIX</h1>
          <p className="text-[11px] text-debate font-semibold italic">Votre voix. Votre loi.</p>
        </div>
        <div className="ml-auto relative p-1">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-destructive" />
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
        {/* Salutation */}
        <h2 className="font-display text-3xl font-bold mt-4 tracking-tight">Bonjour, citoyen</h2>
        <p className="text-muted-foreground text-sm mt-1">Suivez les lois. Comprenez. Votez.</p>

        <div className="flex items-center gap-2 mt-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-card/60 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-vote animate-pulse" />
            <span className="text-xs font-semibold">Session parlementaire en cours</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <Link
            to="/reformes"
            className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-debate text-slate-900 text-xs font-bold shadow-md shadow-debate/25 hover:brightness-110 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Proposer une réforme
          </Link>
        </div>

        {/* Carte prioritaire */}
        {featured && (
          <section className="mt-5">
            <Link to={`/loi/${featured.id}`} className="block">
              <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/30 hover:border-primary/50 transition-colors">
                <div className="relative h-48">
                  <LawArt category={featured.category} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <span className="absolute top-3 left-3 rounded-full bg-debate text-slate-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow">
                    Priorité
                  </span>
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-900">
                    <Flame className="w-3.5 h-3.5 text-debate" />
                    {featuredCountdown}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-bold leading-snug mb-1.5 tracking-tight">{featured.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{featured.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5 text-vote" /> Lecture {readingTime(featured)} min
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs font-semibold">
                      <Activity className="w-3.5 h-3.5 text-rose-400" /> Impact élevé
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs font-semibold">
                      <MessageSquare className="w-3.5 h-3.5 text-debate" /> En débat
                    </span>
                  </div>
                  {/* Frise parlementaire */}
                  <div className="flex items-start px-1 mb-5">
                    {stages.map((s, i) => (
                      <React.Fragment key={s}>
                        {i > 0 && <div className={`flex-1 h-0.5 mt-[5px] ${i <= featuredStage ? "bg-primary" : "bg-border"}`} />}
                        <div className="flex flex-col items-center gap-1.5 w-12">
                          <span className={`w-3 h-3 rounded-full ${i <= featuredStage ? "bg-primary" : "bg-border"} ${i === featuredStage ? "ring-4 ring-primary/25" : ""}`} />
                          <span className={`text-[9px] font-semibold text-center leading-tight ${i === featuredStage ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <span className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30">
                      Comprendre <ArrowRight className="w-4 h-4" />
                    </span>
                    <ShareButton
                      path={`/loi/${featured.id}`}
                      title={featured.title}
                      vote={myVotes[featured.id]}
                      className="w-[52px] flex items-center justify-center rounded-xl border border-border bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Statistiques */}
        <section className="grid grid-cols-3 gap-2.5 my-5">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-3.5">
            <FileText className="w-5 h-5 text-vote mb-2" />
            <p className="font-display text-xl font-bold">{openCount}</p>
            <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">textes en cours</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-3.5">
            <Users className="w-5 h-5 text-debate mb-2" />
            <p className="font-display text-xl font-bold">{totalVoters}</p>
            <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">votes citoyens</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-3.5">
            <Calendar className="w-5 h-5 text-vote mb-2" />
            <p className="font-display text-xl font-bold">{upcomingCount}</p>
            <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">votes à venir</p>
          </div>
        </section>

        {/* Recherche + statut */}
        <section className="space-y-2.5 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un texte..."
              className="pl-9 h-11 text-base bg-card/60 border-border"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {statuses.map((s) => (
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
        </section>

        {/* Explorer par thématique */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-display font-bold">Explorer par thématique</h3>
            <button onClick={resetFilters} className="text-xs font-semibold text-vote">Voir tout</button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {themes.map((t) => (
              <button
                key={t.cat}
                onClick={() => setCategory(category === t.cat ? "Toutes" : t.cat)}
                className={`w-[78px] shrink-0 rounded-2xl border p-3 flex flex-col items-center gap-1.5 bg-gradient-to-b ${t.cls} ${
                  category === t.cat ? "border-primary ring-2 ring-primary/40" : "border-white/10"
                }`}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold text-center leading-tight text-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* À suivre pour vous */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-display font-bold">À suivre pour vous</h3>
            <button onClick={resetFilters} className="text-xs font-semibold text-vote">Voir tout</button>
          </div>
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-60 shrink-0 h-56 rounded-2xl bg-card/60 border border-border animate-pulse" />
              ))}
            </div>
          ) : rest.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Landmark className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun texte ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {rest.map((law) => {
                const upcoming = isUpcoming(law);
                const d = law.vote_date
                  ? moment(law.vote_date).startOf("day").diff(moment().startOf("day"), "days")
                  : null;
                const votes = results[law.id]?.total || 0;
                return (
                  <Link key={law.id} to={`/loi/${law.id}`} className="shrink-0 w-60">
                    <div className="rounded-2xl border border-border bg-card/70 backdrop-blur overflow-hidden hover:border-primary/50 transition-colors h-full">
                      <div className="relative h-28">
                        <LawArt category={law.category} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <span className="absolute top-2 left-2 rounded-full bg-background/80 text-[9px] font-bold uppercase tracking-wider px-2 py-1">
                          {law.category}
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="font-display text-sm font-bold leading-snug line-clamp-2 mb-2">{law.title}</h4>
                        <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readingTime(law)} min</span>
                          {upcoming && (
                            <span className="flex items-center gap-1 text-debate font-semibold">
                              <Flame className="w-3 h-3" />
                              {d === 0 ? "Aujourd'hui" : d === 1 ? "Demain" : `J-${d}`}
                            </span>
                          )}
                          <span className="flex items-center gap-1 ml-auto"><BarChart3 className="w-3 h-3" />{votes}</span>
                          <ShareButton
                            path={`/loi/${law.id}`}
                            title={law.title}
                            vote={myVotes[law.id]}
                            className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Réformes citoyennes */}
        <HomeReforms />

        {/* Votes passés · scrutins 2026 */}
        <PastVotes />
      </main>

      <footer className="relative z-10 max-w-2xl mx-auto px-4 pb-10 text-center text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">LA VOIX — Consultation citoyenne.</p>
        <p>Maquette de démonstration : textes et chiffres fictifs, non issus d'un scrutin réel.</p>
        <p>Photos : Wikimedia Commons — attributions à compléter avant publication.</p>
      </footer>
    </div>
  );
}
