'use client';

import React, { useState } from 'react';
import { authApi } from '@/lib/api/client';
import { useAuth } from '@/components/AuthContext';
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!navigator.onLine) {
      toast({ title: 'Offline', description: 'Please check your internet connection.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', email); // OAuth2 expects 'username' field
      formData.append('password', password);

      const response = await authApi.login(formData);
      const token = response.access_token;

      localStorage.setItem('token', token);
      const userData = await authApi.getMe();
      login(token, userData);

      toast({ title: 'Welcome back', description: 'You have successfully signed in.', type: 'success' });
    } catch (err: unknown) {
      if (((err as Error).message || "Error")?.includes('401') || ((err as Error).message || "Error")?.toLowerCase().includes('credentials')) {
        toast({ title: 'Invalid credentials', description: 'The email or password you entered is incorrect.', type: 'error' });
      } else {
        toast({ title: 'Login failed', description: ((err as Error).message || "Error") || 'An unexpected error occurred.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full flex-1 bg-slate-900 relative items-center justify-center p-4">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/50 via-slate-900 to-slate-900 mix-blend-multiply" />
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      </div>

      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 sm:p-10 z-10 relative">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Marketing OS
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Enter your credentials to access your workspace.
            </p>
          </div>
        </div>

        <div>
          <form className="space-y-6" onSubmit={handleSubmit}>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2.5 border border-slate-700 bg-slate-800/50 rounded-lg shadow-sm placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="e.g., abhishek@aiagency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none block w-full px-3 py-2.5 border border-slate-700 bg-slate-800/50 rounded-lg shadow-sm placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Demo Credentials</h3>
            <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 space-y-3">
              {[
                { role: 'Admin', email: 'abhishek@aiagency.com' },
                // { role: 'Editor', email: 'marketing@aiagency.com' },
                // { role: 'Viewer', email: 'content@aiagency.com' },
              ].map((account) => (
                <div key={account.role} className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">{account.role}</span>
                  <span className="text-slate-400 font-mono text-xs">{account.email} / password123</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


