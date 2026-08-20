"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, ChildSummary } from "@kampus/shared-types";
import { api, TOKEN_KEY, USER_KEY } from "./api";

interface SessionValue {
  user: AuthUser | null;
  loading: boolean;
  children: ChildSummary[];
  activeChild: ChildSummary | null;
  setActiveChildId: (id: string) => void;
  refreshChildren: () => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  adopt: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const Ctx = createContext<SessionValue | null>(null);
const ACTIVE_CHILD_KEY = "kampus_active_child";

export function SessionProvider({ children: node }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [kids, setKids] = useState<ChildSummary[]>([]);
  const [activeChildId, setActive] = useState<string | null>(null);
  const router = useRouter();

  const refreshChildren = useCallback(async () => {
    try {
      const list = await api.students.children();
      setKids(list);
      setActive((current) => {
        if (current && list.some((c) => c.id === current)) return current;
        const stored = window.localStorage.getItem(ACTIVE_CHILD_KEY);
        if (stored && list.some((c) => c.id === stored)) return stored;
        return list[0]?.id ?? null;
      });
    } catch {
      // Session-expiry redirects are handled centrally by the API client.
    }
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw) as AuthUser);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) void refreshChildren();
  }, [user, refreshChildren]);

  const setActiveChildId = useCallback((id: string) => {
    setActive(id);
    window.localStorage.setItem(ACTIVE_CHILD_KEY, id);
  }, []);

  const adopt = useCallback(
    (token: string, nextUser: AuthUser) => {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      router.replace("/");
    },
    [router],
  );

  const login = useCallback(
    async (phone: string, password: string) => {
      const session = await api.auth.parentLogin(phone, password);
      adopt(session.token, session.user);
    },
    [adopt],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(ACTIVE_CHILD_KEY);
    setUser(null);
    setKids([]);
    setActive(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      loading,
      children: kids,
      activeChild: kids.find((c) => c.id === activeChildId) ?? kids[0] ?? null,
      setActiveChildId,
      refreshChildren,
      login,
      adopt,
      logout,
    }),
    [user, loading, kids, activeChildId, setActiveChildId, refreshChildren, login, adopt, logout],
  );

  return <Ctx.Provider value={value}>{node}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
