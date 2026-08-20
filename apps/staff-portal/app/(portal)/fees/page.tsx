"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Modal, PageHeader, Skeleton, inputClass, money, useToast } from "@/components/ui";

interface FeeItem {
  id: string;
  label: string;
  amount: number;
  classId: string | null;
  className: string;
}
interface OverviewRow {
  studentId: string;
  name: string;
  className: string;
  billed: number;
  paid: number;
  balance: number;
  status: string;
}
interface PendingCash {
  id: string;
  reference: string | null;
  amount: number;
  studentName: string;
  parentName: string | null;
  createdAt: string;
}

export default function FeesPage() {
  const [items, setItems] = useState<FeeItem[] | null>(null);
  const [overview, setOverview] = useState<{ expected: number; collected: number; outstanding: number; rows: OverviewRow[] } | null>(null);
  const [cash, setCash] = useState<PendingCash[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "item" | "adjust" | "payment">(null);
  const [target, setTarget] = useState<OverviewRow | null>(null);
  const [filter, setFilter] = useState<"all" | "owing">("all");
  const { toast, toastNode } = useToast();

  const load = useCallback(() => {
    setError(null);
    api.admin.feeItems().then((i) => setItems(i as FeeItem[])).catch(() => setItems([]));
    api.admin
      .feeOverview()
      .then((o) => setOverview(o as typeof overview))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load fees."));
    api.admin.pendingCash().then((c) => setCash(c as PendingCash[])).catch(() => setCash([]));
    api.admin.classes().then((c) => setClasses(c.map((x) => ({ id: x.id, name: x.name })))).catch(() => setClasses([]));
  }, []);

  useEffect(load, [load]);

  async function bill(item: FeeItem) {
    try {
      const res = await api.admin.billFeeItem(item.id);
      toast({ kind: "ok", text: res.billed ? `Billed ${res.billed} pupil(s)` : "Everyone is already billed for this" });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not bill." });
    }
  }

  async function confirmCash(p: PendingCash) {
    try {
      await api.admin.confirmPayment(p.id);
      toast({ kind: "ok", text: `Confirmed ${money(p.amount)} for ${p.studentName}` });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not confirm." });
    }
  }

  const rows = overview?.rows.filter((r) => (filter === "owing" ? r.balance > 0 : true)) ?? [];

  return (
    <>
      <PageHeader
        title="Fees"
        subtitle="Bill items, confirm payments, and see who owes what"
        action={
          <Button variant="gold" onClick={() => setModal("item")}>
            + Fee item
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {overview && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "TOTAL EXPECTED", value: overview.expected, tone: "#22242A" },
            { label: "COLLECTED", value: overview.collected, tone: "#2E8B52" },
            { label: "OUTSTANDING", value: overview.outstanding, tone: "#C74747" },
          ].map((s) => (
            <Card key={s.label} className="p-[18px]">
              <p className="mb-1.5 text-[12.5px] font-bold text-text-muted">{s.label}</p>
              <p className="font-display text-[24px] font-bold" style={{ color: s.tone }}>
                {money(s.value)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {cash.length > 0 && (
        <Card className="mb-6 border-[1.5px] border-brand bg-[#FFF7DF] p-5">
          <p className="mb-3 font-display text-[16px] font-semibold">Cash payments to confirm</p>
          <div className="flex flex-col gap-2">
            {cash.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-[12px] bg-white px-4 py-3">
                <span className="flex-1">
                  <span className="block text-sm font-bold">{p.studentName}</span>
                  <span className="block text-[12px] text-text-muted">
                    Ref <span className="font-mono font-bold">{p.reference}</span>
                    {p.parentName ? ` · from ${p.parentName}` : ""}
                  </span>
                </span>
                <span className="text-sm font-bold">{money(p.amount)}</span>
                <Button onClick={() => confirmCash(p)}>Confirm received</Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-[#8A6200]">
            Balances only change once you confirm — the parent&apos;s app updates immediately after.
          </p>
        </Card>
      )}

      <div className="mb-6">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-text-muted">Fee items</p>
        {!items && <Skeleton rows={3} />}
        {items && items.length === 0 && (
          <EmptyState
            icon="💰"
            title="No fee items yet"
            hint="Create the charges your school raises — tuition, feeding, PTA dues — then bill them to a class."
            action={<Button onClick={() => setModal("item")}>+ Add a fee item</Button>}
          />
        )}
        {items && items.length > 0 && (
          <Card className="overflow-hidden">
            {items.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-3 border-b border-[#F0F0EE] px-5 py-3.5 last:border-0">
                <span className="flex-1">
                  <span className="text-sm font-bold">{i.label}</span>
                  <span className="block text-[12px] text-text-muted">{i.className}</span>
                </span>
                <span className="text-sm font-bold">{money(i.amount)}</span>
                <Button variant="ghost" onClick={() => bill(i)}>
                  Bill to class
                </Button>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-bold uppercase tracking-wide text-text-muted">Pupil balances</p>
          <div className="inline-flex rounded-pill border border-border-alt bg-white p-1">
            {(["all", "owing"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-pill px-3.5 py-1.5 text-[12.5px] font-bold capitalize"
                style={{ background: filter === f ? "#2A2C30" : "transparent", color: filter === f ? "#FFC629" : "#565A62" }}
              >
                {f === "owing" ? "Owing only" : "All"}
              </button>
            ))}
          </div>
        </div>

        {!overview && !error && <Skeleton rows={5} />}
        {overview && overview.rows.length === 0 && (
          <EmptyState icon="🧾" title="Nothing billed yet" hint="Add fee items above and bill them to a class to see balances here." />
        )}
        {rows.length > 0 && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="bg-bg">
                  <tr>
                    {["PUPIL", "CLASS", "BILLED", "PAID", "BALANCE", "STATUS", ""].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-[12.5px] font-bold text-text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.studentId} className="border-b border-[#F0F0EE] last:border-0">
                      <td className="px-5 py-3 text-sm font-semibold">{r.name}</td>
                      <td className="px-5 py-3 text-[13.5px] text-text-secondary">{r.className}</td>
                      <td className="px-5 py-3 text-[13.5px]">{money(r.billed)}</td>
                      <td className="px-5 py-3 text-[13.5px] text-success">{money(r.paid)}</td>
                      <td className="px-5 py-3 text-sm font-bold">{money(r.balance)}</td>
                      <td className="px-5 py-3">
                        <Badge
                          label={r.status}
                          tone={r.status === "Paid" ? "green" : r.status === "Part-paid" ? "amber" : r.status === "Not billed" ? "grey" : "red"}
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="flex justify-end gap-3 text-[12px] font-bold">
                          <button
                            onClick={() => {
                              setTarget(r);
                              setModal("payment");
                            }}
                            className="text-brand-link"
                          >
                            Record payment
                          </button>
                          <button
                            onClick={() => {
                              setTarget(r);
                              setModal("adjust");
                            }}
                            className="text-text-muted hover:text-brand-link"
                          >
                            Discount
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {modal === "item" && (
        <AddFeeItemModal
          classes={classes}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
          }}
        />
      )}

      {modal === "payment" && target && (
        <RecordPaymentModal
          row={target}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
            toast({ kind: "ok", text: "Payment recorded" });
          }}
        />
      )}

      {modal === "adjust" && target && (
        <AdjustModal
          row={target}
          items={items ?? []}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
            toast({ kind: "ok", text: "Applied — the parent sees it as a line-item deduction" });
          }}
        />
      )}

      {toastNode}
    </>
  );
}

function AddFeeItemModal({ classes, onClose, onDone }: { classes: { id: string; name: string }[]; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ label: "", amount: 0, classId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.createFeeItem({ ...form, classId: form.classId || null });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the fee item.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a fee item" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Name" hint="Items named “Tuition” and “Feeding fee” appear in the website's fee table">
          <input className={inputClass} required autoFocus value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Tuition" />
        </Field>
        <Field label="Amount (GH₵)">
          <input className={inputClass} type="number" min={0} step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
        </Field>
        <Field label="Applies to">
          <select className={inputClass} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Adding…" : "Add fee item"}
        </Button>
      </form>
    </Modal>
  );
}

function RecordPaymentModal({ row, onClose, onDone }: { row: OverviewRow; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(row.balance);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.manualPayment({ studentId: row.studentId, amount, note: note || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the payment.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`Record payment — ${row.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="rounded-[10px] bg-bg px-3.5 py-2.5 text-[13px]">
          Outstanding balance: <strong>{money(row.balance)}</strong>
        </p>
        <Field label="Amount received (GH₵)">
          <input className={inputClass} type="number" min={0.01} step="0.01" required autoFocus value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </Field>
        <Field label="Note" hint="Optional — appears on the family's statement">
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cash received at office" />
        </Field>
        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Recording…" : "Record payment"}
        </Button>
      </form>
    </Modal>
  );
}

function AdjustModal({
  row,
  items,
  onClose,
  onDone,
}: {
  row: OverviewRow;
  items: FeeItem[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"discount" | "scholarship">("discount");
  const [discount, setDiscount] = useState({ amountType: "FIXED" as "FIXED" | "PERCENT", value: 0, reason: "", feeLineItemId: "", recurring: false });
  const [scholarship, setScholarship] = useState({
    name: "",
    sponsor: "",
    feeLineItemId: items[0]?.id ?? "",
    subsidyType: "PERCENT" as "FIXED" | "PERCENT",
    subsidyValue: 25,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "discount") {
        await api.admin.createDiscount({
          studentId: row.studentId,
          ...discount,
          feeLineItemId: discount.feeLineItemId || null,
        });
      } else {
        await api.admin.createScholarship({
          studentId: row.studentId,
          name: scholarship.name,
          sponsor: scholarship.sponsor || undefined,
          validFrom: new Date().toISOString(),
          coverage: [
            {
              feeLineItemId: scholarship.feeLineItemId,
              subsidyType: scholarship.subsidyType,
              subsidyValue: scholarship.subsidyValue,
            },
          ],
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`Adjust fees — ${row.name}`} onClose={onClose}>
      <div className="mb-4 inline-flex rounded-pill border border-border-alt bg-white p-1">
        {(["discount", "scholarship"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="rounded-pill px-4 py-1.5 text-[13px] font-bold capitalize"
            style={{ background: mode === m ? "#2A2C30" : "transparent", color: mode === m ? "#FFC629" : "#565A62" }}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === "discount" ? (
          <>
            <Field label="Reason" hint="Recorded for audit — the parent sees this on their statement">
              <input className={inputClass} required autoFocus value={discount.reason} onChange={(e) => setDiscount({ ...discount, reason: e.target.value })} placeholder="Sibling discount" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select className={inputClass} value={discount.amountType} onChange={(e) => setDiscount({ ...discount, amountType: e.target.value as "FIXED" | "PERCENT" })}>
                  <option value="FIXED">Fixed amount (GH₵)</option>
                  <option value="PERCENT">Percentage</option>
                </select>
              </Field>
              <Field label={discount.amountType === "PERCENT" ? "Percent off" : "Amount off (GH₵)"}>
                <input className={inputClass} type="number" min={0.01} step="0.01" required value={discount.value} onChange={(e) => setDiscount({ ...discount, value: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="Applies to">
              <select className={inputClass} value={discount.feeLineItemId} onChange={(e) => setDiscount({ ...discount, feeLineItemId: e.target.value })}>
                <option value="">Whole balance</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={discount.recurring} onChange={(e) => setDiscount({ ...discount, recurring: e.target.checked })} className="h-4 w-4" />
              <span className="text-[13px] font-semibold">Repeat every term</span>
            </label>
          </>
        ) : (
          <>
            <Field label="Scholarship name">
              <input className={inputClass} required autoFocus value={scholarship.name} onChange={(e) => setScholarship({ ...scholarship, name: e.target.value })} placeholder="Founders Scholarship" />
            </Field>
            <Field label="Sponsor" hint="Optional">
              <input className={inputClass} value={scholarship.sponsor} onChange={(e) => setScholarship({ ...scholarship, sponsor: e.target.value })} />
            </Field>
            <Field label="Covers which fee" hint="Scholarships subsidise specific items, not the whole bill">
              <select className={inputClass} required value={scholarship.feeLineItemId} onChange={(e) => setScholarship({ ...scholarship, feeLineItemId: e.target.value })}>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label} — {money(i.amount)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select className={inputClass} value={scholarship.subsidyType} onChange={(e) => setScholarship({ ...scholarship, subsidyType: e.target.value as "FIXED" | "PERCENT" })}>
                  <option value="PERCENT">Percentage</option>
                  <option value="FIXED">Fixed amount (GH₵)</option>
                </select>
              </Field>
              <Field label={scholarship.subsidyType === "PERCENT" ? "Percent covered" : "Amount covered (GH₵)"}>
                <input className={inputClass} type="number" min={0.01} step="0.01" required value={scholarship.subsidyValue} onChange={(e) => setScholarship({ ...scholarship, subsidyValue: Number(e.target.value) })} />
              </Field>
            </div>
          </>
        )}

        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

        <Button type="submit" className="!py-3" disabled={busy || items.length === 0}>
          {busy ? "Applying…" : `Apply ${mode}`}
        </Button>
      </form>
    </Modal>
  );
}
