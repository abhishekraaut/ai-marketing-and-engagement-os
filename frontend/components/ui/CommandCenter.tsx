'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, Command, X, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastContext';

export default function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleAiAction = (actionName: string) => {
    setIsOpen(false);
    toast({ title: 'AI Assistant', description: `Executing: ${actionName}...`, type: 'info' });
    // Simulate AI loading/completion
    setTimeout(() => {
      toast({ title: 'AI Analysis Complete', description: 'Results have been summarized in your dashboard.', type: 'success' });
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-0">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-slate-200" role="dialog" aria-modal="true">
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 text-lg bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-900"
            placeholder="Ask Marketing OS or jump to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">
              ESC
            </kbd>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Recent / Navigation Section */}
          <div className="mb-4">
            <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Navigation</h3>
            <div className="space-y-1 mt-1">
              {[
                { name: 'Dashboard Overview', href: '/dashboard' },
                { name: 'Brand Brain Rules', href: '/brand' },
                { name: 'Active Campaigns', href: '/campaigns' },
                { name: 'Content Calendar', href: '/calendar' },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-left"
                >
                  {item.name}
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Actions Section */}
          <div>
            <h3 className="px-3 py-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Actions
            </h3>
            <div className="space-y-1 mt-1">
              {[
                'Analyze campaign performance',
                'Find posts needing approval',
                'Summarize engagement sentiment'
              ].map((action) => (
                <button
                  key={action}
                  onClick={() => handleAiAction(action)}
                  className="w-full flex items-center px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left"
                >
                  <Sparkles className="w-4 h-4 mr-3 opacity-50" />
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
