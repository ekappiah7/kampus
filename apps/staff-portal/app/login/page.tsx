"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession, homeFor } from "@/lib/session";
import { Button, Field, inputClass } from "@/components/ui";

export default function LoginPage() {
  const { login, user, loading } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(homeFor(user.role));
  }, [loading, user, router]);

  useEffect(() => {
    // If nobody has set the school up yet, sign-in is a dead end — send them to setup.
    api.setup.status().then((s) => !s.initialised && router.replace("/setup")).catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-brand text-2xl">🏫</div>
          <h1 className="font-display text-[24px] font-bold">Staff Portal</h1>
          <p className="mt-1 text-sm text-text-muted">Sign in to continue</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 rounded-[18px] bg-white p-7 shadow-card">
          <Field label="Email">
            <input className={inputClass} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

          <Button type="submit" className="!py-3.5" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] leading-relaxed text-text-muted">
          New staff member?{" "}
          <Link href="/redeem" className="font-bold text-brand-link">
            Use your access code
          </Link>
        </p>
      </div>
    </main>
  );
}
