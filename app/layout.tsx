import "./globals.css";
import type { Metadata } from "next";
import Header from "./ui/header";
import { Providers } from "./providers";
import { Viewport } from "next";

export const metadata: Metadata = {
  title: "はてなギャラクシー",
  description: "はてなブックマークで獲得したスターをランキングで閲覧できるサイトです",
};

export const viewport: Viewport = {
  // themeColor: 'black',
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      {/* dark:bg-black dark:text-white */}
      <body>
        <Providers>
          <Header></Header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
