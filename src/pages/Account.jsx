import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { request } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";
export default function Account({ mode = "login" }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [params] = useSearchParams();
  const { config } = useAuth();
  const returnTo = safeReturnTo();
  const title = {
    login: "Se connecter",
    register: "Créer un compte",
    forgot: "Mot de passe oublié",
    reset: "Nouveau mot de passe",
  }[mode];
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "register") {
        await request("/auth/sign-up/email", {
          name,
          email,
          password,
          callbackURL: returnTo,
        });
        setMessage(
          "Consultez votre boîte mail et cliquez sur le lien pour confirmer votre adresse.",
        );
      } else if (mode === "login") {
        await request("/auth/sign-in/email", { email, password });
        window.location.assign(returnTo);
      } else if (mode === "forgot") {
        await request("/auth/request-password-reset", {
          email,
          redirectTo: "/reset-password",
        });
        setMessage(
          "Si un compte correspond à cette adresse, un lien de réinitialisation a été envoyé.",
        );
      } else {
        await request("/auth/reset-password", {
          token: params.get("token"),
          newPassword: password,
        });
        window.location.assign("/login");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    setError("");
    try {
      const d = await request("/auth/sign-in/social", {
        provider: "google",
        callbackURL: returnTo,
      });
      if (d.url) window.location.assign(d.url);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      icon={mode === "forgot" ? Mail : Lock}
      title={title}
      subtitle="Votre compte LA VOIX"
      footer={<Link to="/">Retour à l’accueil</Link>}
    >
      {error && (
        <p role="alert" className="mb-4 text-destructive">
          {error}
        </p>
      )}
      {params.get("error") && (
        <p role="alert">
          Ce lien est invalide ou a expiré. Demandez un nouveau lien.
        </p>
      )}
      {message ? (
        <div role="status" className="space-y-4">
          <p>{message}</p>
          <Button onClick={() => setMessage("")} variant="outline">
            Revenir au formulaire
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <Label htmlFor="name">Pseudonyme</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoComplete="nickname"
                required
              />
            </div>
          )}
          {mode !== "reset" && (
            <div>
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          )}
          {mode !== "forgot" && (
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === "login" ? 1 : 12}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
              />
              {mode !== "login" && (
                <p className="text-xs mt-1">12 caractères minimum.</p>
              )}
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Veuillez patienter…" : title}
          </Button>
        </form>
      )}
      {mode === "login" && (
        <div className="mt-4 space-y-3">
          <Link
            className="block underline"
            to={"/register?returnTo=" + encodeURIComponent(returnTo)}
          >
            Créer un compte
          </Link>
          <Link className="block underline" to="/forgot-password">
            Mot de passe oublié ?
          </Link>
        </div>
      )}
      {mode === "register" && (
        <Link
          className="block mt-4 underline"
          to={"/login?returnTo=" + encodeURIComponent(returnTo)}
        >
          Déjà un compte ? Se connecter
        </Link>
      )}
      {config.google && ["login", "register"].includes(mode) && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={google}
          disabled={busy}
        >
          Continuer avec Google
        </Button>
      )}
      {config.localMail && (
        <p className="mt-5 text-sm">
          <Link className="underline" to="/dev-mail">
            Ouvrir la boîte mail de développement
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
