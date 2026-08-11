import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Marketing OS",
  description: "Phase 3 - Brand Brain & Core API",
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
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-slate-200">
              <span className="font-bold text-lg text-indigo-600">Marketing OS</span>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "Brand Profile", href: "/brand" },
                { name: "Campaigns", href: "/campaigns" },
                { name: "Content", href: "/content" },
                { name: "Calendar", href: "/calendar" },
                { name: "Inbox", href: "/inbox" },
                { name: "Email", href: "/email" },
                { name: "Trends", href: "/trends" },
                { name: "Analytics", href: "/analytics" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <Link
                href="/settings"
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Settings
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center space-x-4">
                <div className="md:hidden font-bold text-lg text-indigo-600">Marketing OS</div>
                <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">AI SaaS Inc.</span>
                  <span>/</span>
                  <span>Workspace</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-slate-500 hover:text-slate-700">🔔</button>
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm font-medium text-indigo-700">
                  U
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
