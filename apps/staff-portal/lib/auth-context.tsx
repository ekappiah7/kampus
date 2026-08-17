"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@kampus/shared-types";
import { api, SCHOOL_SUBDOMAIN } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "kampus_staff_token";
const USER_KEY = "kampus_staff_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const raw = window.localStorage.getItem(USER_KEY);
    if (raw) setUser(JSON.parse(raw));
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const session = await api.auth.staffLogin(SCHOOL_SUBDOMAIN, email, password);
    window.localStorage.setItem(TOKEN_KEY, session.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setUser(session.user);
    router.push(session.user.role === "gate-staff" ? "/pickup-desk" : session.user.role === "admin" ? "/manage" : "/roster");
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push("/login");
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
