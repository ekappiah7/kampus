"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

interface Thread {
  id: string;
  parent: string;
  preview: string;
  time: string | null;
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    api.staff.messageThreads().then((r) => setThreads(r as Thread[]));
  }, []);

  return (
    <>
      <PageHeader title="Messages" subtitle="Conversations with parents" />
      <Card className="p-0">
        <ul className="divide-y divide-border-alt">
          {threads.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-semibold">{t.parent}</p>
                <p className="text-sm text-text-muted">{t.preview}</p>
              </div>
              {t.time && <span className="text-xs text-text-muted">{new Date(t.time).toLocaleTimeString()}</span>}
            </li>
          ))}
          {threads.length === 0 && <li className="px-6 py-10 text-center text-sm text-text-muted">No conversations yet.</li>}
        </ul>
      </Card>
    </>
  );
}
