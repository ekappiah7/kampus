"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import type { ParentVoiceView } from "@kampus/shared-types";

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  SUGGESTION: { bg: "#E7F0F7", color: "#3479B0" },
  COMPLAINT: { bg: "#FCEAEA", color: "#C74747" },
  HONOUR_A_TEACHER: { bg: "#FFF3D6", color: "#B07A00" },
  GENERAL: { bg: "#F7EAF0", color: "#B05B84" },
};

export default function VoiceInboxPage() {
  const [items, setItems] = useState<ParentVoiceView[]>([]);

  function refresh() {
    api.voice.inbox().then(setItems);
  }
  useEffect(refresh, []);

  async function toggle(item: ParentVoiceView) {
    await api.voice.respond(item.id, { resolved: !item.resolved });
    refresh();
  }

  return (
    <>
      <PageHeader title="Parent Voice" subtitle="Suggestions, complaints and honours from parents" />
      <div className="flex flex-col gap-4">
        {items.map((v) => {
          const tag = TAG_STYLE[v.category] ?? TAG_STYLE.GENERAL!;
          return (
            <Card key={v.id} className={v.resolved ? "opacity-55" : ""}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-pill px-3 py-1 text-xs font-semibold" style={{ background: tag.bg, color: tag.color }}>
                    {v.category.replace(/_/g, " ")}
                  </span>
                  <p className="mt-2 text-sm">{v.message}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    {v.from} · {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => toggle(v)} className="shrink-0 whitespace-nowrap text-xs font-semibold text-brand-link">
                  {v.resolved ? "Mark as unresolved" : "Mark as resolved"}
                </button>
              </div>
            </Card>
          );
        })}
        {items.length === 0 && <Card className="text-center text-text-muted">No submissions yet.</Card>}
      </div>
    </>
  );
}
