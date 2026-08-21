"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  AccessCodeCard,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  PageHeader,
  Skeleton,
  inputClass,
  useToast,
} from "@/components/ui";

type Tab = "students" | "staff" | "parents";

interface StudentRow {
  id: string;
  name: string;
  admissionNo: string | null;
  className: string;
  classId: string;
  active: boolean;
  monitored: boolean;
  initials: string;
  avatarColor: string;
  guardians: { id: string; name: string; phone: string; relation: string; isPrimary: boolean }[];
}
interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  phone: string | null;
  status: string;
  className: string | null;
  initials: string;
  pendingAccessCode: string | null;
}
interface ParentRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  initials: string;
  pendingAccessCode: string | null;
  children: { id: string; name: string; relation: string }[];
}

const RELATIONS = ["Father", "Mother", "Guardian", "Family member", "Other"];

export default function PeoplePage() {
  const [tab, setTab] = useState<Tab>("students");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<StudentRow[] | null>(null);
  const [staff, setStaff] = useState<StaffRow[] | null>(null);
  const [parents, setParents] = useState<ParentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<null | "student" | "staff" | "guardian" | "editStudent" | "editStaff" | "editParent">(null);
  const [guardianFor, setGuardianFor] = useState<StudentRow | null>(null);
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);
  const [editStaff, setEditStaff] = useState<StaffRow | null>(null);
  const [editParent, setEditParent] = useState<ParentRow | null>(null);
  const [issued, setIssued] = useState<{ name: string; code: string; audience: "staff" | "parent" } | null>(null);
  const { toast, toastNode } = useToast();

  const load = useCallback(() => {
    setError(null);
    api.admin.classes().then((c) => setClasses(c.map((x) => ({ id: x.id, name: x.name })))).catch(() => setClasses([]));
    api.admin
      .students()
      .then((s) => setStudents(s as StudentRow[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load pupils."));
    api.admin.staff().then((s) => setStaff(s as StaffRow[])).catch(() => setStaff([]));
    api.admin.parents().then((p) => setParents(p as ParentRow[])).catch(() => setParents([]));
  }, []);

  useEffect(load, [load]);

  async function resetAccess(kind: "staff" | "parent", id: string, name: string) {
    try {
      const res = kind === "staff" ? await api.admin.resetStaffAccess(id) : await api.admin.resetParentAccess(id);
      setIssued({ name, code: res.accessCode, audience: kind });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not reset access." });
    }
  }

  /**
   * Deleting a person only makes sense when there is nothing behind them — a name
   * typed twice, a teacher added by mistake. The server refuses once they have a
   * history and says what is holding it, so that message goes straight to the user
   * rather than being flattened into "could not delete".
   */
  async function removePerson(kind: "pupil" | "parent" | "teacher", id: string, name: string) {
    const alternative =
      kind === "pupil" ? "\n\nIf they have simply left the school, use Deactivate instead." : "";
    if (!window.confirm(`Remove ${name} permanently?${alternative}`)) return;
    try {
      if (kind === "pupil") await api.admin.deleteStudent(id);
      else if (kind === "parent") await api.admin.deleteParent(id);
      else await api.admin.deleteStaff(id);
      toast({ kind: "ok", text: `${name} removed` });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not remove." });
    }
  }

  async function unlinkGuardian(student: StudentRow, parentId: string, parentName: string) {
    if (!window.confirm(`Unlink ${parentName} from ${student.name}?\n\nThe parent's own account is not deleted.`)) return;
    try {
      await api.admin.unlinkGuardian(student.id, parentId);
      toast({ kind: "ok", text: `${parentName} unlinked` });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not unlink." });
    }
  }

  async function toggleActive(s: StudentRow) {
    try {
      await api.admin.updateStudent(s.id, { active: !s.active });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not update." });
    }
  }

  async function toggleMonitored(s: StudentRow) {
    try {
      await api.admin.updateStudent(s.id, { monitored: !s.monitored });
      load();
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not update." });
    }
  }

  const filtered = students?.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Staff & Pupils"
        subtitle="Add people, link guardians, and issue access codes"
        action={
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={() => setModal("staff")}>
              + Staff
            </Button>
            <Button variant="gold" onClick={() => setModal("student")} disabled={classes.length === 0}>
              + Pupil
            </Button>
          </div>
        }
      />

      {classes.length === 0 && (
        <Card className="mb-5 border-[1.5px] border-brand bg-[#FFF7DF] p-4 text-[13.5px] font-semibold text-[#8A6200]">
          Add at least one class under <strong>Classes &amp; Terms</strong> before adding pupils.
        </Card>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-pill border border-border-alt bg-white p-1">
          {(["students", "staff", "parents"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-pill px-4 py-1.5 text-[13px] font-bold capitalize transition-colors"
              style={{ background: tab === t ? "#2A2C30" : "transparent", color: tab === t ? "#FFC629" : "#565A62" }}
            >
              {t === "students" ? "Pupils" : t}
            </button>
          ))}
        </div>
        {tab === "students" && (
          <input
            className="w-56 rounded-[10px] border-[1.5px] border-border-alt px-3.5 py-2.5 text-sm outline-none focus:border-brand-link"
            placeholder="Search pupils…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {tab === "students" && (
        <>
          {!students && !error && <Skeleton rows={5} />}
          {students && students.length === 0 && (
            <EmptyState
              icon="🎒"
              title="No pupils yet"
              hint="Add your first pupil and, in the same step, link a guardian who'll get an access code for the Parent App."
              action={<Button onClick={() => setModal("student")} disabled={classes.length === 0}>+ Add pupil</Button>}
            />
          )}
          {filtered && filtered.length > 0 && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-bg">
                    <tr>
                      {["PUPIL", "CLASS", "GUARDIAN", "STATUS", ""].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-[12.5px] font-bold text-text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} className="border-b border-[#F0F0EE] last:border-0">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2.5">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                              style={{ background: s.avatarColor }}
                            >
                              {s.initials}
                            </span>
                            <span>
                              <span className="block text-sm font-semibold">{s.name}</span>
                              {s.admissionNo && <span className="block text-[11.5px] text-text-muted">{s.admissionNo}</span>}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13.5px] text-text-secondary">{s.className}</td>
                        <td className="px-5 py-3">
                          {s.guardians.length ? (
                            <span className="flex flex-col gap-1.5 text-[13px]">
                              {s.guardians.map((g) => (
                                <span key={g.id} className="group/g flex items-baseline gap-2">
                                  <span>
                                    <span className="block font-semibold">{g.name}</span>
                                    <span className="block text-[11.5px] text-text-muted">
                                      {g.relation} · {g.phone}
                                    </span>
                                  </span>
                                  {/* A pupil must keep at least one guardian, so the
                                      control only appears when there is a spare. */}
                                  {s.guardians.length > 1 && (
                                    <button
                                      onClick={() => unlinkGuardian(s, g.id, g.name)}
                                      className="text-[11px] font-bold text-text-muted opacity-0 transition-opacity hover:text-danger group-hover/g:opacity-100"
                                    >
                                      unlink
                                    </button>
                                  )}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setGuardianFor(s);
                                setModal("guardian");
                              }}
                              className="text-[12.5px] font-bold text-brand-link"
                            >
                              + Link guardian
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex flex-wrap gap-1.5">
                            <Badge label={s.active ? "Active" : "Inactive"} tone={s.active ? "green" : "red"} />
                            {s.monitored && <Badge label="★ Monitored" tone="amber" />}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="flex justify-end gap-3 text-[12px] font-bold">
                            <button onClick={() => toggleMonitored(s)} className="text-text-muted hover:text-brand-link">
                              {s.monitored ? "Unflag" : "Flag"}
                            </button>
                            <button
                              onClick={() => {
                                setGuardianFor(s);
                                setModal("guardian");
                              }}
                              className="text-brand-link"
                            >
                              + Guardian
                            </button>
                            <button
                              onClick={() => {
                                setEditStudent(s);
                                setModal("editStudent");
                              }}
                              className="text-text-muted hover:text-brand-link"
                            >
                              Edit
                            </button>
                            <button onClick={() => toggleActive(s)} className="text-text-muted hover:text-danger">
                              {s.active ? "Deactivate" : "Restore"}
                            </button>
                            <button
                              onClick={() => removePerson("pupil", s.id, s.name)}
                              className="text-text-muted hover:text-danger"
                            >
                              Delete
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
        </>
      )}

      {tab === "staff" && (
        <>
          {!staff && <Skeleton rows={4} />}
          {staff && staff.length === 0 && <EmptyState icon="👩‍🏫" title="No staff yet" hint="Add teachers, administrators and gate staff." />}
          {staff && staff.length > 0 && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-bg">
                    <tr>
                      {["NAME", "ROLE", "CONTACT", "STATUS", ""].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-[12.5px] font-bold text-text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((s) => (
                      <tr key={s.id} className="border-b border-[#F0F0EE] last:border-0">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold">
                              {s.initials}
                            </span>
                            <span>
                              <span className="block text-sm font-semibold">{s.name}</span>
                              <span className="block text-[11.5px] text-text-muted">{s.email}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13.5px] text-text-secondary">
                          {s.title || s.role}
                          {s.className && <span className="block text-[11.5px] text-text-muted">{s.className}</span>}
                        </td>
                        <td className="px-5 py-3 text-[13.5px] text-text-secondary">{s.phone ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className="flex flex-wrap gap-1.5">
                            <Badge
                              label={s.status.replace("_", " ")}
                              tone={s.status === "ACTIVE" ? "green" : s.status === "ON_LEAVE" ? "amber" : "red"}
                            />
                            {s.pendingAccessCode && <Badge label="Code not used" tone="blue" />}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="flex justify-end gap-3 text-[12px] font-bold">
                            <button
                              onClick={() =>
                                s.pendingAccessCode
                                  ? setIssued({ name: s.name, code: s.pendingAccessCode, audience: "staff" })
                                  : resetAccess("staff", s.id, s.name)
                              }
                              className="text-brand-link"
                            >
                              {s.pendingAccessCode ? "Show code" : "Reset access"}
                            </button>
                            <button
                              onClick={() => {
                                setEditStaff(s);
                                setModal("editStaff");
                              }}
                              className="text-text-muted hover:text-brand-link"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removePerson("teacher", s.id, s.name)}
                              className="text-text-muted hover:text-danger"
                            >
                              Delete
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
        </>
      )}

      {tab === "parents" && (
        <>
          {!parents && <Skeleton rows={4} />}
          {parents && parents.length === 0 && (
            <EmptyState icon="👨‍👩‍👧" title="No guardians yet" hint="Guardians are created when you link them to a pupil." />
          )}
          {parents && parents.length > 0 && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="bg-bg">
                    <tr>
                      {["GUARDIAN", "PHONE", "CHILDREN", ""].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-[12.5px] font-bold text-text-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parents.map((p) => (
                      <tr key={p.id} className="border-b border-[#F0F0EE] last:border-0">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E7F0F7] text-[12px] font-bold">
                              {p.initials}
                            </span>
                            <span className="text-sm font-semibold">{p.name}</span>
                            {p.pendingAccessCode && <Badge label="Code not used" tone="blue" />}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13.5px] text-text-secondary">{p.phone}</td>
                        <td className="px-5 py-3 text-[13px] text-text-secondary">
                          {p.children.map((c) => `${c.name} (${c.relation})`).join(", ") || "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="flex justify-end gap-3 text-[12px] font-bold">
                            <button
                              onClick={() =>
                                p.pendingAccessCode
                                  ? setIssued({ name: p.name, code: p.pendingAccessCode, audience: "parent" })
                                  : resetAccess("parent", p.id, p.name)
                              }
                              className="text-brand-link"
                            >
                              {p.pendingAccessCode ? "Show code" : "Reset access"}
                            </button>
                            <button
                              onClick={() => {
                                setEditParent(p);
                                setModal("editParent");
                              }}
                              className="text-text-muted hover:text-brand-link"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removePerson("parent", p.id, p.name)}
                              className="text-text-muted hover:text-danger"
                            >
                              Delete
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
        </>
      )}

      {modal === "student" && (
        <AddStudentModal
          classes={classes}
          onClose={() => setModal(null)}
          onDone={(result) => {
            setModal(null);
            load();
            if (result.guardian?.accessCode) {
              setIssued({ name: result.guardian.name, code: result.guardian.accessCode, audience: "parent" });
            } else {
              toast({ kind: "ok", text: `${result.name} added to ${result.className}` });
            }
          }}
        />
      )}

      {modal === "staff" && (
        <AddStaffModal
          classes={classes}
          onClose={() => setModal(null)}
          onDone={(result) => {
            setModal(null);
            load();
            setIssued({ name: result.name, code: result.accessCode, audience: "staff" });
          }}
        />
      )}

      {modal === "guardian" && guardianFor && (
        <AddGuardianModal
          student={guardianFor}
          onClose={() => {
            setModal(null);
            setGuardianFor(null);
          }}
          onDone={(result) => {
            setModal(null);
            setGuardianFor(null);
            load();
            if (result.accessCode) setIssued({ name: result.name, code: result.accessCode, audience: "parent" });
            else toast({ kind: "ok", text: `${result.name} linked` });
          }}
        />
      )}

      {issued && (
        <Modal title="Access code issued" onClose={() => setIssued(null)}>
          <AccessCodeCard name={issued.name} code={issued.code} audience={issued.audience} />
          <Button className="mt-4 w-full !py-3" onClick={() => setIssued(null)}>
            Done
          </Button>
        </Modal>
      )}

      {modal === "editStudent" && editStudent && (
        <EditStudentModal
          student={editStudent}
          classes={classes}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
            toast({ kind: "ok", text: "Pupil updated" });
          }}
        />
      )}

      {modal === "editStaff" && editStaff && (
        <EditStaffModal
          staff={editStaff}
          classes={classes}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
            toast({ kind: "ok", text: "Staff member updated" });
          }}
        />
      )}

      {modal === "editParent" && editParent && (
        <EditParentModal
          parent={editParent}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            load();
            toast({ kind: "ok", text: "Guardian updated" });
          }}
        />
      )}

      {toastNode}
    </>
  );
}

/**
 * Correcting a record already in the register.
 *
 * A misspelt name is the commonest thing a school will ever need to fix — it goes
 * onto every report card and every fee statement — so it should take two clicks,
 * not a call to support.
 */
function EditStudentModal({
  student,
  classes,
  onClose,
  onDone,
}: {
  student: StudentRow;
  classes: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    name: student.name,
    admissionNo: student.admissionNo ?? "",
    classId: student.classId,
    monitored: student.monitored,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.updateStudent(student.id, { ...form, admissionNo: form.admissionNo || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save those changes.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`Edit ${student.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Full name" hint="Exactly as it should appear on report cards">
          <input className={inputClass} required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Admission number">
            <input className={inputClass} value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} />
          </Field>
          <Field label="Class">
            <select className={inputClass} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2.5 text-[14px] font-semibold">
          <input type="checkbox" checked={form.monitored} onChange={(e) => setForm({ ...form, monitored: e.target.checked })} />
          Flag as needing extra attention
        </label>
        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Modal>
  );
}

function EditStaffModal({
  staff,
  classes,
  onClose,
  onDone,
}: {
  staff: StaffRow;
  classes: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    name: staff.name,
    email: staff.email,
    phone: staff.phone ?? "",
    title: staff.title ?? "",
    status: staff.status,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.updateStaff(staff.id, {
        ...form,
        phone: form.phone || undefined,
        title: form.title || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save those changes.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`Edit ${staff.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Full name">
          <input className={inputClass} required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email" hint="This is how they sign in">
          <input className={inputClass} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Title">
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Class Teacher" />
          </Field>
        </div>
        <Field label="Status" hint="Inactive keeps their record and their trail, but stops them signing in">
          <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On leave</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Modal>
  );
}

function EditParentModal({ parent, onClose, onDone }: { parent: ParentRow; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: parent.name, phone: parent.phone, email: parent.email ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.updateParent(parent.id, form);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save those changes.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`Edit ${parent.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Full name">
          <input className={inputClass} required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Phone" hint="This is how they sign in to the Parent App">
          <input className={inputClass} required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Email (optional)">
          <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        {parent.children.length > 0 && (
          <p className="rounded-[10px] bg-bg px-3.5 py-2.5 text-[12.5px] leading-relaxed text-text-secondary">
            Guardian of {parent.children.map((c) => c.name).join(", ")}.
          </p>
        )}
        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Modal>
  );
}


function AddStudentModal({
  classes,
  onClose,
  onDone,
}: {
  classes: { id: string; name: string }[];
  onClose: () => void;
  onDone: (r: { name: string; className: string; guardian: { name: string; accessCode?: string } | null }) => void;
}) {
  const [form, setForm] = useState({ name: "", classId: classes[0]?.id ?? "", admissionNo: "", monitored: false });
  const [withGuardian, setWithGuardian] = useState(true);
  const [guardian, setGuardian] = useState({ name: "", phone: "", email: "", relation: "Father" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api.admin.createStudent({
        ...form,
        guardian: withGuardian && guardian.name && guardian.phone ? guardian : undefined,
      });
      onDone(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the pupil.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a pupil" onClose={onClose} wide>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input className={inputClass} required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Class">
            <select className={inputClass} required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Admission number" hint="Optional — used on report cards and fee references">
          <input className={inputClass} value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} />
        </Field>

        <label className="flex items-center gap-2.5 rounded-[10px] bg-bg px-3.5 py-3">
          <input type="checkbox" checked={withGuardian} onChange={(e) => setWithGuardian(e.target.checked)} className="h-4 w-4" />
          <span className="text-[13.5px] font-semibold">Link a guardian now (they get a Parent App access code)</span>
        </label>

        {withGuardian && (
          <div className="grid gap-4 rounded-[12px] border border-border-alt p-4 sm:grid-cols-2">
            <Field label="Guardian name">
              <input className={inputClass} required={withGuardian} value={guardian.name} onChange={(e) => setGuardian({ ...guardian, name: e.target.value })} />
            </Field>
            <Field label="Phone" hint="They sign in with this">
              <input className={inputClass} required={withGuardian} value={guardian.phone} onChange={(e) => setGuardian({ ...guardian, phone: e.target.value })} />
            </Field>
            <Field label="Relation">
              <select className={inputClass} value={guardian.relation} onChange={(e) => setGuardian({ ...guardian, relation: e.target.value })}>
                {RELATIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Email" hint="Optional">
              <input className={inputClass} type="email" value={guardian.email} onChange={(e) => setGuardian({ ...guardian, email: e.target.value })} />
            </Field>
          </div>
        )}

        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Adding…" : "Add pupil"}
        </Button>
      </form>
    </Modal>
  );
}

function AddStaffModal({
  classes,
  onClose,
  onDone,
}: {
  classes: { id: string; name: string }[];
  onClose: () => void;
  onDone: (r: { name: string; accessCode: string }) => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", role: "TEACHER", title: "Class Teacher", phone: "", classId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api.admin.createStaff({ ...form, classId: form.classId || null });
      onDone(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the staff member.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a staff member" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Full name">
          <input className={inputClass} required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email" hint="They sign in with this">
          <input className={inputClass} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Role">
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                  title:
                    e.target.value === "TEACHER"
                      ? "Class Teacher"
                      : e.target.value === "GATE_STAFF"
                        ? "Gate Staff"
                        : "Administrator",
                })
              }
            >
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Administrator</option>
              <option value="GATE_STAFF">Gate staff</option>
            </select>
          </Field>
          <Field label="Job title">
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
        </div>
        {form.role === "TEACHER" && (
          <Field label="Class teacher of" hint="Their register and mark book default to this class">
            <select className={inputClass} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">No class assigned</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Phone">
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>

        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Adding…" : "Add & issue access code"}
        </Button>
      </form>
    </Modal>
  );
}

function AddGuardianModal({
  student,
  onClose,
  onDone,
}: {
  student: StudentRow;
  onClose: () => void;
  onDone: (r: { name: string; accessCode?: string }) => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", relation: "Mother", isPrimary: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api.admin.addGuardian(student.id, form);
      onDone(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link the guardian.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`Link a guardian to ${student.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Guardian name">
          <input className={inputClass} required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input className={inputClass} required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Relation">
            <select className={inputClass} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
              {RELATIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Email" hint="Optional">
          <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} className="h-4 w-4" />
          <span className="text-[13px] font-semibold">Make this the default pickup guardian</span>
        </label>

        {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

        <Button type="submit" className="!py-3" disabled={busy}>
          {busy ? "Linking…" : "Link guardian"}
        </Button>
      </form>
    </Modal>
  );
}
