import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser } from "@kampus/shared-types";
import { api, SCHOOL_SUBDOMAIN } from "./api";
import { setToken } from "./token";

const TOKEN_KEY = "kampus_parent_token";
const USER_KEY = "kampus_parent_user";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [token, rawUser] = await Promise.all([AsyncStorage.getItem(TOKEN_KEY), AsyncStorage.getItem(USER_KEY)]);
      setToken(token);
      if (rawUser) setUser(JSON.parse(rawUser));
      setLoading(false);
    })();
  }, []);

  async function login(phone: string, password: string) {
    const session = await api.auth.parentLogin(SCHOOL_SUBDOMAIN, phone, password);
    setToken(session.token);
    await AsyncStorage.setItem(TOKEN_KEY, session.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setUser(session.user);
  }

  async function logout() {
    setToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
