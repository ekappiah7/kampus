"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Badge, Button, Card, EmptyState, Field, PageHeader, Skeleton, inputClass, useToast } from "@/components/ui";

const TAGS = ["PTA", "ACADEMIC", "EVENT", "HEALTH", "GENERAL"];

interface PostRow {
  id: string;
  kind: string;
  title: string;
  body: string;
  status: string;
  tag: string | null;
  createdAt: string;
}

export default function PostPage() {
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const [kind, setKind] = useState<"HOMEWORK" | "ANNOUNCEMENT">(isAdmin ? "ANNOUNCEMENT" : "HOMEWORK");
  const [audience, setAudience] = useState<"WHOLE_SCHOOL" | "BY_LEVEL">(isAdmin ? "WHOLE_SCHOOL" : "BY_LEVEL");
  const [form, setForm] = useState({ title: "", body: "", subject: "", tag: "GENERAL", dueDate: "" });
  const [posts, setPosts] = useState<PostRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, toastNode } = useToast();

  function load() {
    api.staff.myPosts().then((p) => setPosts(p as PostRow[])).catch(() => setPosts([]));
  }
  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.staff.createPost({
        kind,
        audience,
        title: form.title,
        body: form.body,
        subject: kind === "HOMEWORK" ? form.subject || undefined : undefined,
        tag: kind === "ANNOUNCEMENT" ? form.tag : undefined,
        dueDate: kind === "HOMEWORK" && form.dueDate ? form.dueDate : undefined,
      });
      setForm({ title: "", body: "", subject: "", tag: "GENERAL", dueDate: "" });
      toast({ kind: "ok", text: isAdmin ? "Published — parents notified" : "Sent for admin approval" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? "School Announcements" : "Homework & Posts"}
        subtitle={isAdmin ? "Publish to the whole school or a single level" : "Post homework and class updates for parents"}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="mb-4 text-[14.5px] font-bold">New {kind === "HOMEWORK" ? "homework" : "announcement"}</p>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {!isAdmin && (
              <div className="inline-flex rounded-pill border border-border-alt bg-white p-1">
                {(["HOMEWORK", "ANNOUNCEMENT"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className="rounded-pill px-4 py-1.5 text-[12.5px] font-bold"
                    style={{ background: kind === k ? "#2A2C30" : "transparent", color: kind === k ? "#FFC629" : "#565A62" }}
                  >
                    {k === "HOMEWORK" ? "Homework" : "Class update"}
                  </button>
                ))}
              </div>
            )}

            <Field label="Title">
              <input className={inputClass} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Message">
              <textarea className={`${inputClass} h-28 resize-none`} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </Field>

            {kind === "HOMEWORK" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Subject">
                  <input className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="MATHEMATICS" />
                </Field>
                <Field label="Due date">
                  <input className={inputClass} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </Field>
              </div>
            )}

            {kind === "ANNOUNCEMENT" && (
              <Field label="Category" hint="Shown as a coloured tag in the Parent App">
                <select className={inputClass} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
                  {TAGS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            )}

            {isAdmin && (
              <div>
                <p className="mb-2 text-[12.5px] font-bold text-text-secondary">AUDIENCE</p>
                <div className="flex gap-2">
                  {(["WHOLE_SCHOOL", "BY_LEVEL"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAudience(a)}
                      className="rounded-pill px-3.5 py-2 text-[12.5px] font-bold"
                      style={{ background: audience === a ? "#2A2C30" : "#F4F4F2", color: audience === a ? "#FFC629" : "#565A62" }}
                    >
                      {a === "WHOLE_SCHOOL" ? "Whole School" : "My class only"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="rounded-[10px] bg-danger-tint px-3.5 py-2.5 text-[13px] font-medium text-danger">{error}</p>}

            <Button type="submit" disabled={busy} className="self-start">
              {busy ? "Sending…" : "Publish"}
            </Button>

            {!isAdmin && (
              <p className="text-[12.5px] font-semibold text-brand-pending">
                Your posts go to an administrator for approval before parents see them.
              </p>
            )}
          </form>
        </Card>

        <div>
          <p className="mb-3.5 text-[14.5px] font-bold">Recent posts</p>
          {!posts && <Skeleton rows={3} />}
          {posts && posts.length === 0 && <EmptyState icon="📣" title="Nothing posted yet" hint="Your posts appear here." />}
          {posts && posts.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {posts.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    <span className="text-sm font-bold">{p.title}</span>
                    <span className="shrink-0 text-[11.5px] text-text-muted">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="mb-2.5 line-clamp-2 text-[13px] leading-[1.5] text-[#6B6F76]">{p.body}</p>
                  <Badge
                    label={p.status === "APPROVED" ? "Live" : p.status === "PENDING" ? "Awaiting approval" : "Rejected"}
                    tone={p.status === "APPROVED" ? "green" : p.status === "PENDING" ? "amber" : "red"}
                  />
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {toastNode}
    </>
  );
}
