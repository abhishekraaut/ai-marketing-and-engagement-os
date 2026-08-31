import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/providers";
import LayoutShell from "@/components/LayoutShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Marketing & Engagement OS",
  description: "An AI-powered Marketing Automation and Engagement Operating System. Manage campaigns, content, and analytics effortlessly.",
  keywords: ["AI", "Marketing", "Automation", "Social Media", "Engagement"],
  openGraph: {
    title: "AI Marketing & Engagement OS",
    description: "An AI-powered Marketing Automation and Engagement Operating System.",
    type: "website",
    siteName: "AI Marketing OS",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Marketing & Engagement OS",
    description: "An AI-powered Marketing Automation and Engagement Operating System.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>

        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
          `}
        </Script>

        {/* Umami */}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script src={process.env.NEXT_PUBLIC_UMAMI_URL} data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID} strategy="afterInteractive" />
        )}

        {/* Matomo On-Premise */}
        <Script id="matomo-tracking" strategy="afterInteractive">
          {`
            var _paq = window._paq = window._paq || [];
            /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="${process.env.NEXT_PUBLIC_MATOMO_URL || 'http://localhost:8080/'}";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '${process.env.NEXT_PUBLIC_MATOMO_SITE_ID || '1'}']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
            })();
          `}
        </Script>
      </head>

      <body className={`${inter.className} bg-muted text-foreground flex h-screen overflow-hidden`}>
        <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || '1234567890'}');
            fbq('track', 'PageView');
          `}} />

        <Providers>
          <LayoutShell>
            {children}
          </LayoutShell>
        </Providers>
      </body>

    </html>
  );
}
