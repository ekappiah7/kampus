/**
 * Shared design tokens, extracted from the Aspire Royal Academy design handoff
 * (design_handoff_school_platform/README.md). These are the system-wide neutrals;
 * `brand` is the default reference-client brand and MUST be overridden per school
 * (School.primaryColor etc.) in multi-tenant production — never hardcode `brand`
 * into a component, always resolve it from the current tenant.
 */

export const color = {
  bg: "#FAF9F6",
  surface: "#FFFFFF",
  textPrimary: "#2A2C30",
  textPrimaryAlt: "#22242A",
  textSecondary: "#565A62",
  textSecondaryAlt: "#52565C",
  textMuted: "#8A8F97",
  border: "#E5E2DA",
  borderAlt: "#EEEBE3",
  borderSoft: "#F0F0EE",

  success: "#3E9E63",
  successTint: "#E9F7EE",
  danger: "#C74747",
  dangerTint: "#FCEAEA",

  tint: {
    gold: "#FFF0BF",
    goldAlt: "#FFF3D6",
    blue: "#E7F0F7",
    pink: "#F7EAF0",
    green: "#E9F7EE",
  },

  darkPill: "#2A2C30",
  darkPillActive: "#3A3C42",
} as const;

/** Default brand for the reference client, Aspire Royal Academy. Override per-tenant. */
export const brand = {
  primary: "#FFC629",
  link: "#C98A00",
  linkHover: "#E3A400",
  pendingLabel: "#B07A00",
} as const;

export const typography = {
  display: "'Fredoka', sans-serif",
  body: "'Manrope', system-ui, sans-serif",
  weight: { semibold: 600, bold: 700 },
  scale: {
    heroH1: 56,
    statNumber: 28,
    sectionTitle: 20,
    navTitle: 19,
    body: 18,
    label: 15.5,
    labelSmall: 14,
    caption: 13.5,
    captionSmall: 12,
  },
  lineHeight: { tight: 1.08, body: 1.6 },
} as const;

export const radius = {
  pill: 100,
  cardLg: 18,
  card: 14,
  chip: 10,
  chipSmall: 8,
} as const;

export const shadow = {
  card: "0 10px 30px rgba(0,0,0,0.1)",
  dropdown: "0 12px 30px rgba(0,0,0,0.15)",
} as const;

export const spacing = {
  sectionPaddingMin: 48,
  sectionPaddingMax: 90,
} as const;

/** Quick-link tile tints used by the Parent App home + more grid. */
export const quickLinkTint = [color.tint.gold, color.tint.blue, color.tint.pink, color.tint.green] as const;

export const tokens = { color, brand, typography, radius, shadow, spacing } as const;

export type Tokens = typeof tokens;
