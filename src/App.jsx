import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
const Home = lazy(() => import("./pages/Home"));
const LawDetail = lazy(() => import("./pages/LawDetail"));
const Reforms = lazy(() => import("./pages/Reforms"));
const ReformDetail = lazy(() => import("./pages/ReformDetail"));
const Account = lazy(() => import("./pages/Account"));
const DevMail = lazy(() => import("./pages/DevMail"));
function Shell() {
  const { user, logout, error, config } = useAuth();
  return (
    <>
      <div className="bg-card text-foreground border-b px-4 py-2 text-xs flex items-center justify-between gap-3">
        <Link to="/">LA VOIX · Consultation citoyenne</Link>
        <div className="flex gap-3 items-center">
          {config.demo && <span>Données fictives</span>}
          {user ? (
            <>
              <span>{user.name}</span>
              <button onClick={logout} className="underline">
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="underline">
              Se connecter
            </Link>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="p-3 text-destructive">
          Connexion au serveur impossible : {error}
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
          <ScrollToTop />
          <Shell />
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
