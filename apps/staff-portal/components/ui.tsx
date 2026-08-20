"use client";

import { useEffect, useState } from "react";

export function Card({
  className = "",
  children,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`rounded-[16px] bg-white ${className}`} style={style}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[26px] font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "gold" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-dark-pill text-brand hover:opacity-90",
    gold: "bg-brand text-text-primary hover:opacity-90",
    ghost: "bg-[#F4F4F2] text-text-secondary hover:bg-[#EDEDEA]",
    danger: "bg-danger-tint text-danger hover:opacity-80",
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-[10px] px-[18px] py-[11px] text-[13.5px] font-bold transition-opacity disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

export const inputClass =
  "w-full rounded-[10px] border-[1.5px] border-border-alt px-3.5 py-3 text-sm outline-none transition-colors focus:border-brand-link";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-bold text-text-secondary">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-text-muted">{hint}</span>}
    </label>
  );
}

export function Badge({ label, tone }: { label: string; tone: "green" | "amber" | "red" | "blue" | "grey" }) {
  const tones = {
    green: { bg: "#E9F7EE", color: "#2E8B52" },
    amber: { bg: "#FFF3D6", color: "#B07A00" },
    red: { bg: "#FCEAEA", color: "#C74747" },
    blue: { bg: "#E7F0F7", color: "#3479B0" },
    grey: { bg: "#F0F0EE", color: "#565A62" },
  }[tone];
  return (
    <span className="inline-block rounded-pill px-2.5 py-1 text-[11.5px] font-bold" style={{ background: tones.bg, color: tones.color }}>
      {label}
    </span>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <Card className="px-8 py-14 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="text-[15px] font-bold">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-text-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-[10px] bg-black/[0.05]" />
        ))}
      </div>
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="px-8 py-12 text-center">
      <div className="mb-3 text-3xl">⚠️</div>
      <p className="text-sm font-semibold">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button onClick={onRetry}>Try again</Button>
        </div>
      )}
    </Card>
  );
}

/** Modal used for every create/edit form in the portal. */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10" onClick={onClose}>
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} animate-fade rounded-[18px] bg-white p-6 shadow-dropdown`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-[19px] font-semibold">{title}</h2>
          <button onClick={onClose} className="text-lg text-text-muted hover:text-text-primary" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Shows a freshly issued access code once, with copy-to-clipboard.
 * Codes are single-use and never retrievable later, so this is deliberately
 * prominent — the admin has to hand it over now.
 */
export function AccessCodeCard({ name, code, audience }: { name: string; code: string; audience: "staff" | "parent" }) {
  const [copied, setCopied] = useState(false);
  const target = audience === "parent" ? "the Parent App" : "the Staff Portal";

  return (
    <div className="rounded-[14px] border-[1.5px] border-brand bg-[#FFF7DF] p-5 text-center">
      <p className="text-[13px] font-semibold text-[#8A6200]">Access code for {name}</p>
      <p className="my-3 font-mono text-[26px] font-bold tracking-[0.12em] text-text-primary">{code}</p>
      <p className="mb-4 text-[12.5px] leading-relaxed text-[#6B6F76]">
        Give this to {name.split(" ")[0]}. They open {target}, choose &ldquo;Use your access code&rdquo;, and set their own
        password. It works once.
      </p>
      <Button
        variant="gold"
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? "Copied ✓" : "Copy code"}
      </Button>
    </div>
  );
}

export function money(n: number): string {
  return `GH₵${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/** Small inline toast for save confirmations. */
export function useToast() {
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const node = toast ? (
    <div
      className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-fade rounded-[12px] px-5 py-3 text-sm font-bold shadow-dropdown"
      style={
        toast.kind === "ok" ? { background: "#2A2C30", color: "#FFC629" } : { background: "#FCEAEA", color: "#C74747" }
      }
    >
      {toast.text}
    </div>
  ) : null;

  return { toast: setToast, toastNode: node };
}
