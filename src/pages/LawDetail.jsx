import ArticleCard from "@/components/ArticleCard";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import VotePanel from "@/components/VotePanel";
import HemicycleChart from "@/components/HemicycleChart";
import AssemblySideBreakdown from "@/components/AssemblySideBreakdown";
import ShareButton, { CHOICE_LABELS } from "@/components/ShareButton";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ArrowLeft, Calendar, Landmark, Vote, Check, MinusCircle,
  Users, FileText, Loader2, BarChart3, ThumbsUp, TriangleAlert, MessageCircle
} from "lucide-react";
import moment from "moment";

const categoryColors = {
  "Économie": "bg-primary/10 text-primary",
  "Social": "bg-primary/10 text-primary",
  "Environnement": "bg-vote/10 text-vote",
  "Justice": "bg-debate/10 text-debate",
  "Éducation": "bg-debate/10 text-debate",
  "Sécurité": "bg-primary/10 text-primary",
  "Institutionnel": "bg-secondary text-secondary-foreground",
  "Autre": "bg-secondary text-secondary-foreground",
};

const statusLabels = {
  "en_cours": "En cours",
  "vote_programmé": "Vote programmé",
  "adopté": "Adopté",
  "rejeté": "Rejeté",
};

export default function LawDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [law, setLaw] = useState(null);
  const [articles, setArticles] = useState([]);
  const [results, setResults] = useState({ total: 0, pour: 0, contre: 0, abstention: 0 });
  const [myVote, setMyVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resultats");
  const [readLevel, setReadLevel] = useState("30 sec");
  const [sharedChoice] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("partage");
    return ["pour", "contre", "abstention"].includes(p) ? p : null;
  });

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const lawData = await api.entities.Law.get(id);
        setLaw(lawData);
        const artPage = await api.entities.Article.filter({ law_id: id }, { limit: 50 });
        setArticles(artPage.items || []);
        const res = await api.functions.invoke("GetVoteResults", { law_id: id });
        setResults(res.data?.results?.[id] || { total: 0, pour: 0, contre: 0, abstention: 0 });
        const myVotePage = await api.entities.Vote.filter({ law_id: id }, { limit: 1 });
        setMyVote(myVotePage.items?.[0] || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!law) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Loi introuvable.</p>
        <Link to="/" className="text-primary font-semibold underline">Retour à l'accueil</Link>
      </div>
    );
  }

  const isVoted = law.assembly_result !== "non_voté";

  const total = results.total;
  const pourPct = total ? (results.pour / total) * 100 : 0;
  const contrePct = total ? (results.contre / total) * 100 : 0;
  const abstentionPct = total ? (results.abstention / total) * 100 : 0;

  const assemblyTotal = (law.assembly_for || 0) + (law.assembly_against || 0) + (law.assembly_abstain || 0);
  const aForPct = assemblyTotal ? (law.assembly_for / assemblyTotal) * 100 : 0;
  const aAgainstPct = assemblyTotal ? (law.assembly_against / assemblyTotal) * 100 : 0;
  const aAbstPct = assemblyTotal ? (law.assembly_abstain / assemblyTotal) * 100 : 0;

  const donutData = [
    { name: "Pour", value: results.pour, color: "hsl(215, 90%, 48%)" },
    { name: "Contre", value: results.contre, color: "hsl(42, 62%, 46%)" },
    { name: "Abstention", value: results.abstention, color: "hsl(215, 15%, 72%)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-sm uppercase tracking-wide flex-1">Comprendre la loi</h1>
          <ShareButton path={`/loi/${id}`} title={law?.title} vote={myVote?.choice} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* En-tête du texte */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge className={`${categoryColors[law.category] || categoryColors["Autre"]} border-0 font-semibold`}>{law.category}</Badge>
          <Badge variant="outline" className="font-semibold">{statusLabels[law.status]}</Badge>
        </div>
        {sharedChoice && !myVote && (
          <Card className="p-4 rounded-2xl bg-debate/10 border-debate/30 flex items-start gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-debate shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Un ami vous a invité à voter</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sa position sur ce texte : <strong className="text-foreground">{CHOICE_LABELS[sharedChoice]}</strong>. Lisez le texte et formez votre propre avis, puis votez ci-dessous.
              </p>
            </div>
          </Card>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight mb-2 tracking-tight">{law.title}</h1>
        {law.vote_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <Calendar className="w-4 h-4" />
            <span>En débat à l'Assemblée nationale · {moment(law.vote_date).format("DD MMMM YYYY")}</span>
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-1 border-b border-border mb-5 sticky top-[57px] bg-background/90 backdrop-blur-xl -mx-4 px-4 z-10">
          {[
            { key: "resultats", label: "Résultats", icon: BarChart3 },
            { key: "comprendre", label: "Comprendre", icon: FileText },
            { key: "vote", label: "Mon vote", icon: Vote },
          ].filter((t) => !(t.key === "vote" && isVoted)).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Comprendre */}
        {activeTab === "comprendre" && (
          <div className="space-y-4">
            <Card className="p-5 rounded-2xl">
              <div className="flex gap-1 rounded-xl bg-muted p-1 mb-4">
                {["30 sec", "3 min", "Texte intégral"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setReadLevel(level)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      readLevel === level ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {readLevel === "30 sec" && (
                <div>
                  <h3 className="font-display font-bold mb-2">En bref</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">{law.description}</p>
                </div>
              )}
              {readLevel === "3 min" && (
                <div>
                  <h3 className="font-display font-bold mb-2">L'essentiel en détail</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {law.full_text ? `${law.full_text.slice(0, 1800)}${law.full_text.length > 1800 ? "…" : ""}` : law.description}
                  </p>
                </div>
              )}
              {readLevel === "Texte intégral" && (
                <div>
                  <h3 className="font-display font-bold mb-2">Version intégrale</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto">
                    {law.full_text || law.description}
                  </p>
                </div>
              )}
            </Card>

            {(law.arguments_for?.length > 0 || law.arguments_against?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {law.arguments_for?.length > 0 && (
                  <Card className="p-5 rounded-2xl border-t-4 border-t-vote">
                    <h3 className="font-display font-bold mb-3 flex items-center gap-2 text-sm">
                      <ThumbsUp className="w-4 h-4 text-vote" />
                      Arguments favorables
                    </h3>
                    <ul className="space-y-2">
                      {law.arguments_for.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                          <Check className="w-4 h-4 text-vote mt-0.5 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {law.arguments_against?.length > 0 && (
                  <Card className="p-5 rounded-2xl border-t-4 border-t-debate">
                    <h3 className="font-display font-bold mb-3 flex items-center gap-2 text-sm">
                      <TriangleAlert className="w-4 h-4 text-debate" />
                      Points de vigilance
                    </h3>
                    <ul className="space-y-2">
                      {law.arguments_against.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                          <MinusCircle className="w-4 h-4 text-debate mt-0.5 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}

            {articles.length > 0 && <Card className="p-5 rounded-2xl"><h3 className="font-bold mb-3">Articles et sources</h3>{articles.map(article => <ArticleCard key={article.id} article={article} />)}</Card>}
            {isVoted ? (
              <Card className="p-4 rounded-2xl border-primary/20 bg-primary/5 flex items-start gap-3">
                <Landmark className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Vote citoyen clôturé</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ce texte a déjà été voté à l'Assemblée nationale
                    {law.vote_date ? ` le ${moment(law.vote_date).format("DD MMMM YYYY")}` : ""} ·{" "}
                    <strong className="text-foreground">{law.assembly_result === "pour" ? "adopté" : "rejeté"}</strong>. Consultez les résultats dans l'onglet Résultats.
                  </p>
                </div>
              </Card>
            ) : (
              !myVote && (
                <button
                  onClick={() => setActiveTab("vote")}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25 transition-all active:scale-[0.99]"
                >
                  <Vote className="w-5 h-5" />
                  Passer au vote
                </button>
              )
            )}
          </div>
        )}

        {/* Mon vote */}
        {activeTab === "vote" && (
          <VotePanel
            lawId={id}
            myVote={myVote}
            onVoted={(vote, res) => {
              setMyVote(vote);
              if (res) setResults(res);
            }}
          />
        )}

        {/* Résultats */}
        {activeTab === "resultats" && (
          <div className="space-y-5">
            <Card className="p-5 rounded-2xl">
              <h3 className="font-display font-bold mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Vote des citoyens
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {total} participant{total > 1 ? "s" : ""} · une participation par compte · résultats collectifs
              </p>
              {total === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun vote citoyen pour l'instant.</p>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="relative w-36 h-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} dataKey="value" innerRadius={48} outerRadius={70} startAngle={90} endAngle={-270} strokeWidth={0} paddingAngle={2}>
                          {donutData.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-display text-lg font-bold">{total}</span>
                      <span className="text-[10px] text-muted-foreground">votants</span>
                    </div>
                  </div>
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-vote" />Pour</span>
                      <span className="font-semibold">{Math.round(pourPct)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-debate" />Contre</span>
                      <span className="font-semibold">{Math.round(contrePct)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />Abstention</span>
                      <span className="font-semibold">{Math.round(abstentionPct)}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                      1 vote par compte · choix individuel non public
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {assemblyTotal > 0 && (
              <Card className="p-5 rounded-2xl">
                <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-muted-foreground" />
                  Vote de l'Assemblée nationale
                </h3>
                <div className="space-y-3">
                  <ResultBar label="Pour" value={law.assembly_for || 0} pct={aForPct} color="bg-vote" text="text-blue-600" />
                  <ResultBar label="Abstention" value={law.assembly_abstain || 0} pct={aAbstPct} color="bg-slate-300" text="text-slate-500" />
                  <ResultBar label="Contre" value={law.assembly_against || 0} pct={aAgainstPct} color="bg-debate" text="text-amber-600" />
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Total : {assemblyTotal} députés ·{" "}
                    <strong className="text-foreground">
                      {law.assembly_result === "pour" ? "Adopté" : "Rejeté"}
                    </strong>
                  </div>
                </div>
                <AssemblySideBreakdown groups={law.assembly_groups} />
                {law.assembly_groups?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Répartition dans l'hémicycle
                    </p>
                    <HemicycleChart groups={law.assembly_groups} />
                  </div>
                )}
              </Card>
            )}

            {total > 0 && assemblyTotal > 0 && (
              <Card className="p-5 rounded-2xl bg-primary/5 border-primary/20">
                <h3 className="font-display font-bold mb-2 text-sm">Citoyens vs Députés</h3>
                <p className="text-sm text-muted-foreground">
                  Les citoyens sont <strong className="text-foreground">{pourPct > aForPct ? "plus favorables" : pourPct < aForPct ? "moins favorables" : "autant favorables"}</strong> à cette loi que les députés.
                </p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ResultBar({ label, value, pct, color, text }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className={text}>{Math.round(pct)}% · {value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}