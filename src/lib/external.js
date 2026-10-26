import { Browser } from "@capacitor/browser";
import { isNativeApp } from "@/lib/runtime";

export async function openExternalUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return;
  }
  if (!["http:", "https:"].includes(url.protocol)) return;
  if (isNativeApp) await Browser.open({ url: url.toString() });
  else window.open(url.toString(), "_blank", "noopener,noreferrer");
}
