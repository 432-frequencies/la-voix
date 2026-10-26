import React, { useState } from "react";
import { Share } from "@capacitor/share";
import { isNativeApp, publicPageUrl } from "@/lib/runtime";
import { openExternalUrl } from "@/lib/external";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Share2, Link as LinkIcon, Check, MessageCircle, Facebook, Mail, Twitter } from "lucide-react";

export const CHOICE_LABELS = { pour: "Pour", contre: "Contre", abstention: "Abstention" };

export default function ShareButton({ path, title, vote, className = "" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = publicPageUrl(`${path}${vote ? `?partage=${vote}` : ""}`);
  const message = vote
    ? `J'ai voté « ${CHOICE_LABELS[vote]} » sur LA VOIX. Et toi ? ${fullUrl}`
    : `Découvre ce texte et donne ton avis sur LA VOIX : ${fullUrl}`;

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const openExternal = (href) => {
    if (href.startsWith("mailto:")) window.location.href = href;
    else openExternalUrl(href);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* clipboard indisponible */ }
  };

  const targets = [
    { icon: MessageCircle, label: "Message", href: `https://wa.me/?text=${encodeURIComponent(message)}` },
    { icon: Facebook, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}` },
    { icon: Twitter, label: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}` },
    { icon: Mail, label: "E-mail", href: `mailto:?subject=${encodeURIComponent("À voter sur LA VOIX")}&body=${encodeURIComponent(message)}` },
  ];

  const onTrigger = async (e) => {
    stop(e);
    if (!fullUrl) return;
    if (isNativeApp) {
      try {
        await Share.share({ title, text: message, url: fullUrl });
        return;
      } catch (err) {
        if (err?.message?.includes("cancel")) return;
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, text: message, url: fullUrl });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    setCopied(false);
    setOpen(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={onTrigger}
          title="Partager ce texte"
          aria-label="Partager ce texte"
          disabled={!fullUrl}
          className={
            className ||
            "p-2.5 rounded-full border border-border bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          }
        >
          <Share2 className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2.5" side="top" align="end" onClick={stop}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-2">
          Partager{vote ? ` · mon vote : ${CHOICE_LABELS[vote]}` : ""}
        </p>
        <div className="grid grid-cols-2 gap-1">
          {targets.map((t) => (
            <button
              key={t.label}
              onClick={() => openExternal(t.href)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted whitespace-nowrap"
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
          <button
            onClick={copy}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4 text-vote" /> : <LinkIcon className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
