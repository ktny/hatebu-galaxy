import type { Metadata } from "next";
import { Viewport } from "next";
import "@/app/globals.css";
import Header from "@/app/ui/header";
import Footer from "@/app/ui/footer";
import GoogleAnalytics from "@/app/ui/analytics";

const siteName = "はてな★ギャラクシー";
const description = "はてなブックマークについたスターを眺められるサイト";
const url = "https://hatebu-galaxy.vercel.app";

export const metadata: Metadata = {
  title: siteName,
  description,
  icons:
    "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%2210 0 100 100%22><text y=%22.90em%22 font-size=%2290%22>⭐</text></svg>",
  openGraph: {
    title: siteName,
    description,
    url,
    siteName,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    site: "@1ststar_hateno",
    creator: "@kattsu_3",
  },
  // alternates: {
  //   canonical: url,
  // },
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
        <GoogleAnalytics />
      </body>
    </html>
  );
}
