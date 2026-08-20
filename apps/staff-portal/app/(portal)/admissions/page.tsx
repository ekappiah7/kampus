"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Card, EmptyState, PageHeader, Skeleton, useToast } from "@/components/ui";

interface Inquiry {
  id: string;
  parentName: string;
  phone: string;
  childAge: string | null;
  interestedLevel: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

const STATUSES = ["NEW", "CONTACTED", "ENROLLED", "CLOSED"];

export default function AdmissionsPage() {
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const { toast, toastNode } = useToast();

  function load() {
    api.admin
      .inquiries()
      .then((i) => setItems(i as Inquiry[]))
      .catch(() => setItems([]));
  }
  useEffect(load, []);

  async function setStatus(id: string, status: string) {
    await api.admin.updateInquiry(id, status);
    toast({ kind: "ok", text: `Marked ${status.toLowerCase()}` });
    load();
  }

  return (
    <>
      <PageHeader title="Admission Enquiries" subtitle="Leads from the “Request Information” form on your website" />

      {!items && <Skeleton rows={3} />}
      {items && items.length === 0 && (
        <EmptyState
          icon="📥"
          title="No enquiries yet"
          hint="When a parent fills in the form on your website, they appear here straight away."
        />
      )}

      {items && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((i) => (
            <Card key={i.id} className="p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[15px] font-bold">{i.parentName}</span>
                  <Badge
                    label={i.status}
                    tone={i.status === "NEW" ? "amber" : i.status === "ENROLLED" ? "green" : i.status === "CLOSED" ? "grey" : "blue"}
                  />
                </span>
                <span className="text-[11.5px] text-text-muted">{new Date(i.createdAt).toLocaleDateString("en-GB")}</span>
              </div>

              <p className="mb-2 text-[13.5px] text-text-secondary">
                <a href={`tel:${i.phone}`} className="font-bold text-brand-link">
                  {i.phone}
                </a>
                {i.childAge && ` · child aged ${i.childAge}`}
                {i.interestedLevel && ` · interested in ${i.interestedLevel}`}
              </p>

              {i.message && <p className="mb-3 rounded-[10px] bg-bg px-3.5 py-2.5 text-[13px] leading-relaxed">{i.message}</p>}

              <div className="flex flex-wrap gap-4 text-[12.5px] font-bold">
                {STATUSES.filter((s) => s !== i.status).map((s) => (
                  <button key={s} onClick={() => setStatus(i.id, s)} className="text-text-muted hover:text-brand-link">
                    Mark {s.toLowerCase()}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {toastNode}
    </>
  );
}
