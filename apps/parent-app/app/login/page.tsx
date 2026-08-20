"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

export default function LoginPage() {
  const { login, user, loading } = useSession();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(phone.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-[12px] border-[1.5px] border-border-alt bg-white px-3.5 py-3 text-[15px] outline-none focus:border-brand-link";

  return (
    <main className="flex min-h-screen flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-brand text-2xl">🎒</div>
        <h1 className="font-display text-[22px] font-bold">Parent App</h1>
        <p className="mt-1 text-sm text-text-muted">Sign in to follow your child&apos;s progress</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">Phone number</label>
          <input
            className={field}
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="024 000 0000"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">Password</label>
          <input
            className={field}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="rounded-[10px] bg-danger-tint px-3 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-pill bg-dark-pill py-3.5 text-[15px] font-bold text-brand disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] leading-relaxed text-text-muted">
        First time here?{" "}
        <Link href="/redeem" className="font-bold text-brand-link">
          Use your access code
        </Link>
        <br />
        Ask the school office if you don&apos;t have one.
      </p>
    </main>
  );
}
