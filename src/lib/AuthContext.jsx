import { createContext, useState, useContext, useEffect } from "react";
import { request } from "@/api/client";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [config, setConfig] = useState({}),
    [error, setError] = useState("");
  const checkUserAuth = async () => {
    setLoading(true);
    try {
      setUser(await request("/me"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    checkUserAuth();
    request("/config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  const logout = async () => {
    await request("/auth/sign-out", {});
    window.location.assign("/");
  };
  const navigateToLogin = () =>
    window.location.assign(
      "/login?returnTo=" +
        encodeURIComponent(window.location.pathname + window.location.search),
    );
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth: loading,
        isLoadingPublicSettings: false,
        authChecked: !loading,
        authError: null,
        error,
        config,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider manquant");
  return value;
}
