import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface GuestGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export function GuestGuard({
  children,
  redirectTo = '/dashboard',
}: GuestGuardProps) {
  const { user, loading } = useAuth();

  // Wait for auth to resolve
  if (loading) return null; // or spinner

  // If logged in → get out
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
