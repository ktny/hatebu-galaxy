"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { GA_MEASUREMENT_ID } from "@/app/config";

export default function GoogleAnalytics() {
  const pathname = usePathname();

  return (
    <div>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', "${GA_MEASUREMENT_ID}", {
            page_path: "${pathname}",
          });
        `,
        }}
      ></Script>
    </div>
  );
}
