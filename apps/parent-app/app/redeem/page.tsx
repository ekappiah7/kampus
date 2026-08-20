"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";

/**
 * Access-code redemption: the parent confirms the code belongs to them, then sets
 * their own password. Two steps on purpose — showing "Welcome, <name>" before
 * asking for a password makes a mistyped code obvious immediately.
 */
export default function RedeemPage() {
  const { adopt } = useSession();
  const [step, setStep] = useState<"code" | "password">("code");
  const [code, setCode] = useState("");
  const [identity, setIdentity] = useState<{ name: string; schoolName: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const found = await api.auth.lookupCode(code.trim().toUpperCase());
      if (found.audience !== "parent") {
        setError("That code belongs to a staff member. Please use the Staff Portal instead.");
        return;
      }
      setIdentity({ name: found.name, schoolName: found.schoolName });
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check that code.");
    } finally {
      setBusy(false);
    }
  }

  async function setPasswordAndEnter(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await api.auth.redeem(code.trim().toUpperCase(), password);
      adopt(session.token, session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set your password.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-[12px] border-[1.5px] border-border-alt bg-white px-3.5 py-3 text-[15px] outline-none focus:border-brand-link";

  return (
    <main className="flex min-h-screen flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-brand text-2xl">🔑</div>
        <h1 className="font-display text-[22px] font-bold">
          {step === "code" ? "Enter your access code" : `Welcome, ${identity?.name.split(" ")[0]}`}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {step === "code" ? "The school office gave you this code." : `Choose a password for ${identity?.schoolName}.`}
        </p>
      </div>

      {step === "code" ? (
        <form onSubmit={lookup} className="flex flex-col gap-3">
          <input
            className={`${field} text-center text-lg font-bold uppercase tracking-[0.15em]`}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
          />
          {error && <p className="rounded-[10px] bg-danger-tint px-3 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-pill bg-dark-pill py-3.5 text-[15px] font-bold text-brand disabled:opacity-60"
          >
            {busy ? "Checking…" : "Continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={setPasswordAndEnter} className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">Create a password</label>
            <input
              className={field}
              type="password"
              required
              minLength={8}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-text-secondary">Confirm password</label>
            <input
              className={field}
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="rounded-[10px] bg-danger-tint px-3 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-pill bg-dark-pill py-3.5 text-[15px] font-bold text-brand disabled:opacity-60"
          >
            {busy ? "Setting up…" : "Set password & continue"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-[13px] text-text-muted">
        Already set up?{" "}
        <Link href="/login" className="font-bold text-brand-link">
          Sign in
        </Link>
      </p>
    </main>
  );
}
