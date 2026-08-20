"use client";

import { useRouter } from "next/navigation";

export function Card({ className = "", children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`rounded-[14px] bg-white p-4 ${onClick ? "cursor-pointer active:opacity-70" : ""} ${className}`}>
      {children}
    </div>
  );
}

/** Screen header with a back affordance — used on every screen except Home. */
export function ScreenHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex shrink-0 items-center justify-between bg-[#F7F7F5] px-[18px] pb-3 pt-4">
      <button onClick={() => router.back()} className="flex items-center gap-2.5 active:opacity-60">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-base">←</span>
        <span className="font-display text-[18px] font-semibold text-[#22242A]">{title}</span>
      </button>
      {action}
    </div>
  );
}

export function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span className="rounded-pill px-2.5 py-1 text-[11px] font-bold" style={{ background: bg, color }}>
      {label}
    </span>
  );
}

/** Friendly one-line empty state — every list gets one rather than rendering blank. */
export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="text-[15px] font-bold text-text-primary">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-text-muted">{hint}</p>}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5 px-[18px]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-[14px] bg-black/[0.05]" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mb-3 text-3xl">⚠️</div>
      <p className="text-[14px] font-semibold text-text-primary">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-pill bg-dark-pill px-5 py-2.5 text-[13px] font-bold text-brand">
          Try again
        </button>
      )}
    </div>
  );
}

export const STATUS_TINT: Record<string, { bg: string; color: string }> = {
  PRESENT: { bg: "#E9F7EE", color: "#2E8B52" },
  LATE: { bg: "#FFF3D6", color: "#B07A00" },
  ABSENT: { bg: "#FCEAEA", color: "#C74747" },
  PAID: { bg: "#E9F7EE", color: "#2E8B52" },
  PENDING: { bg: "#FFF3D6", color: "#B07A00" },
  OVERDUE: { bg: "#FCEAEA", color: "#C74747" },
  SUBMITTED: { bg: "#E9F7EE", color: "#2E8B52" },
};

export const TAG_TINT: Record<string, { bg: string; color: string }> = {
  PTA: { bg: "#FFF3D6", color: "#B07A00" },
  ACADEMIC: { bg: "#E7F0F7", color: "#3479B0" },
  EVENT: { bg: "#F7EAF0", color: "#B05B84" },
  HEALTH: { bg: "#E9F7EE", color: "#2E8B52" },
  GENERAL: { bg: "#F0F0EE", color: "#565A62" },
};

export function money(n: number): string {
  return `GH₵${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
