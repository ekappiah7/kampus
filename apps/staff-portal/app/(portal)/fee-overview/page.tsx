"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

interface Overview {
  expected: number;
  collected: number;
  outstanding: number;
  rows: { name: string; className: string; balance: number; status: string }[];
}

export default function FeeOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api.staff.feeOverview().then((r) => setData(r as Overview));
  }, []);

  const stats = data
    ? [
        { label: "Expected", value: data.expected, color: "#2A2C30" },
        { label: "Collected", value: data.collected, color: "#2E8B52" },
        { label: "Outstanding", value: data.outstanding, color: "#C74747" },
      ]
    : [];

  return (
    <>
      <PageHeader title="Fee Overview" subtitle="Collections across the school, this term" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-text-muted">{s.label}</p>
            <p className="mt-1 font-display text-[28px] font-bold" style={{ color: s.color }}>
              GH₵{s.value.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-text-muted">
            <tr>
              <th className="px-6 py-3">Pupil</th>
              <th className="px-6 py-3">Class</th>
              <th className="px-6 py-3">Balance</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((r, i) => (
              <tr key={i} className="border-t border-border-alt">
                <td className="px-6 py-3">{r.name}</td>
                <td className="px-6 py-3 text-text-secondary">{r.className}</td>
                <td className="px-6 py-3 font-semibold">GH₵{r.balance.toLocaleString()}</td>
                <td className="px-6 py-3">
                  <span
                    className="rounded-pill px-3 py-1 text-xs font-semibold"
                    style={{
                      background: r.status === "Paid" ? "#E9F7EE" : r.status === "Overdue" ? "#FCEAEA" : "#FFF3D6",
                      color: r.status === "Paid" ? "#2E8B52" : r.status === "Overdue" ? "#C74747" : "#B07A00",
                    }}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-text-muted">
        Balances already net out any scholarships and discounts applied to the student — see each student&apos;s fee ledger for
        the full audit trail.
      </p>
    </>
  );
}
