import { useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, ArrowLeft } from "lucide-react";
import { savedLaws, removeSavedLaw } from "@/lib/offline-laws";

export default function SavedLaws() {
  const [laws, setLaws] = useState(savedLaws);
  const remove = (id) => {
    removeSavedLaw(id);
    setLaws(savedLaws());
  };
  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"><ArrowLeft className="w-4 h-4" /> Accueil</Link>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2"><Bookmark className="w-6 h-6" /> Textes sauvegardés</h1>
      <p className="text-sm text-muted-foreground mb-6">Lecture disponible sans réseau. Les résultats et les votes exigent une connexion.</p>
      {laws.length === 0 ? <p className="text-muted-foreground">Aucun texte sauvegardé.</p> : (
        <ul className="space-y-3">
          {laws.map((law) => <li key={law.id} className="rounded-xl border border-border p-4">
            <Link to={`/loi/${encodeURIComponent(law.id)}`} className="font-semibold underline underline-offset-2">{law.title}</Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{law.description}</p>
            <p className="text-xs text-muted-foreground mt-2">Copie du {new Date(law.saved_at).toLocaleDateString("fr-FR")}</p>
            <button className="text-sm text-destructive underline mt-2" onClick={() => remove(law.id)}>Supprimer la copie</button>
          </li>)}
        </ul>
      )}
    </main>
  );
}
