'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api/client';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string;
  organizations: any[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  currentOrgId: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const initialized = React.useRef(false);

  useEffect(() => {
    if (initialized.current) {
      const token = localStorage.getItem('token');
      if (!token && pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
        return;
      }
      
      initialized.current = true;
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Failed to authenticate', error);
        localStorage.removeItem('token');
        initialized.current = false;
        if (pathname !== '/login') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [pathname, router]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
    initialized.current = true;
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    initialized.current = false;
    router.push('/login');
  };

  // Derive current org id from first membership for simplicity in this prototype
  const currentOrgId = user?.organizations?.[0]?.id || null;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, currentOrgId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
