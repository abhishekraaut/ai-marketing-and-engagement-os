'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // If on login page, do not render the app shell (sidebar/header)
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const currentOrgName = user?.organizations?.[0]?.name || 'Workspace';
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Brand Profile", href: "/brand" },
    { name: "Campaigns", href: "/campaigns" },
    { name: "Calendar", href: "/calendar" },
    { name: "Inbox", href: "/inbox" },
    { name: "Email", href: "/email" },
    { name: "Trends", href: "/trends" },
    { name: "Analytics", href: "/analytics" },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="font-bold text-lg text-indigo-600">Marketing OS</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <Link
            href="/settings"
            className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/settings' || pathname.startsWith('/settings/')
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
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
              <span className="font-medium text-slate-700">{currentOrgName}</span>
              <span>/</span>
              <span>Marketing</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-slate-500 hover:text-slate-700">🔔</button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm font-medium text-indigo-700 uppercase">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </>
  );
}
