"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, EmptyState, Modal, PageHeader, Skeleton, inputClass, useToast } from "@/components/ui";

interface Thread {
  id: string;
  parentId: string;
  parentName: string;
  initials: string;
  avatarColor: string;
  preview: string;
  lastAt: string;
  unread: number;
}
interface Conversation {
  id: string;
  parentName: string;
  messages: { id: string; body: string; fromStaff: boolean; createdAt: string }[];
}

/** Two-pane messaging: thread list beside the live conversation. */
export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [active, setActive] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; name: string; children: string }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const { toast, toastNode } = useToast();

  function loadThreads() {
    api.staff
      .threads()
      .then((t) => setThreads(t as Thread[]))
      .catch(() => setThreads([]));
  }
  useEffect(loadThreads, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  async function open(id: string) {
    const conv = await api.staff.thread(id);
    setActive(conv as Conversation);
    loadThreads();
  }

  async function send() {
    if (!draft.trim() || !active) return;
    const body = draft.trim();
    setDraft("");
    try {
      await api.staff.sendMessage({ threadId: active.id, body });
      await open(active.id);
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not send." });
    }
  }

  function openContacts() {
    api.staff.contacts().then(setContacts).catch(() => setContacts([]));
    setStarting(true);
  }

  async function startWith(parentId: string, name: string) {
    try {
      const res = await api.staff.sendMessage({ parentId, body: `Hello ${name.split(" ")[0]}, this is the school.` });
      setStarting(false);
      loadThreads();
      await open(res.threadId);
    } catch (e) {
      toast({ kind: "err", text: e instanceof Error ? e.message : "Could not start the conversation." });
    }
  }

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Conversations with parents"
        action={
          <Button variant="gold" onClick={openContacts}>
            + New message
          </Button>
        }
      />

      {!threads && <Skeleton rows={4} />}
      {threads && threads.length === 0 && (
        <EmptyState
          icon="💬"
          title="No conversations yet"
          hint="Start one with any parent — they'll get a notification in the Parent App."
          action={<Button onClick={openContacts}>+ New message</Button>}
        />
      )}

      {threads && threads.length > 0 && (
        <Card className="grid min-h-[520px] overflow-hidden lg:grid-cols-[340px_1fr]">
          <div className="border-b border-[#F0F0EE] lg:border-b-0 lg:border-r">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => open(t.id)}
                className="flex w-full items-center gap-3 border-b border-[#F0F0EE] px-4 py-3.5 text-left transition-colors last:border-0 hover:bg-bg"
                style={{ background: active?.id === t.id ? "#FAF9F6" : undefined }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ background: t.avatarColor }}
                >
                  {t.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{t.parentName}</span>
                    {t.unread > 0 && (
                      <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10.5px] font-bold text-text-primary">
                        {t.unread}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[12.5px] text-text-muted">{t.preview || "No messages yet"}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col p-5">
            {!active ? (
              <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
                Choose a conversation to read it.
              </div>
            ) : (
              <>
                <p className="mb-4 text-[15px] font-bold">{active.parentName}</p>
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                  {active.messages.map((m) => (
                    <div
                      key={m.id}
                      className="max-w-[75%] rounded-[14px] px-4 py-3 text-[13.5px] leading-relaxed"
                      style={
                        m.fromStaff
                          ? { alignSelf: "flex-end", background: "#FFC629", color: "#2A2C30" }
                          : { alignSelf: "flex-start", background: "#F4F4F2" }
                      }
                    >
                      {m.body}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send();
                  }}
                  className="mt-4 flex gap-2"
                >
                  <input className={inputClass} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a reply…" />
                  <Button type="submit" disabled={!draft.trim()}>
                    Send
                  </Button>
                </form>
              </>
            )}
          </div>
        </Card>
      )}

      {starting && (
        <Modal title="Start a conversation" onClose={() => setStarting(false)}>
          {contacts.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">No parents available yet.</p>
          ) : (
            <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => startWith(c.id, c.name)}
                  className="rounded-[12px] border border-border-alt px-4 py-3 text-left transition-colors hover:border-brand-link"
                >
                  <span className="block text-sm font-bold">{c.name}</span>
                  {c.children && <span className="block text-[12px] text-text-muted">{c.children}</span>}
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {toastNode}
    </>
  );
}
