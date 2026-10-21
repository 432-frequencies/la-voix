import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LawSearchSelect from "@/components/LawSearchSelect";
import { api } from "@/api/client";
import { Plus, Loader2, Lightbulb } from "lucide-react";

const CATEGORIES = ["Économie", "Social", "Environnement", "Justice", "Éducation", "Sécurité", "Institutionnel", "Autre"];

const EMPTY = { title: "", summary: "", detail: "", category: "Autre", target_law_id: "", target_action: "modifier", target_article: "" };

export default function ReformComposer({ onCreated }) {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!isAuthenticated) { navigateToLogin(); return; }
    if (!form.title.trim() || !form.summary.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        detail: form.detail.trim(),
        category: form.category,
      };
      if (form.target_law_id) {
        payload.target_law_id = form.target_law_id;
        payload.target_action = form.target_action;
        if (form.target_article.trim()) payload.target_article = form.target_article.trim();
      }
      const created = await api.entities.Reform.create(payload);
      setOpen(false);
      setForm(EMPTY);
      onCreated?.(created);
    } catch (error) {
      toast({ title: "Action impossible", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90">
          <Plus className="w-5 h-5" />
          Proposer une réforme
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-debate" />
            Proposer une réforme
          </DialogTitle>
          <DialogDescription>
            Un titre clair, un résumé concret. Les citoyens la mettront en avant si elle a du sens.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titre de la réforme"
            className="h-11"
          />
          <Textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="Résumé en une ou deux phrases"
            rows={3}
          />
          <Textarea
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
            placeholder="Développement : constat, proposition concrète, effet attendu (optionnel)"
            rows={5}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cible législative */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Cible dans le code législatif</p>
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                {[
                  { value: "modifier", label: "Modifier une loi" },
                  { value: "abroger", label: "Abroger une loi" },
                ].map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setForm({ ...form, target_action: a.value })}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      form.target_action === a.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <LawSearchSelect
              value={form.target_law_id}
              onSelect={(l) => setForm({ ...form, target_law_id: l.id })}
              onClear={() => setForm({ ...form, target_law_id: "", target_article: "" })}
            />
            {form.target_law_id && (
              <Input
                value={form.target_article}
                onChange={(e) => setForm({ ...form, target_article: e.target.value })}
                placeholder="Article ou disposition visée (ex. article 12, III)"
                className="col-span-2 h-11"
              />
            )}
          </div>
          <Button
            onClick={submit}
            disabled={submitting || !form.title.trim() || !form.summary.trim()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Publier la proposition
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
