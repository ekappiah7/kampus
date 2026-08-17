"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-card-lg border border-border-alt bg-white p-8 shadow-card">
        <h1 className="font-display text-2xl font-bold">Staff Portal</h1>
        <p className="mt-1 text-sm text-text-muted">Sign in to Aspire Royal Academy</p>

        <label className="mt-6 block text-sm font-medium text-text-secondary">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-chip border border-border-alt px-3 py-2 outline-none focus:border-brand-link"
          placeholder="abigail.bentil@aspireroyal.edu.gh"
        />

        <label className="mt-4 block text-sm font-medium text-text-secondary">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-chip border border-border-alt px-3 py-2 outline-none focus:border-brand-link"
        />

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-pill bg-dark-pill py-2.5 font-semibold text-brand disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
