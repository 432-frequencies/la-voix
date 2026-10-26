import { Capacitor } from "@capacitor/core";

export const isNativeApp = Capacitor.isNativePlatform();

// Vite embeds only public URLs. Credentials and service keys stay on the API.
const configuredOrigin = import.meta.env.VITE_API_ORIGIN || "";
export const apiOrigin = isNativeApp ? configuredOrigin.replace(/\/$/, "") : "";

export function publicPageUrl(path) {
  const base = isNativeApp ? apiOrigin : window.location.origin;
  if (!base) return "";
  return new URL(path, base).toString();
}
