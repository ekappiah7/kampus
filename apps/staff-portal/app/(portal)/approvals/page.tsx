"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, EmptyState, PageHeader, Skeleton, useToast } from "@/components/ui";

interface Approval {
  id: string;
  title: string;
  body: string;
  kind: string;
  className: string;
  authorName: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<Approval[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast, toastNode } = useToast();

  function load() {
    api.staff.approvals().then((a) => setItems(a as Approval[])).catch(() => setItems([]));
  }
  useEffect(load, []);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      if (action === "approve") await api.staff.approve(id);
      else await api.staff.reject(id);
      toast({ kind: "ok", text: action === "approve" ? "Approved — parents notified" : "Rejected" });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not update." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Pending Approvals" subtitle="Teacher posts awaiting your review before parents see them" />

      {!items && <Skeleton rows={3} />}
      {items && items.length === 0 && <EmptyState icon="✅" title="All caught up — no posts awaiting review." />}

      {items && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
                <span className="text-[14.5px] font-bold">{a.title}</span>
                <span className="text-[11.5px] text-text-muted">
                  {new Date(a.createdAt).toLocaleDateString("en-GB")} · by {a.authorName} · {a.className}
                </span>
              </div>
              <p className="mb-3.5 whitespace-pre-wrap text-[13.5px] leading-[1.5] text-[#6B6F76]">{a.body}</p>
              <div className="flex gap-2.5">
                <Button onClick={() => act(a.id, "approve")} disabled={busyId === a.id} className="!rounded-pill">
                  Approve
                </Button>
                <Button variant="ghost" onClick={() => act(a.id, "reject")} disabled={busyId === a.id} className="!rounded-pill">
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {toastNode}
    </>
  );
}
