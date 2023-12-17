"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const GA_MEASUREMENT_ID = "G-NMTLSQVC0B";

  return (
    <div>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${GA_MEASUREMENT_ID}, {
            page_path: ${pathname},
          });
        `}
      </Script>
    </div>
  );
}
