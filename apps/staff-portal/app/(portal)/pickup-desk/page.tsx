"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import type { PickupNoticeView } from "@kampus/shared-types";

export default function PickupDeskPage() {
  const [queue, setQueue] = useState<PickupNoticeView[]>([]);
  const [history, setHistory] = useState<PickupNoticeView[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function refresh() {
    api.pickup.deskQueue().then(setQueue);
    api.pickup.deskHistory().then(setHistory);
  }
  useEffect(refresh, []);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setConfirming(true);
    setError(null);
    try {
      await api.pickup.confirm(code.trim().toUpperCase());
      setCode("");
      refresh();
    } catch {
      setError("No pending notice matches this code.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <PageHeader title="Pickup Desk" subtitle="Confirm a parent's pickup code against their Pickup Notice" />

      <Card className="mb-6">
        <form onSubmit={confirm} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Enter or scan pickup code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. PK-7731"
              className="w-full rounded-chip border border-border-alt px-3 py-2 uppercase tracking-wide outline-none focus:border-brand-link"
              required
            />
          </div>
          <button disabled={confirming} className="rounded-pill bg-dark-pill px-6 py-2.5 text-sm font-semibold text-brand disabled:opacity-60">
            {confirming ? "Confirming…" : "Confirm & release"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </Card>

      <p className="mb-3 text-sm font-semibold text-text-secondary">Awaiting confirmation ({queue.length})</p>
      <Card className="mb-6 p-0">
        <ul className="divide-y divide-border-alt">
          {queue.map((n) => (
            <li key={n.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-semibold">{n.studentName}</p>
                <p className="text-sm text-text-secondary">
                  {n.pickupPersonName} · {n.relation}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold">{n.code}</p>
                <p className="text-xs text-text-muted">{new Date(n.createdAt).toLocaleTimeString()}</p>
              </div>
            </li>
          ))}
          {queue.length === 0 && <li className="px-6 py-10 text-center text-sm text-text-muted">No pending pickup notices.</li>}
        </ul>
      </Card>

      <p className="mb-3 text-sm font-semibold text-text-secondary">Fulfilled today</p>
      <Card className="p-0">
        <ul className="divide-y divide-border-alt">
          {history.map((n) => (
            <li key={n.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-semibold">{n.studentName}</p>
                <p className="text-sm text-text-secondary">
                  Released to {n.pickupPersonName} · {n.relation}
                </p>
              </div>
              <p className="text-xs text-text-muted">{n.confirmedAt && new Date(n.confirmedAt).toLocaleTimeString()}</p>
            </li>
          ))}
          {history.length === 0 && <li className="px-6 py-10 text-center text-sm text-text-muted">No pickups confirmed yet.</li>}
        </ul>
      </Card>
    </>
  );
}
