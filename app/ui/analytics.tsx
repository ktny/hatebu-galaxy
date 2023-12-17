import Script from "next/script";

export default function Analytics() {
  const GA_MEASUREMENT_ID = "G-NMTLSQVC0B";

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${GA_MEASUREMENT_ID});
        `}
      </Script>
    </>
  );
}
