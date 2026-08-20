import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/lib/session";
import { PwaRegistrar } from "@/components/PwaRegistrar";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Staff Portal",
  description: "Attendance, grades, fees and school administration.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Staff Portal" },
};

export const viewport: Viewport = {
  themeColor: "#2A2C30",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <SessionProvider>{children}</SessionProvider>
        <PwaRegistrar />
      </body>
    </html>
  );
}
