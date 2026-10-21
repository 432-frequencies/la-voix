import React, { useEffect, useState, useRef } from "react";
import { api } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Search, X, Landmark } from "lucide-react";

export default function LawSearchSelect({ value, onSelect, onClear }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!value || selected) return;
    // restaure la loi déjà sélectionnée (si rouverte)
    api.entities.Law.get(value)
      .then((l) => l && setSelected(l))
      .catch(() => {});
  }, [value]);

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = term.trim();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const query = t ? { title: { $regex: t, $options: "i" } } : {};
        const page = await api.entities.Law.filter(query, {
          sort: "-created_date",
          limit: 8,
          fields: ["title", "status", "category", "description"],
        });
        setResults(page.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [term, open]);

  if (selected) {
    return (
      <div className="col-span-2 rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-3">
        <Landmark className="w-4 h-4 text-primary shrink-0 mt-1" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Loi ciblée
          </p>
          <p className="text-sm font-semibold leading-snug">{selected.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {selected.description}
          </p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            onClear?.();
          }}
          className="shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          title="Désélectionner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="col-span-2 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Cherchez la loi à modifier ou abroger..."
          className="pl-9 h-11 pr-8"
        />
        {term && (
          <button
            onClick={() => {
              setTerm("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-border bg-card shadow-xl max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Recherche…
            </p>
          ) : results.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {term.trim()
                ? "Aucune loi ne correspond."
                : "Commencez à taper le nom d'une loi."}
            </p>
          ) : (
            results.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setSelected(l);
                  onSelect?.(l);
                  setOpen(false);
                  setTerm("");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-muted border-b border-border last:border-0"
              >
                <p className="text-sm font-semibold leading-snug">{l.title}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {l.description}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
