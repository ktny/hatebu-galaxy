import "./globals.css";
import type { Metadata } from "next";
import Header from "./ui/header";
import { Viewport } from "next";
import Footer from "./ui/footer";

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
        <Header></Header>
        <main className="flex flex-1 justify-center mt-4 p-4">{children}</main>
        <Footer></Footer>
      </body>
    </html>
  );
}
