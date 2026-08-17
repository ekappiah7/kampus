import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  nodeEnv: process.env.NODE_ENV ?? "development",
};
