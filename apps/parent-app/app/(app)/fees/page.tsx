"use client";

import { useEffect, useState } from "react";
import type { FeeStatement } from "@kampus/shared-types";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { AppBar } from "@/components/AppBar";
import { EmptyState, ErrorState, Skeleton, STATUS_TINT, money } from "@/components/ui";

type Stage = "closed" | "method" | "momo" | "card" | "cash" | "processing" | "success";

const NETWORKS = [
  { key: "MOMO_MTN", label: "MTN" },
  { key: "MOMO_VODAFONE", label: "Vodafone" },
  { key: "MOMO_AIRTELTIGO", label: "AirtelTigo" },
];

export default function FeesScreen() {
  const { activeChild, refreshChildren } = useSession();
  const [statement, setStatement] = useState<FeeStatement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("closed");
  const [network, setNetwork] = useState<string>("MOMO_MTN");
  const [payerRef, setPayerRef] = useState("");
  const [cashRef, setCashRef] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  function load() {
    if (!activeChild) return;
    setError(null);
    setStatement(null);
    api.fees
      .statement(activeChild.id)
      .then(setStatement)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load fees."));
  }

  useEffect(load, [activeChild?.id]);

  async function pay(method: string) {
    if (!activeChild || !statement) return;
    setStage("processing");
    setPayError(null);
    try {
      await api.fees.pay(activeChild.id, statement.balance, method, payerRef || undefined);
      setStage("success");
      load();
      void refreshChildren();
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Payment could not be completed.");
      setStage(method === "CARD" ? "card" : "momo");
    }
  }

  async function getCashReference() {
    if (!activeChild || !statement) return;
    try {
      const r = await api.fees.cashReference(activeChild.id, statement.balance);
      setCashRef(r.reference);
      setStage("cash");
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Could not create a reference.");
    }
  }

  const hasBalance = (statement?.balance ?? 0) > 0;
  const field = "w-full rounded-[12px] border-[1.5px] border-border-alt px-4 py-3.5 text-[14.5px] outline-none focus:border-brand-link";

  return (
    <>
      <AppBar />
      <div className="px-[18px] pb-6">
        <p className="mb-3 font-display text-[18px] font-semibold">Fees</p>

        {error && <ErrorState message={error} onRetry={load} />}
        {!error && statement === null && <Skeleton rows={4} />}

        {statement && (
          <>
            <div className="mb-4 rounded-[18px] bg-dark-pill p-[22px] text-white">
              <p className="mb-1.5 text-[12.5px] font-semibold text-[#C9CCD1]">OUTSTANDING BALANCE</p>
              <p className="font-display text-[34px] font-bold leading-none">{money(statement.balance)}</p>
              {statement.term && <p className="mt-2 text-[12.5px] text-[#9EA2A9]">{statement.term}</p>}
              {hasBalance && (
                <button
                  onClick={() => {
                    setPayError(null);
                    setStage("method");
                  }}
                  className="mt-4 w-full rounded-[12px] bg-brand py-3.5 text-[14.5px] font-bold text-text-primary active:opacity-80"
                >
                  Pay Now
                </button>
              )}
              {!hasBalance && statement.billed > 0 && (
                <p className="mt-3 rounded-[10px] bg-white/10 px-3 py-2 text-[12.5px] font-semibold text-[#B7E3C7]">
                  ✓ Fully paid — thank you
                </p>
              )}
            </div>

            {statement.lines.length === 0 ? (
              <EmptyState icon="💳" title="No fees billed yet" hint="Fee items appear here once the school bills them." />
            ) : (
              <>
                <p className="mb-2.5 text-sm font-bold text-[#22242A]">Itemised fees</p>
                <div className="flex flex-col gap-2">
                  {statement.lines.map((l) => {
                    const tint = STATUS_TINT[l.status] ?? STATUS_TINT.PENDING!;
                    const reduced = l.scholarshipAmount > 0 || l.discountAmount > 0;
                    return (
                      <div key={l.chargeId} className="rounded-[12px] bg-white px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-[#22242A]">{l.label}</span>
                          <span className="flex items-center gap-2.5">
                            {reduced && (
                              <span className="text-[12px] text-text-muted line-through">{money(l.originalAmount)}</span>
                            )}
                            <span className="text-sm font-bold text-[#22242A]">{money(l.netAmount)}</span>
                            <span className="rounded-pill px-2.5 py-1 text-[10.5px] font-bold" style={{ background: tint.bg, color: tint.color }}>
                              {l.status === "PAID" ? "Paid" : "Pending"}
                            </span>
                          </span>
                        </div>
                        {/* Deductions are always shown as their own line so a reduced
                            total never looks like an unexplained change. */}
                        {l.scholarshipNote && (
                          <p className="mt-1 text-[11.5px] font-medium text-success">🎓 {l.scholarshipNote}</p>
                        )}
                        {l.discountNote && <p className="mt-1 text-[11.5px] font-medium text-brand-link">🏷️ {l.discountNote}</p>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between rounded-[12px] bg-white px-4 py-3 text-sm">
                  <span className="font-semibold text-text-secondary">Billed {money(statement.billed)}</span>
                  <span className="font-semibold text-success">Paid {money(statement.paid)}</span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {stage !== "closed" && statement && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={() => stage !== "processing" && setStage("closed")}>
          <div
            className="w-full max-w-[480px] animate-sheet rounded-t-[24px] bg-white px-[22px] pb-9 pt-6"
            onClick={(e) => e.stopPropagation()}
          >
            {stage === "method" && (
              <>
                <p className="font-display text-[19px] font-semibold">Pay {money(statement.balance)}</p>
                <p className="mb-5 mt-1 text-[13px] text-text-muted">Choose a payment method</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { icon: "📱", label: "Mobile Money", go: () => setStage("momo") },
                    { icon: "💳", label: "Debit / Credit Card", go: () => setStage("card") },
                    { icon: "💵", label: "Cash at School Office", go: getCashReference },
                  ].map((m) => (
                    <button
                      key={m.label}
                      onClick={m.go}
                      className="flex items-center gap-3.5 rounded-[14px] border-[1.5px] border-border-alt px-4 py-3.5 text-left active:bg-bg"
                    >
                      <span className="text-[22px]">{m.icon}</span>
                      <span className="flex-1 text-[14.5px] font-bold">{m.label}</span>
                      <span className="text-[#C4C7CC]">→</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {stage === "momo" && (
              <>
                <p className="mb-5 font-display text-[19px] font-semibold">Mobile Money</p>
                <div className="mb-3.5 flex gap-2.5">
                  {NETWORKS.map((n) => (
                    <button
                      key={n.key}
                      onClick={() => setNetwork(n.key)}
                      className="flex-1 rounded-[12px] border-[1.5px] py-3 text-[13px] font-bold"
                      style={{
                        borderColor: network === n.key ? "#2A2C30" : "#EEEBE3",
                        background: network === n.key ? "#2A2C30" : "#fff",
                        color: network === n.key ? "#FFC629" : "#565A62",
                      }}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
                <input
                  className={`${field} mb-4`}
                  inputMode="tel"
                  placeholder="Mobile money number"
                  value={payerRef}
                  onChange={(e) => setPayerRef(e.target.value)}
                />
                {payError && <p className="mb-3 text-[13px] font-medium text-danger">{payError}</p>}
                <button
                  onClick={() => pay(network)}
                  className="w-full rounded-[12px] bg-brand py-[15px] text-[15px] font-bold text-text-primary"
                >
                  Pay {money(statement.balance)}
                </button>
              </>
            )}

            {stage === "card" && (
              <>
                <p className="mb-5 font-display text-[19px] font-semibold">Card Payment</p>
                <input className={`${field} mb-2.5`} inputMode="numeric" placeholder="Card number" onChange={(e) => setPayerRef(e.target.value.slice(-4))} />
                <div className="mb-4 flex gap-2.5">
                  <input className={field} placeholder="MM/YY" />
                  <input className={field} placeholder="CVC" inputMode="numeric" />
                </div>
                {payError && <p className="mb-3 text-[13px] font-medium text-danger">{payError}</p>}
                <button onClick={() => pay("CARD")} className="w-full rounded-[12px] bg-brand py-[15px] text-[15px] font-bold text-text-primary">
                  Pay {money(statement.balance)}
                </button>
              </>
            )}

            {stage === "cash" && (
              <>
                <p className="mb-4 font-display text-[19px] font-semibold">Pay Cash at Office</p>
                <div className="mb-4 rounded-[14px] bg-[#FFF7DF] p-4">
                  <p className="mb-2.5 text-[13px] leading-[1.6] text-[#6B6F76]">
                    Take this reference to the school&apos;s front office. Your balance updates once the office confirms
                    the payment.
                  </p>
                  <p className="rounded-[10px] bg-white py-3.5 text-center font-mono text-[20px] font-bold tracking-[0.06em] text-[#22242A]">
                    {cashRef}
                  </p>
                </div>
                <button onClick={() => setStage("closed")} className="w-full rounded-[12px] bg-dark-pill py-[15px] text-[15px] font-bold text-brand">
                  Got it
                </button>
              </>
            )}

            {stage === "processing" && (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-[3px] border-border border-t-brand-link" />
                <p className="font-display text-[17px] font-semibold">Processing payment…</p>
              </div>
            )}

            {stage === "success" && (
              <div className="pb-1 pt-2.5 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E9F7EE] text-3xl">✓</div>
                <p className="mb-1.5 font-display text-[19px] font-semibold">Payment Successful</p>
                <p className="mb-6 text-[13.5px] text-text-muted">
                  Received for {activeChild?.name}. Thank you.
                </p>
                <button onClick={() => setStage("closed")} className="w-full rounded-[12px] bg-brand py-[15px] text-[15px] font-bold text-text-primary">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
