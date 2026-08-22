/**
 * The Kampus mark.
 *
 * A K whose lower arm sweeps out past the stem, so the letter carries the shape of
 * a tick. That is not decoration — the product's argument to a school owner is that
 * every cedi and every mark can be accounted for, and a mark that reads as "checks
 * out" says that before a word of copy does. The letter lands first and the tick
 * second, which is the right order while nobody knows the name yet.
 *
 * The arms are detached from the stem. Counter-intuitively that helps at small
 * sizes: a joined K fills its junction with ink and blurs into a blob by 16px,
 * whereas a visible gap keeps three distinct strokes the eye can still resolve.
 *
 * Constraints it was drawn against, in order of how often they bite:
 *
 * 1. **16px.** A browser tab is where this is seen most. One silhouette, one
 *    colour, one ground — nothing that needs a second glance.
 * 2. **Black on a photocopied letterhead.** Ghanaian schools print. No gradient,
 *    no shadow, correct in a single ink.
 * 3. **Sitting beside a school's own crest.** Crests here are ornate; the
 *    software's mark should be flat and quiet, or it competes with the client's
 *    identity on the client's own screen.
 */

interface MarkProps {
  size?: number;
  /** The badge behind the glyph. `null` draws the glyph alone, for tight spaces. */
  background?: string | null;
  foreground?: string;
  className?: string;
  /** Squircle radius. 0 gives a hard square, for maskable PWA icons. */
  radius?: number;
  title?: string;
}

/** The glyph, in a 48×48 box. Kept separate so icon generation can reuse it. */
export const GLYPH_PATHS = [
  // Stem.
  { tag: "rect", attrs: { x: "12.5", y: "9", width: "5.4", height: "30", rx: "2.4" } },
  // Upper arm, rising away from the stem.
  {
    tag: "path",
    attrs: {
      d: "M21.4 25.9a1.9 1.9 0 0 1 0-3.8h1.5a1.9 1.9 0 0 0 1.42-.64l8.2-9.3a2 2 0 0 1 1.5-.67h3.1a1.6 1.6 0 0 1 1.2 2.65L26.6 27.4a1.9 1.9 0 0 1-1.43.65Z",
    },
  },
  // Lower arm, sweeping down and out — the tick.
  {
    tag: "path",
    attrs: {
      d: "M23.1 22.1a1.9 1.9 0 0 0-1.43 3.15L32.3 37.3a2 2 0 0 0 1.5.68H37a1.5 1.5 0 0 0 1.15-2.47L26.05 22.77a1.9 1.9 0 0 0-1.45-.67Z",
    },
  },
] as const;

export function KampusMark({
  size = 40,
  background = "#FFC629",
  foreground = "#2A2C30",
  className = "",
  radius = 12.5,
  title = "Kampus",
}: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {background && <rect width="48" height="48" rx={radius} fill={background} />}
      <g fill={foreground}>
        <rect x="12.5" y="9" width="5.4" height="30" rx="2.4" />
        <path d="M21.4 25.9a1.9 1.9 0 0 1 0-3.8h1.5a1.9 1.9 0 0 0 1.42-.64l8.2-9.3a2 2 0 0 1 1.5-.67h3.1a1.6 1.6 0 0 1 1.2 2.65L26.6 27.4a1.9 1.9 0 0 1-1.43.65Z" />
        <path d="M23.1 22.1a1.9 1.9 0 0 0-1.43 3.15L32.3 37.3a2 2 0 0 0 1.5.68H37a1.5 1.5 0 0 0 1.15-2.47L26.05 22.77a1.9 1.9 0 0 0-1.45-.67Z" />
      </g>
    </svg>
  );
}

/** Mark plus name — the lockup for navigation bars and the footer. */
export function KampusLogo({
  size = 40,
  light = false,
  className = "",
}: {
  size?: number;
  light?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <KampusMark size={size} />
      <span
        className="font-display font-bold leading-none"
        style={{ fontSize: size * 0.48, color: light ? "#FFFFFF" : "#2A2C30" }}
      >
        Kampus
      </span>
    </span>
  );
}
