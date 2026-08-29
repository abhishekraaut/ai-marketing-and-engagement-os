'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { cn } from '@/lib/utils';
import CommandCenter from './ui/CommandCenter';
import {
  LayoutDashboard,
  Sparkles,
  Megaphone,
  CalendarDays,
  ChartNoAxesColumn,
  Inbox,
  Mail,
  TrendingUp,
  Settings,
  Bell,
  LogOut,
  WifiOff,
  Search,
  Users,
  UserPlus,
  Menu,
  X
} from 'lucide-react';
import { useToast } from './ui/ToastContext';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isOffline, setIsOffline] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast({ title: 'Back online', description: "You're connected again.", type: 'success' });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // If on login page, do not render the app shell (sidebar/header)
  if (pathname === '/login') {
    return (
      <>
        {isOffline && (
          <div className="bg-amber-500 text-white text-center py-1 text-sm font-medium">
            You&apos;re offline. Please check your connection.
          </div>
        )}
        {children}
      </>
    );
  }

  const currentOrgName = user?.organizations?.[0]?.name || 'Workspace';
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navGroups = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "WORKSPACE",
      items: [
        { name: "Brand Brain", href: "/brand", icon: Sparkles },
        { name: "Campaigns", href: "/campaigns", icon: Megaphone },
        { name: "Calendar", href: "/calendar", icon: CalendarDays },
      ]
    },
    {
      title: "INSIGHTS",
      items: [
        { name: "Analytics", href: "/analytics", icon: ChartNoAxesColumn },
        { name: "Trends", href: "/trends", icon: TrendingUp },
        { name: "Web Traffic", href: "/traffic", icon: TrendingUp },
      ]
    },
    {
      title: "ENGAGEMENT",
      items: [
        { name: "Inbox", href: "/inbox", icon: Inbox },
        { name: "Email", href: "/email", icon: Mail },
        { name: "Audiences", href: "/audiences", icon: Users },
        { name: "Leads", href: "/leads", icon: UserPlus },
      ]
    }
  ];

  return (
    <>
      <CommandCenter />
      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-1 text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          You&apos;re offline. Changes will resume when your connection returns.
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col text-slate-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Marketing OS</span>
          </div>
        </div>

        <div className="p-4 shrink-0">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-400 bg-slate-800/50 hover:bg-slate-800 rounded-md border border-slate-700/50 transition-colors"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          >
            <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Search...</span>
            <kbd className="text-xs font-sans bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto scrollbar-hide">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                        isActive
                          ? "bg-indigo-600/10 text-indigo-400"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      )}
                    >
                      <item.icon className={cn(
                        "mr-3 h-5 w-5 shrink-0 transition-colors",
                        isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                      )} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <Link
            href="/settings"
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
              pathname.startsWith('/settings') ? "bg-indigo-600/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <Settings className={cn("mr-3 h-5 w-5 shrink-0", pathname.startsWith('/settings') ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
            System Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="mr-3 h-5 w-5 shrink-0 text-slate-500 group-hover:text-red-400 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col text-slate-300 shadow-2xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">Marketing OS</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto scrollbar-hide">
            {navGroups.map((group) => (
              <div key={group.title}>
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                          isActive
                            ? "bg-indigo-600/10 text-indigo-400"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        <item.icon className={cn(
                          "mr-3 h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                        )} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden text-slate-500 hover:text-indigo-600 transition-colors p-1"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="md:hidden font-bold text-lg text-indigo-600">Marketing OS</div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500">
              <span className="font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{currentOrgName}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors relative" aria-label="Notifications" title="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-700 uppercase cursor-default" title={user?.name || 'User'}>
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}


