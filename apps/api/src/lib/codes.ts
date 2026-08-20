import { customAlphabet } from "nanoid";

// Unambiguous alphabet: no 0/O, 1/I/L — these get read aloud and typed by hand.
const UNAMBIGUOUS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const raw6 = customAlphabet(UNAMBIGUOUS, 6);
const raw4 = customAlphabet(UNAMBIGUOUS, 4);

/** Access code issued to a new staff member or parent, e.g. "K7M-2QPX". */
export function accessCode(): string {
  return `${raw4()}-${raw4()}`;
}

/** One-time pickup code shown in the parent app and typed at the gate. */
export function pickupCode(): string {
  return `PK-${raw6()}`;
}

/** Reference a parent quotes when paying fees in cash at the office. */
export function cashReference(admissionNo: string | null | undefined): string {
  const suffix = raw4();
  return admissionNo ? `${admissionNo}-${suffix}` : `CASH-${suffix}`;
}

/** Initials for avatar chips — strips common Ghanaian/English honorifics first. */
export function initialsOf(name: string): string {
  return name
    .replace(/^(Mrs|Mr|Ms|Miss|Dr|Prof)\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]!)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_TINTS = ["#FFD9E8", "#D6E8FF", "#FFF0BF", "#EAF3EA", "#F7EAF0", "#E7F0F7", "#FFE08A", "#E9F7EE"];

/** Deterministic avatar tint so a person keeps the same colour across sessions. */
export function avatarTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length]!;
}
