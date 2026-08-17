import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aspire Royal Academy",
  description: "A nurturing basic school in Ghana — Crèche through Primary 6.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
