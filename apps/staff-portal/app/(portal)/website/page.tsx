"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Field, PageHeader, Skeleton, inputClass, useToast } from "@/components/ui";

type Section = "identity" | "hero" | "about" | "programmes" | "safety" | "trust" | "steps" | "testimonials" | "events" | "cafeteria";

interface ContentBundle {
  school: Record<string, unknown>;
  content: Record<string, unknown> | null;
  programmes: { id: string; name: string; ageRange: string | null; description: string | null; icon: string | null; tint: string | null; comingSoon: boolean }[];
  safetyPolicies: { id: string; title: string; description: string | null; icon: string | null }[];
  trustBadges: { id: string; label: string; icon: string | null }[];
  admissionSteps: { id: string; title: string; description: string | null }[];
  testimonials: { id: string; authorName: string; relation: string | null; quote: string }[];
  events: { id: string; title: string; date: string; time: string | null }[];
  cafeteria: { id: string; dayOfWeek: string; main: string; side: string | null }[];
}

const SECTIONS: { key: Section; label: string }[] = [
  { key: "identity", label: "School details" },
  { key: "hero", label: "Hero" },
  { key: "about", label: "About" },
  { key: "programmes", label: "Academics" },
  { key: "trust", label: "Trust badges" },
  { key: "steps", label: "Admission steps" },
  { key: "safety", label: "Safety" },
  { key: "testimonials", label: "Testimonials" },
  { key: "events", label: "Events" },
  { key: "cafeteria", label: "Cafeteria" },
];

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

/** Everything the public website shows is edited here — nothing is hardcoded. */
export default function WebsitePage() {
  const [section, setSection] = useState<Section>("identity");
  const [data, setData] = useState<ContentBundle | null>(null);
  const [school, setSchool] = useState<Record<string, string>>({});
  const [content, setContent] = useState<Record<string, string | number>>({});
  const [saving, setSaving] = useState(false);
  const { toast, toastNode } = useToast();

  const load = useCallback(() => {
    api.content
      .get()
      .then((d) => {
        const bundle = d as unknown as ContentBundle;
        setData(bundle);
        const s = bundle.school as Record<string, unknown>;
        setSchool(
          Object.fromEntries(
            ["name", "shortName", "primaryColor", "phone", "email", "whatsappPhone", "address", "officeHours", "accreditation", "gesRegNo", "logoUrl"].map(
              (k) => [k, (s[k] as string) ?? ""],
            ),
          ),
        );
        setContent((bundle.content ?? {}) as Record<string, string | number>);
      })
      .catch(() => setData(null));
  }, []);

  useEffect(load, [load]);

  async function saveSchool() {
    setSaving(true);
    try {
      await api.content.updateSchool(school);
      toast({ kind: "ok", text: "Saved — your website updates within a minute" });
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  async function saveContent() {
    setSaving(true);
    try {
      const numeric = ["statsStudents", "statsTeachers", "statsYears"];
      const payload = Object.fromEntries(
        Object.entries(content)
          .filter(([, v]) => v !== "" && v != null)
          .map(([k, v]) => [k, numeric.includes(k) ? Number(v) : v]),
      );
      await api.content.update(payload);
      toast({ kind: "ok", text: "Saved — your website updates within a minute" });
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <Skeleton rows={6} />;

  const text = (key: string, label: string, hint?: string, area = false) => (
    <Field key={key} label={label} hint={hint}>
      {area ? (
        <textarea
          className={`${inputClass} h-24 resize-none`}
          value={(content[key] as string) ?? ""}
          onChange={(e) => setContent({ ...content, [key]: e.target.value })}
        />
      ) : (
        <input
          className={inputClass}
          value={(content[key] as string) ?? ""}
          onChange={(e) => setContent({ ...content, [key]: e.target.value })}
        />
      )}
    </Field>
  );

  return (
    <>
      <PageHeader title="Website" subtitle="Everything your public site shows — edit it here" />

      <div className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className="rounded-pill px-4 py-2 text-[12.5px] font-bold transition-colors"
            style={{ background: section === s.key ? "#2A2C30" : "#fff", color: section === s.key ? "#FFC629" : "#565A62" }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "identity" && (
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["name", "School name"],
              ["shortName", "Short name"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["whatsappPhone", "WhatsApp number"],
              ["address", "Address"],
              ["officeHours", "Office hours"],
              ["accreditation", "Accreditation line"],
              ["gesRegNo", "GES registration no."],
              ["logoUrl", "Logo image URL"],
            ].map(([key, label]) => (
              <Field key={key} label={label!}>
                <input className={inputClass} value={school[key!] ?? ""} onChange={(e) => setSchool({ ...school, [key!]: e.target.value })} />
              </Field>
            ))}
            <Field label="Brand colour">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-[46px] w-14 cursor-pointer rounded-[10px] border-[1.5px] border-border-alt"
                  value={school.primaryColor || "#FFC629"}
                  onChange={(e) => setSchool({ ...school, primaryColor: e.target.value })}
                />
                <input className={inputClass} value={school.primaryColor ?? ""} onChange={(e) => setSchool({ ...school, primaryColor: e.target.value })} />
              </div>
            </Field>
          </div>
          <Button className="mt-5" onClick={saveSchool} disabled={saving}>
            {saving ? "Saving…" : "Save school details"}
          </Button>
        </Card>
      )}

      {section === "hero" && (
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            {text("heroEyebrow", "Eyebrow pill", "e.g. CRÈCHE – PRIMARY · ADMISSIONS OPEN")}
            {text("heroHeadline", "Headline", "The big line at the top of your site")}
            {text("heroSubcopy", "Sub-copy", undefined, true)}
            <div className="grid gap-4 sm:grid-cols-3">
              {(["statsStudents", "statsTeachers", "statsYears"] as const).map((k) => (
                <Field key={k} label={k === "statsStudents" ? "Students" : k === "statsTeachers" ? "Teachers" : "Years running"}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={(content[k] as number) ?? ""}
                    onChange={(e) => setContent({ ...content, [k]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
            {text("footerBlurb", "Footer blurb", undefined, true)}
          </div>
          <Button className="mt-5" onClick={saveContent} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </Card>
      )}

      {section === "about" && (
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            {text("aboutEyebrow", "Eyebrow", "e.g. OUR STORY")}
            {text("aboutHeading", "Heading")}
            {text("aboutText", "First paragraph", undefined, true)}
            {text("aboutTextSecondary", "Second paragraph", undefined, true)}
            <div className="grid gap-4 sm:grid-cols-2">
              {text("missionText", "Mission", undefined, true)}
              {text("visionText", "Vision", undefined, true)}
            </div>
            {text("academicsHeading", "Academics heading")}
            {text("academicsSubcopy", "Academics sub-copy", undefined, true)}
            {text("admissionsHeading", "Admissions heading")}
            {text("admissionsText", "Admissions text", undefined, true)}
            {text("safetyHeading", "Safety heading")}
            {text("safetySubcopy", "Safety sub-copy", undefined, true)}
            {text("voiceText", "Parent Voice blurb", undefined, true)}
            {text("feesNote", "Fees note", "Shown under the fee table", true)}
          </div>
          <Button className="mt-5" onClick={saveContent} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </Card>
      )}

      {section === "programmes" && (
        <ListEditor
          title="Academic programmes"
          hint="The cards under “Academics”. Mark one Coming Soon to show the ribbon."
          items={data.programmes.map((p) => ({ id: p.id, primary: p.name, secondary: [p.ageRange, p.description].filter(Boolean).join(" · ") }))}
          collection="programmes"
          onChange={load}
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "ageRange", label: "Age range" },
            { key: "description", label: "Description", area: true },
            { key: "icon", label: "Emoji", placeholder: "📚" },
            { key: "tint", label: "Tile colour", placeholder: "#FFF0BF" },
            { key: "comingSoon", label: "Coming soon", checkbox: true },
          ]}
        />
      )}

      {section === "safety" && (
        <ListEditor
          title="Safety policies"
          hint="Shown as cards in the dark Safety section."
          items={data.safetyPolicies.map((p) => ({ id: p.id, primary: p.title, secondary: p.description ?? "" }))}
          collection="safety-policies"
          onChange={load}
          fields={[
            { key: "title", label: "Title", required: true },
            { key: "description", label: "Description", area: true },
            { key: "icon", label: "Emoji", placeholder: "🪪" },
          ]}
        />
      )}

      {section === "trust" && (
        <ListEditor
          title="Trust badges"
          hint="Short proof points — registration number, class sizes, ratios."
          items={data.trustBadges.map((b) => ({ id: b.id, primary: b.label, secondary: "" }))}
          collection="trust-badges"
          onChange={load}
          fields={[
            { key: "label", label: "Label", required: true, placeholder: "1:14 teacher-to-pupil ratio" },
            { key: "icon", label: "Emoji", placeholder: "✓" },
          ]}
        />
      )}

      {section === "steps" && (
        <ListEditor
          title="Admission steps"
          hint="Numbered automatically in the order you add them."
          items={data.admissionSteps.map((s) => ({ id: s.id, primary: s.title, secondary: s.description ?? "" }))}
          collection="admission-steps"
          onChange={load}
          fields={[
            { key: "title", label: "Step title", required: true },
            { key: "description", label: "Description", area: true },
          ]}
        />
      )}

      {section === "testimonials" && (
        <ListEditor
          title="Testimonials"
          hint="Parent quotes shown beside the trust badges."
          items={data.testimonials.map((t) => ({ id: t.id, primary: t.authorName, secondary: t.quote }))}
          collection="testimonials"
          onChange={load}
          fields={[
            { key: "authorName", label: "Name", required: true },
            { key: "relation", label: "Relation", placeholder: "Parent, Primary 4" },
            { key: "quote", label: "Quote", required: true, area: true },
          ]}
        />
      )}

      {section === "events" && <EventsEditor events={data.events} onChange={load} />}
      {section === "cafeteria" && <CafeteriaEditor menu={data.cafeteria} onChange={load} />}

      {toastNode}
    </>
  );
}

interface EditorField {
  key: string;
  label: string;
  required?: boolean;
  area?: boolean;
  checkbox?: boolean;
  placeholder?: string;
}

function ListEditor({
  title,
  hint,
  items,
  collection,
  fields,
  onChange,
}: {
  title: string;
  hint: string;
  items: { id: string; primary: string; secondary: string }[];
  collection: string;
  fields: EditorField[];
  onChange: () => void;
}) {
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== "" && v != null));
      await api.content.add(collection, payload);
      setForm({});
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await api.content.remove(collection, id);
    onChange();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <p className="mb-1 text-[15px] font-bold">{title}</p>
        <p className="mb-4 text-[12.5px] text-text-muted">{hint}</p>
        {items.length === 0 && <p className="text-[13px] text-text-muted">Nothing added yet.</p>}
        <div className="flex flex-col gap-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-start justify-between gap-3 rounded-[10px] bg-bg px-4 py-3">
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold">{i.primary}</span>
                {i.secondary && <span className="block text-[12px] leading-snug text-text-muted">{i.secondary}</span>}
              </span>
              <button onClick={() => remove(i.id)} className="shrink-0 text-[12px] font-bold text-text-muted hover:text-danger">
                Remove
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className="mb-4 text-[15px] font-bold">Add new</p>
        <form onSubmit={add} className="flex flex-col gap-4">
          {fields.map((f) =>
            f.checkbox ? (
              <label key={f.key} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                />
                <span className="text-[13px] font-semibold">{f.label}</span>
              </label>
            ) : (
              <Field key={f.key} label={f.label}>
                {f.area ? (
                  <textarea
                    className={`${inputClass} h-20 resize-none`}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={(form[f.key] as string) ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <input
                    className={inputClass}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={(form[f.key] as string) ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
              </Field>
            ),
          )}
          {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Adding…" : "Add"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function EventsEditor({ events, onChange }: { events: { id: string; title: string; date: string; time: string | null }[]; onChange: () => void }) {
  const [form, setForm] = useState({ title: "", date: "", time: "" });
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.content.addEvent(form);
      setForm({ title: "", date: "", time: "" });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <p className="mb-4 text-[15px] font-bold">Events</p>
        {events.length === 0 && <p className="text-[13px] text-text-muted">No events yet.</p>}
        <div className="flex flex-col gap-2">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between gap-3 rounded-[10px] bg-bg px-4 py-3">
              <span>
                <span className="block text-[13.5px] font-bold">{ev.title}</span>
                <span className="block text-[12px] text-text-muted">
                  {new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {ev.time ? ` · ${ev.time}` : ""}
                </span>
              </span>
              <button
                onClick={async () => {
                  await api.content.removeEvent(ev.id);
                  onChange();
                }}
                className="text-[12px] font-bold text-text-muted hover:text-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className="mb-4 text-[15px] font-bold">Add an event</p>
        <form onSubmit={add} className="flex flex-col gap-4">
          <Field label="Title">
            <input className={inputClass} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Date">
            <input className={inputClass} type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Time & place" hint="e.g. 9:00am · Main Hall">
            <input className={inputClass} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Adding…" : "Add event"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function CafeteriaEditor({ menu, onChange }: { menu: { id: string; dayOfWeek: string; main: string; side: string | null }[]; onChange: () => void }) {
  const [rows, setRows] = useState<Record<string, { main: string; side: string }>>(() =>
    Object.fromEntries(DAYS.map((d) => [d, { main: menu.find((m) => m.dayOfWeek === d)?.main ?? "", side: menu.find((m) => m.dayOfWeek === d)?.side ?? "" }])),
  );
  const [busy, setBusy] = useState(false);
  const { toast, toastNode } = useToast();

  async function save() {
    setBusy(true);
    try {
      for (const day of DAYS) {
        const row = rows[day]!;
        if (!row.main.trim()) continue;
        await api.content.saveMenu({ dayOfWeek: day, main: row.main.trim(), side: row.side.trim() || undefined });
      }
      toast({ kind: "ok", text: "Menu saved" });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <p className="mb-4 text-[15px] font-bold">Cafeteria menu</p>
      <div className="flex flex-col gap-3">
        {DAYS.map((d) => (
          <div key={d} className="grid gap-3 sm:grid-cols-[110px_1fr_1fr] sm:items-center">
            <span className="text-[12.5px] font-bold text-text-muted">{d}</span>
            <input
              className={inputClass}
              placeholder="Main dish"
              value={rows[d]!.main}
              onChange={(e) => setRows({ ...rows, [d]: { ...rows[d]!, main: e.target.value } })}
            />
            <input
              className={inputClass}
              placeholder="Sides"
              value={rows[d]!.side}
              onChange={(e) => setRows({ ...rows, [d]: { ...rows[d]!, side: e.target.value } })}
            />
          </div>
        ))}
      </div>
      <Button className="mt-5" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save menu"}
      </Button>
      {toastNode}
    </Card>
  );
}
