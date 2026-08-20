import type { Metadata } from "next";
import { getSiteData } from "@/lib/api";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  if (!site) return { title: "School website" };
  return {
    title: site.school.name,
    description: site.content?.heroSubcopy ?? `${site.school.name} — admissions, fees and school life.`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
