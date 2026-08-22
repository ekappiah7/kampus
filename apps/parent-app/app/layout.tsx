import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/lib/session";
import { PwaRegistrar } from "@/components/PwaRegistrar";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parent App",
  description: "Attendance, grades, homework, fees and pickup for your child.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Parent App" },
};

export const viewport: Viewport = {
  themeColor: "#FFC629",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <SessionProvider>
          {/* Phone-width column so the app reads the same on a tablet or desktop demo. */}
          <div className="mx-auto min-h-screen w-full max-w-[480px] bg-[#F7F7F5] shadow-[0_0_60px_rgba(0,0,0,0.06)]">
            {children}
          </div>
          <PwaRegistrar />
        </SessionProvider>
      </body>
    </html>
  );
}
