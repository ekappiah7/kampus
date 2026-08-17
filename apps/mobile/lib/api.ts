import Constants from "expo-constants";
import { createApiClient } from "@kampus/api-client";
import { getToken } from "./token";

const extra = Constants.expoConfig?.extra as { apiUrl?: string; schoolSubdomain?: string } | undefined;

export const API_BASE_URL = extra?.apiUrl ?? "http://localhost:4000";
export const SCHOOL_SUBDOMAIN = extra?.schoolSubdomain ?? "aspire-royal";

export const api = createApiClient({ baseUrl: API_BASE_URL, getToken });
