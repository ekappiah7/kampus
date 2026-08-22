import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

// Absolute, because a link shared into WhatsApp or Facebook has to resolve the OG
// image itself — there is no browser tab to inherit a relative path from. This is
// the live Firebase URL rather than a future custom domain; it needs updating the
// day a real domain is attached, or shared links keep pointing at the old one.
const SITE_URL = "https://akampuz-kampus.web.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kampus — school management for Ghanaian basic schools",
  description:
    "One full term, free. Fees, marks, attendance, report cards, parent messaging and your public school website in one system. Built for Crèche-to-JHS schools in Ghana.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/kampus-mark.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Kampus — one full term, free",
    description:
      "Run it beside what you use now. Fees, marks, attendance, GES report cards, a parent app that needs no app store, and your public school website.",
    type: "website",
    url: SITE_URL,
    siteName: "Kampus",
    images: [{ url: "/og-share.png", width: 1200, height: 630, alt: "Kampus — one full term, free" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kampus — one full term, free",
    description: "Run it beside what you use now. No card, no commitment.",
    images: ["/og-share.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
