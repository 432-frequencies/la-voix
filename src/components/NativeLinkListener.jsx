import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App as NativeApp } from "@capacitor/app";
import { apiOrigin, isNativeApp } from "@/lib/runtime";

function appPath(raw) {
  if (!apiOrigin) return null;
  try {
    const url = new URL(raw);
    if (url.origin !== apiOrigin) return null;
    const path = url.pathname;
    if (
      path !== "/" &&
      !/^\/(loi|reforme)\/[a-zA-Z0-9_-]+$/.test(path) &&
      !["/login", "/register", "/reset-password"].includes(path)
    ) return null;
    return path + url.search;
  } catch {
    return null;
  }
}

export default function NativeLinkListener() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isNativeApp || !apiOrigin) return;
    let active = true;
    let listener;
    const route = (raw) => {
      const path = appPath(raw);
      if (active && path) navigate(path);
    };
    NativeApp.getLaunchUrl().then(({ url }) => {
      if (url) route(url);
    });
    NativeApp.addListener("appUrlOpen", ({ url }) => route(url)).then((handle) => {
      if (active) listener = handle;
      else handle.remove();
    });
    return () => {
      active = false;
      listener?.remove();
    };
  }, [navigate]);
  return null;
}
