import jwt from "jsonwebtoken";
import type { AuthUser } from "@kampus/shared-types";
import { env } from "./env";

export interface AuthTokenPayload extends AuthUser {
  iat?: number;
  exp?: number;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
