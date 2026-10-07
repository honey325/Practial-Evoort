import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { authApi } from "../api/auth.api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("bookly-user") || "null");
    } catch {
      return null;
    }
  });
  const signIn = useCallback(async (credentials) => {
    const result = await authApi.login(credentials);
    setUser(result.data.user);
    sessionStorage.setItem("bookly-user", JSON.stringify(result.data.user));
    return result.data.user;
  }, []);
  const register = useCallback(async (details, accountType) => {
    const request = accountType === "business-owner" ? authApi.registerBusinessOwner : authApi.registerCustomer;
    const result = await request(details);
    setUser(result.data.user);
    sessionStorage.setItem("bookly-user", JSON.stringify(result.data.user));
    return result.data.user;
  }, []);
  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      sessionStorage.removeItem("bookly-user");
    }
  }, []);
  const value = useMemo(() => ({ user, signIn, register, signOut }), [user, signIn, register, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
