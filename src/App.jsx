import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import NativeLinkListener from "@/components/NativeLinkListener";
import { isNativeApp } from "@/lib/runtime";
const Home = lazy(() => import("./pages/Home"));
const LawDetail = lazy(() => import("./pages/LawDetail"));
const Reforms = lazy(() => import("./pages/Reforms"));
const ReformDetail = lazy(() => import("./pages/ReformDetail"));
const Account = lazy(() => import("./pages/Account"));
const DevMail = lazy(() => import("./pages/DevMail"));
const SavedLaws = lazy(() => import("./pages/SavedLaws"));
function Shell() {
  const { user, logout, error, config } = useAuth();
  return (
    <>
      <div className={`bg-card text-foreground border-b px-4 py-2 text-xs flex items-center justify-between gap-3 ${isNativeApp ? "pt-[calc(env(safe-area-inset-top)+0.5rem)]" : ""}`}>
        <Link to="/" className={isNativeApp ? "font-bold whitespace-nowrap" : ""}>
          {isNativeApp ? "LA VOIX" : "LA VOIX · Consultation citoyenne"}
        </Link>
        <div className="flex gap-3 items-center whitespace-nowrap">
          {config.demo && <span>{isNativeApp ? "Démo" : "Données fictives"}</span>}
          {isNativeApp && <Link to="/mes-textes" className="underline">Mes textes</Link>}
          {user ? (
            <>
              <span>{user.name}</span>
              <button onClick={logout} className="underline">
                {isNativeApp ? "Quitter" : "Déconnexion"}
              </button>
            </>
          ) : (
            <Link to="/login" className="underline">
              {isNativeApp ? "Connexion" : "Se connecter"}
            </Link>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="p-3 text-destructive">
          {isNativeApp
            ? "Connexion au serveur indisponible. Vérifiez le réseau et réessayez."
            : `Connexion au serveur impossible : ${error}`}
        </p>
      )}
      <Suspense fallback={<p className="p-8 text-center">Chargement…</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/loi/:id" element={<LawDetail />} />
          <Route path="/reformes" element={<Reforms />} />
          <Route path="/reforme/:id" element={<ReformDetail />} />
          <Route path="/login" element={<Account key="login" />} />
          <Route
            path="/register"
            element={<Account key="register" mode="register" />}
          />
          <Route
            path="/forgot-password"
            element={<Account key="forgot" mode="forgot" />}
          />
          <Route
            path="/reset-password"
            element={<Account key="reset" mode="reset" />}
          />
          <Route path="/dev-mail" element={<DevMail />} />
          {isNativeApp && <Route path="/mes-textes" element={<SavedLaws />} />}
          <Route
            path="*"
            element={
              <main className="p-8">
                Page introuvable. <Link to="/">Retour à l’accueil</Link>
              </main>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <BrowserRouter>
          <NativeLinkListener />
          <ScrollToTop />
          <Shell />
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
