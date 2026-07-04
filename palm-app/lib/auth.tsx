import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken } from "./api";
import { getGoogleIdToken } from "./google";
import type { UserPublic } from "./types";

interface AuthState {
  user: UserPublic | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ needsVerify?: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await api.me();
      setUser(r.user);
      setIsAdmin(Boolean(r.isAdmin));
    } catch {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const r = await api.login(email, password);
    await setToken(r.token);
    setUser(r.user);
    setIsAdmin(Boolean(r.isAdmin));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const r = await api.signup(email, password);
    if (r.token && r.user) {
      await setToken(r.token);
      setUser(r.user);
      return {};
    }
    return { needsVerify: r.needsVerify };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const idToken = await getGoogleIdToken();
    const r = await api.google(idToken);
    await setToken(r.token);
    setUser(r.user);
    setIsAdmin(Boolean(r.isAdmin));
  }, []);

  const signOut = useCallback(async () => {
    await setToken(null);
    setUser(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, loading, signIn, signUp, signInWithGoogle, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
