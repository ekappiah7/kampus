import { Fredoka, Manrope } from "next/font/google";

/**
 * Fonts are self-hosted at build time rather than fetched from Google at runtime.
 * That removes an external round trip on every page load — worth doing anywhere,
 * and worth doing twice over on the intermittent mobile data most of our parents
 * are on. It also means the design still renders correctly if Google Fonts is
 * unreachable.
 */
export const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const fontVariables = `${fredoka.variable} ${manrope.variable}`;
