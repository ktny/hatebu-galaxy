import type { Metadata } from "next";
import { Viewport } from "next";
import "@/app/globals.css";
import Header from "@/app/ui/header";
import Footer from "@/app/ui/footer";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/app/ui/analytics";

export const metadata: Metadata = {
  title: "はてなギャラクシー",
  description: "はてなブックマークで獲得したスターをランキングで閲覧できるサイトです",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex flex-1 justify-center mt-4 p-4">{children}</main>
        <Footer />
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
