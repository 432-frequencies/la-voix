import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { isNativeApp } from "@/lib/runtime";

const sessionKey = "la-voix-session";
const installMarker = "la-voix:installed-v1";
let ready;

function initialiseSessionStore() {
  if (!ready) {
    ready = (async () => {
      if (!isNativeApp) return;
      // iOS can retain Keychain items after uninstall, while WebView data is removed.
      if (!localStorage.getItem(installMarker)) {
        await SecureStorage.removeItem(sessionKey);
        localStorage.setItem(installMarker, "1");
      }
    })();
  }
  return ready;
}

export async function nativeSessionToken() {
  if (!isNativeApp) return null;
  await initialiseSessionStore();
  const value = await SecureStorage.getItem(sessionKey);
  return value || null;
}

export async function saveNativeSession(token) {
  if (!isNativeApp || !token) return;
  await initialiseSessionStore();
  await SecureStorage.setItem(sessionKey, token);
}

export async function clearNativeSession() {
  if (!isNativeApp) return;
  await initialiseSessionStore();
  await SecureStorage.removeItem(sessionKey);
}
