import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex h-screen overflow-hidden`}>
        <Providers>
          <LayoutShell>
            {children}
          </LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
