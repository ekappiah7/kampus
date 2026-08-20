"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@kampus/shared-types";
import { api, TOKEN_KEY, USER_KEY } from "./api";

interface SchoolBrand {
  id: string;
  name: string;
  shortName?: string | null;
  primaryColor: string;
  logoUrl: string | null;
}

interface SessionValue {
  user: AuthUser | null;
  school: SchoolBrand | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adopt: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SessionValue | null>(null);

/** Where each role lands after signing in. */
export function homeFor(role: string): string {
  if (role === "gate-staff") return "/pickup-desk";
  if (role === "teacher") return "/roster";
  return "/dashboard";
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [school, setSchool] = useState<SchoolBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me.user as unknown as AuthUser);
      setSchool(me.school as unknown as SchoolBrand);
      window.localStorage.setItem(USER_KEY, JSON.stringify(me.user));
    } catch {
      // 401 handling lives in the API client.
    }
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(USER_KEY);
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (raw && token) {
      try {
        setUser(JSON.parse(raw) as AuthUser);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
      void refresh().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refresh]);

  const adopt = useCallback(
    (token: string, nextUser: AuthUser) => {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      void refresh();
      router.replace(homeFor(nextUser.role));
    },
    [router, refresh],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await api.auth.staffLogin(email, password);
      adopt(session.token, session.user);
    },
    [adopt],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
    setSchool(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo<SessionValue>(
    () => ({ user, school, loading, login, adopt, logout, refresh }),
    [user, school, loading, login, adopt, logout, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
