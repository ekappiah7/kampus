import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kampus — school management for Ghanaian basic schools",
  description:
    "Fees, marks, attendance, report cards, parent messaging and your public school website in one system. Built for Crèche-to-JHS schools in Ghana.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/kampus-mark.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Kampus — run the whole school from one place",
    description:
      "Fees, marks, attendance, GES report cards, a parent app that needs no app store, and your public school website. Built for Ghanaian basic schools.",
    type: "website",
    images: [{ url: "/og.png", width: 512, height: 512, alt: "Kampus" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
