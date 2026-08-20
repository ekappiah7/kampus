"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Modal, PageHeader, Skeleton, inputClass, useToast } from "@/components/ui";

interface ClassRow {
  id: string;
  name: string;
  order: number;
  studentCount: number;
  teachers: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}
interface TermRow {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

/** Typical Ghanaian basic-school ladder — offered as a one-click starting point. */
const SUGGESTED_CLASSES = ["Crèche", "Nursery 1", "Nursery 2", "KG 1", "KG 2", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];
const SUGGESTED_SUBJECTS = ["Mathematics", "English Language", "Integrated Science", "Social Studies", "Creative Arts", "ICT", "Ghanaian Language", "Religious & Moral Education"];

export default function AcademicsPage() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [terms, setTerms] = useState<TermRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "class" | "term" | "subjects">(null);
  const [subjectTarget, setSubjectTarget] = useState<ClassRow | null>(null);
  const { toast, toastNode } = useToast();

  const load = useCallback(() => {
    setError(null);
    api.admin
      .classes()
      .then((c) => setClasses(c as ClassRow[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load classes."));
    api.admin.terms().then((t) => setTerms(t as TermRow[])).catch(() => setTerms([]));
  }, []);

  useEffect(load, [load]);

  async function addSuggestedClasses() {
    try {
      for (const [i, name] of SUGGESTED_CLASSES.entries()) {
        if (classes?.some((c) => c.name === name)) continue;
        await api.admin.createClass({ name, order: i + 1 });
      }
      toast({ kind: "ok", text: "Class ladder created" });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not create classes." });
    }
  }

  async function removeClass(c: ClassRow) {
    try {
      await api.admin.deleteClass(c.id);
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  async function setCurrent(t: TermRow) {
    await api.admin.setCurrentTerm(t.id);
    toast({ kind: "ok", text: `${t.name} is now the current term` });
    load();
  }

  const current = terms?.find((t) => t.isCurrent);

  return (
    <>
      <PageHeader
        title="Classes & Terms"
        subtitle="The structure everything else hangs off"
        action={
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={() => setModal("term")}>
              + Term
            </Button>
            <Button variant="gold" onClick={() => setModal("class")}>
              + Class
            </Button>
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="mb-6">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-text-muted">Terms</p>
        {!terms && <Skeleton rows={2} />}
        {terms && terms.length === 0 && (
          <EmptyState
            icon="📆"
            title="No term open"
            hint="Fees, marks and report cards all belong to a term. Open one to get started."
            action={<Button onClick={() => setModal("term")}>+ Open a term</Button>}
          />
        )}
        {terms && terms.length > 0 && (
          <Card className="overflow-hidden">
            {terms.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-[#F0F0EE] px-5 py-3.5 last:border-0">
                <span className="flex-1">
                  <span className="text-sm font-bold">
                    {t.name}, {t.academicYear}
                  </span>
                  <span className="block text-[12px] text-text-muted">
                    {new Date(t.startDate).toLocaleDateString("en-GB")} – {new Date(t.endDate).toLocaleDateString("en-GB")}
                  </span>
                </span>
                {t.isCurrent ? (
                  <Badge label="Current" tone="green" />
                ) : (
                  <button onClick={() => setCurrent(t)} className="text-[12px] font-bold text-brand-link">
                    Make current
                  </button>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-bold uppercase tracking-wide text-text-muted">Classes</p>
          {classes && classes.length === 0 && (
            <Button variant="ghost" onClick={addSuggestedClasses}>
              Use standard Crèche → Primary 6
            </Button>
          )}
        </div>

        {!classes && <Skeleton rows={4} />}
        {classes && classes.length === 0 && (
          <EmptyState
            icon="🏫"
            title="No classes yet"
            hint="Add the levels your school runs. You can use the standard ladder above, or add them one at a time."
            action={<Button onClick={() => setModal("class")}>+ Add a class</Button>}
          />
        )}
        {classes && classes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-[17px] font-semibold">{c.name}</p>
                    <p className="text-[12.5px] text-text-muted">
                      {c.studentCount} pupil{c.studentCount === 1 ? "" : "s"}
                      {c.teachers.length > 0 && ` · ${c.teachers[0]!.name}`}
                    </p>
                  </div>
                  {c.studentCount === 0 && (
                    <button onClick={() => removeClass(c)} className="text-[11.5px] font-bold text-text-muted hover:text-danger">
                      Delete
                    </button>
                  )}
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {c.subjects.length === 0 ? (
                    <span className="text-[12.5px] text-text-muted">No subjects yet</span>
                  ) : (
                    c.subjects.map((s) => (
                      <span key={s.id} className="rounded-pill bg-bg px-2.5 py-1 text-[11.5px] font-semibold">
                        {s.name}
                      </span>
                    ))
                  )}
                </div>

                <button
                  onClick={() => {
                    setSubjectTarget(c);
                    setModal("subjects");
                  }}
                  className="text-[12.5px] font-bold text-brand-link"
                >
                  Manage subjects
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {modal === "class" && (
        <AddClassModal
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
          }}
        />
      )}

      {modal === "term" && (
        <AddTermModal
          hasCurrent={!!current}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
          }}
        />
      )}

      {modal === "subjects" && subjectTarget && (
        <SubjectsModal
          cls={subjectTarget}
          allClasses={classes ?? []}
          onClose={() => {
            setModal(null);
            setSubjectTarget(null);
          }}
          onDone={() => {
            load();
          }}
        />
      )}

      {toastNode}
    </>
  );
}

function AddClassModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.createClass({ name });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the class.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a class" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Class name" hint="e.g. KG 2, Primary 4">
          <input className={inputClass} required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Adding…" : "Add class"}
        </Button>
      </form>
    </Modal>
  );
}

function AddTermModal({ hasCurrent, onClose, onDone }: { hasCurrent: boolean; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: "Term 1", academicYear: "", startDate: "", endDate: "", isCurrent: !hasCurrent });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.createTerm(form);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the term.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Open a term" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Term">
            <select className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}>
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </Field>
          <Field label="Academic year" hint="e.g. 2026/27">
            <input className={inputClass} required value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2026/27" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Starts">
            <input className={inputClass} type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="Ends">
            <input className={inputClass} type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Field>
        </div>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} className="h-4 w-4" />
          <span className="text-[13px] font-semibold">Make this the current term</span>
        </label>
        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Opening…" : "Open term"}
        </Button>
      </form>
    </Modal>
  );
}

function SubjectsModal({
  cls,
  allClasses,
  onClose,
  onDone,
}: {
  cls: ClassRow;
  allClasses: ClassRow[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [subjects, setSubjects] = useState(cls.subjects);
  const [name, setName] = useState("");
  const [applyAll, setApplyAll] = useState(false);
  const [busy, setBusy] = useState(false);

  async function add(subjectName: string) {
    if (!subjectName.trim()) return;
    setBusy(true);
    try {
      if (applyAll) {
        await api.admin.bulkSubjects(allClasses.map((c) => c.id), [subjectName.trim()]);
      } else {
        await api.admin.createSubject({ classId: cls.id, name: subjectName.trim() });
      }
      const refreshed = await api.admin.classes();
      setSubjects((refreshed.find((c) => c.id === cls.id)?.subjects ?? []) as ClassRow["subjects"]);
      setName("");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await api.admin.deleteSubject(id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    onDone();
  }

  const missing = SUGGESTED_SUBJECTS.filter((s) => !subjects.some((x) => x.name === s));

  return (
    <Modal title={`Subjects — ${cls.name}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {subjects.length === 0 && <span className="text-[13px] text-text-muted">No subjects yet.</span>}
          {subjects.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 rounded-pill bg-bg px-3 py-1.5 text-[12.5px] font-semibold">
              {s.name}
              <button onClick={() => remove(s.id)} className="text-text-muted hover:text-danger" aria-label={`Remove ${s.name}`}>
                ✕
              </button>
            </span>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void add(name);
          }}
          className="flex gap-2"
        >
          <input className={inputClass} placeholder="Add a subject" value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" disabled={busy || !name.trim()}>
            Add
          </Button>
        </form>

        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="h-4 w-4" />
          <span className="text-[13px] font-semibold">Apply to every class</span>
        </label>

        {missing.length > 0 && (
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-text-muted">Common subjects</p>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((s) => (
                <button
                  key={s}
                  onClick={() => void add(s)}
                  disabled={busy}
                  className="rounded-pill border border-border-alt px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary hover:border-brand-link hover:text-brand-link"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
