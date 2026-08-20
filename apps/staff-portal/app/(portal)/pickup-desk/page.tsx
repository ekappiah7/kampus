"use client";

import { useEffect, useState } from "react";
import type { PickupNoticeView } from "@kampus/shared-types";
import { api } from "@/lib/api";
import { Button, Card, EmptyState, PageHeader, Skeleton, useToast } from "@/components/ui";

/**
 * Gate desk. Polls so a notice sent from a parent's phone appears here within
 * seconds — the moment that makes the whole pickup loop land in a demo.
 */
export default function PickupDeskPage() {
  const [queue, setQueue] = useState<PickupNoticeView[] | null>(null);
  const [history, setHistory] = useState<PickupNoticeView[]>([]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, toastNode } = useToast();

  function load() {
    api.pickup.deskQueue().then(setQueue).catch(() => setQueue([]));
    api.pickup.deskHistory().then(setHistory).catch(() => setHistory([]));
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  async function confirm(value: string) {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.pickup.confirm(trimmed);
      toast({ kind: "ok", text: `${result.studentName} released to ${result.pickupPersonName}` });
      setCode("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pending notice matches that code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Pickup Desk" subtitle="Confirm a parent's pickup code before releasing a child" />

      <Card className="mb-6 p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void confirm(code);
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="min-w-[220px] flex-1">
            <span className="mb-1.5 block text-[12.5px] font-bold text-text-secondary">Enter pickup code</span>
            <input
              className="w-full rounded-[10px] border-[1.5px] border-border-alt px-4 py-3 text-center font-mono text-lg font-bold uppercase tracking-[0.12em] outline-none focus:border-brand-link"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PK-XXXXXX"
              autoFocus
            />
          </label>
          <Button type="submit" disabled={busy} className="!py-[15px]">
            {busy ? "Checking…" : "Confirm & release"}
          </Button>
        </form>
        {error && <p className="mt-3 rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
      </Card>

      <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-text-muted">
        Awaiting confirmation {queue ? `(${queue.length})` : ""}
      </p>
      {!queue && <Skeleton rows={3} />}
      {queue && queue.length === 0 && (
        <EmptyState icon="🚗" title="No pickups waiting" hint="Notices sent from the Parent App appear here automatically." />
      )}
      {queue && queue.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          {queue.map((n) => (
            <div key={n.id} className="flex flex-wrap items-center gap-3 border-b border-[#F0F0EE] px-5 py-4 last:border-0">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{n.studentName}</span>
                <span className="block text-[12.5px] text-text-secondary">
                  {n.pickupPersonName} · {n.relation}
                  {n.pickupTime ? ` · around ${n.pickupTime}` : ""}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-mono text-sm font-bold">{n.code}</span>
                <span className="block text-[11.5px] text-text-muted">
                  {new Date(n.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
              <Button variant="ghost" onClick={() => confirm(n.code)} disabled={busy}>
                Confirm
              </Button>
            </div>
          ))}
        </Card>
      )}

      <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-text-muted">Released today</p>
      {history.length === 0 ? (
        <Card className="px-5 py-8 text-center text-sm text-text-muted">No pickups confirmed yet.</Card>
      ) : (
        <Card className="overflow-hidden">
          {history.map((n) => (
            <div key={n.id} className="flex flex-wrap items-center gap-3 border-b border-[#F0F0EE] px-5 py-3.5 last:border-0">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{n.studentName}</span>
                <span className="block text-[12.5px] text-text-secondary">
                  Released to {n.pickupPersonName} · {n.relation}
                </span>
              </span>
              <span className="text-[11.5px] text-text-muted">
                {n.confirmedAt && new Date(n.confirmedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </Card>
      )}

      {toastNode}
    </>
  );
}
