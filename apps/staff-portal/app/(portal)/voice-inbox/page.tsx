"use client";

import { useEffect, useState } from "react";
import type { ParentVoiceView } from "@kampus/shared-types";
import { api } from "@/lib/api";
import { Button, Card, EmptyState, PageHeader, Skeleton, inputClass, useToast } from "@/components/ui";

const TAGS: Record<string, { label: string; bg: string; color: string }> = {
  SUGGESTION: { label: "Suggestion", bg: "#E7F0F7", color: "#3479B0" },
  COMPLAINT: { label: "Complaint", bg: "#FCEAEA", color: "#C74747" },
  HONOUR_A_TEACHER: { label: "Honour a Teacher", bg: "#FFF3D6", color: "#B07A00" },
  GENERAL: { label: "General", bg: "#F0F0EE", color: "#565A62" },
};

export default function VoiceInboxPage() {
  const [items, setItems] = useState<ParentVoiceView[] | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const { toast, toastNode } = useToast();

  function load() {
    api.staff.voiceInbox().then(setItems).catch(() => setItems([]));
  }
  useEffect(load, []);

  async function toggle(v: ParentVoiceView) {
    await api.staff.respondVoice(v.id, { resolved: !v.resolved });
    load();
  }

  async function sendReply(id: string) {
    if (!reply.trim()) return;
    await api.staff.respondVoice(id, { adminResponse: reply.trim(), resolved: true });
    toast({ kind: "ok", text: "Reply sent to the parent" });
    setReplyTo(null);
    setReply("");
    load();
  }

  const open = items?.filter((i) => !i.resolved).length ?? 0;

  return (
    <>
      <PageHeader title="Parent Voice" subtitle={`Suggestions, complaints and honours${open ? ` · ${open} open` : ""}`} />

      {!items && <Skeleton rows={3} />}
      {items && items.length === 0 && (
        <EmptyState icon="💬" title="No messages yet" hint="Submissions from the Parent App and the website land here." />
      )}

      {items && items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map((v) => {
            const tag = TAGS[v.category] ?? TAGS.GENERAL!;
            return (
              <Card key={v.id} className="p-5" style={{ opacity: v.resolved ? 0.62 : 1 }}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-pill px-2.5 py-1 text-[11px] font-bold" style={{ background: tag.bg, color: tag.color }}>
                      {tag.label}
                    </span>
                    <span className="text-sm font-bold">{v.from}</span>
                    {v.aboutStaffName && <span className="text-[12.5px] text-text-muted">about {v.aboutStaffName}</span>}
                  </span>
                  <span className="text-[11.5px] text-text-muted">{new Date(v.createdAt).toLocaleDateString("en-GB")}</span>
                </div>

                <p className="mb-3 whitespace-pre-wrap text-[13.5px] leading-[1.55] text-[#6B6F76]">{v.message}</p>

                {v.adminResponse && (
                  <p className="mb-3 rounded-[10px] bg-bg px-3.5 py-2.5 text-[13px] leading-relaxed">
                    <strong>Your reply:</strong> {v.adminResponse}
                  </p>
                )}

                {replyTo === v.id ? (
                  <div className="flex flex-col gap-2.5">
                    <textarea
                      className={`${inputClass} h-20 resize-none`}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply — the parent gets a notification"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => sendReply(v.id)}>Send reply</Button>
                      <Button variant="ghost" onClick={() => setReplyTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 text-[12.5px] font-bold">
                    <button onClick={() => setReplyTo(v.id)} className="text-brand-link">
                      Reply
                    </button>
                    <button onClick={() => toggle(v)} className="text-text-muted hover:text-brand-link">
                      {v.resolved ? "Mark as unresolved" : "Mark as resolved"}
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {toastNode}
    </>
  );
}
