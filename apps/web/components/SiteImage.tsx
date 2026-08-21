"use client";

import { useState } from "react";

/**
 * An image slot on the public site.
 *
 * Images live as ordinary files in `apps/web/public/images/`, referenced by a fixed
 * filename per slot. Drop a correctly-named file in and it appears; leave it out and
 * you get a placeholder that names the exact file it's waiting for. That means the
 * site is never broken by a missing photo, and whoever is gathering the photography
 * can read the requirement straight off the page.
 *
 * A `url` prop (from the portal's Website editor) always wins, so a school can also
 * point at externally-hosted images without touching the repo.
 */
export function SiteImage({
  slot,
  alt,
  url,
  className = "",
  hint,
}: {
  /** Filename inside /public/images, e.g. "hero.jpg" */
  slot: string;
  alt: string;
  /** Overrides the file slot when set — used for content managed in the portal. */
  url?: string | null;
  className?: string;
  /** Extra guidance shown on the placeholder, e.g. recommended dimensions. */
  hint?: string;
}) {
  const src = url || `/images/${slot}`;
  const [failed, setFailed] = useState(false);

  if (failed || (!url && !slot)) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 rounded-[20px] border-2 border-dashed border-border bg-white/60 px-4 py-6 text-center ${className}`}
      >
        <span className="text-lg opacity-40">🖼️</span>
        <span className="font-mono text-[11px] font-semibold text-text-secondary">/images/{slot}</span>
        {hint && <span className="text-[10.5px] leading-tight text-text-muted">{hint}</span>}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className={`object-cover ${className}`} loading="lazy" />
  );
}
