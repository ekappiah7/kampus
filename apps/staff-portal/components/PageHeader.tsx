export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
