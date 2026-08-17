export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-card-lg border border-border-alt bg-white p-6 ${className}`}>{children}</div>;
}
