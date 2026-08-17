"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

interface PostRow {
  id: string;
  title: string;
  body: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function PostPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [kind, setKind] = useState<"HOMEWORK" | "ANNOUNCEMENT">(isAdmin ? "ANNOUNCEMENT" : "HOMEWORK");
  const [justPublished, setJustPublished] = useState(false);
  const [recentPosts, setRecentPosts] = useState<PostRow[]>([]);

  useEffect(() => {
    api.staff.myPosts().then((r) => setRecentPosts(r as PostRow[]));
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    await api.staff.createPost({ kind, title, body, dueDate: dueDate || undefined });
    setTitle("");
    setBody("");
    setDueDate("");
    setJustPublished(true);
    api.staff.myPosts().then((r) => setRecentPosts(r as PostRow[]));
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? "School Announcements" : "Homework & Posts"}
        subtitle={isAdmin ? "Publish to the whole school or specific levels" : "Post homework and class updates for parents"}
      />

      <Card className="mb-6">
        <form onSubmit={publish} className="flex flex-col gap-3">
          {!isAdmin && (
            <select value={kind} onChange={(e) => setKind(e.target.value as "HOMEWORK" | "ANNOUNCEMENT")} className="rounded-chip border border-border-alt px-3 py-2">
              <option value="HOMEWORK">Homework</option>
              <option value="ANNOUNCEMENT">Class update</option>
            </select>
          )}
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded-chip border border-border-alt px-3 py-2"
          />
          <textarea
            placeholder="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            className="rounded-chip border border-border-alt px-3 py-2"
          />
          {kind === "HOMEWORK" && (
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-chip border border-border-alt px-3 py-2" />
          )}
          <button type="submit" className="self-start rounded-pill bg-dark-pill px-6 py-2 text-sm font-semibold text-brand">
            Publish
          </button>
          {justPublished && (
            <p className="rounded-chip bg-tint-gold px-4 py-2 text-sm text-brand-pending">
              {isAdmin ? "Published to the school." : "Sent for admin approval."}
            </p>
          )}
        </form>
      </Card>

      <Card>
        <p className="mb-4 font-semibold">Recent posts</p>
        <ul className="flex flex-col gap-3">
          {recentPosts.map((p) => (
            <li key={p.id} className="rounded-chip border border-border-alt p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{p.title}</p>
                <span
                  className="rounded-pill px-3 py-1 text-xs font-semibold"
                  style={{
                    background: p.status === "APPROVED" ? "#E9F7EE" : p.status === "PENDING" ? "#FFF3D6" : "#FCEAEA",
                    color: p.status === "APPROVED" ? "#2E8B52" : p.status === "PENDING" ? "#B07A00" : "#C74747",
                  }}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">{p.body}</p>
            </li>
          ))}
          {recentPosts.length === 0 && <p className="text-sm text-text-muted">No posts yet.</p>}
        </ul>
      </Card>
    </>
  );
}
