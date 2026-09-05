"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuthGuard(redirectTo: string = '/login') {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);

      // If no user and not loading, redirect to login
      if (!session?.user) {
        router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (!session?.user && event !== 'INITIAL_SESSION') {
          router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [redirectTo, router]);

  return { user, loading };
}

export function withAuth<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  redirectTo: string = '/login'
) {
  return function AuthGuardedComponent(props: T) {
    const { user, loading } = useAuthGuard(redirectTo);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
        </div>
      );
    }

    if (!user) {
      return null; // Redirecting in useAuthGuard
    }

    return <WrappedComponent {...props} />;
  };
}