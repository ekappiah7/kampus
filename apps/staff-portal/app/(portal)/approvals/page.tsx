"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

interface Approval {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { name: string };
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);

  function refresh() {
    api.staff.approvals().then((r) => setApprovals(r as Approval[]));
  }
  useEffect(refresh, []);

  async function approve(id: string) {
    await api.staff.approve(id);
    refresh();
  }
  async function reject(id: string) {
    await api.staff.reject(id);
    refresh();
  }

  return (
    <>
      <PageHeader title="Pending Approvals" subtitle="Teacher posts awaiting your review before parents see them" />
      {approvals.length === 0 ? (
        <Card className="text-center text-text-muted">All caught up — no posts awaiting review.</Card>
      ) : (
        <div className="flex flex-col gap-4">
          {approvals.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{a.body}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    {a.author.name} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => approve(a.id)} className="rounded-pill bg-brand px-4 py-1.5 text-xs font-semibold text-text-primary">
                    Approve
                  </button>
                  <button onClick={() => reject(a.id)} className="rounded-pill border border-border px-4 py-1.5 text-xs font-semibold">
                    Reject
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
