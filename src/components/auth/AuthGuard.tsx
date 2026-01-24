'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  onRedirect?: (path: string) => void;
}

/**
 * AuthGuard - Protects routes by redirecting unauthenticated users
 *
 * Usage with Next.js:
 * <AuthGuard onRedirect={(path) => router.push(path)}>
 *   <ProtectedPage />
 * </AuthGuard>
 *
 * Usage with React Router:
 * <AuthGuard onRedirect={(path) => navigate(path)}>
 *   <ProtectedPage />
 * </AuthGuard>
 *
 * Or use default redirect (requires router setup):
 * <AuthGuard>
 *   <ProtectedPage />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  redirectTo = '/login',
  onRedirect,
}: AuthGuardProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      if (onRedirect) {
        onRedirect(redirectTo);
      } else {
        // Fallback: use window.location if no redirect handler provided
        window.location.href = redirectTo;
      }
    }
  }, [user, loading, redirectTo, onRedirect]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
