"use client";

import { createApiClient } from "@kampus/api-client";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const TOKEN_KEY = "kampus_parent_token";
export const USER_KEY = "kampus_parent_user";

export const api = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY)),
  onUnauthorized: () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
  },
});
