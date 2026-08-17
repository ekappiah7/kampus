import { createApiClient } from "@kampus/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const SCHOOL_SUBDOMAIN = process.env.NEXT_PUBLIC_SCHOOL_SUBDOMAIN ?? "aspire-royal";

export const api = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => (typeof window !== "undefined" ? window.localStorage.getItem("kampus_staff_token") : null),
});
