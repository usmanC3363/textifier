'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import * as authService from '@/features/auth/services/authService';
import type {
  AuthContextType,
  AuthUser,
  SignUpCredentials,
  SignInCredentials,
} from '@/features/auth/types/auth.types';

import { mapFirebaseUser } from '@/features/auth/types/auth.types';
import { resolvePendingInvites } from '@/features/auth/hooks/resolve-pending-invites';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Provides authentication context to the entire app
 *
 * Features:
 * - Persistent auth state (survives page refreshes)
 * - Automatic auth state synchronization
 * - Exposes user id, email, displayName
 * - Provides auth methods (signUp, signIn, signInWithGoogle, signOut)
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        try {
          setLoading(true);
          setError(null);

          if (firebaseUser) {
            const mappedUser = mapFirebaseUser(firebaseUser);

            setUser(mappedUser); // set immediately

            if (mappedUser?.email) {
              resolvePendingInvites({
                uid: mappedUser.uid,
                email: mappedUser.email,
              }).catch(console.error); // never block auth
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Auth state error'));
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(
          err instanceof Error ? err : new Error('Auth state listener error')
        );
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    try {
      setError(null);
      setLoading(true);
      await authService.signUp(
        credentials.email,
        credentials.password,
        credentials.displayName
      );
      // Auth state will update automatically via onAuthStateChanged
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (credentials: SignInCredentials) => {
    try {
      setError(null);
      setLoading(true);
      await authService.signIn(credentials.email, credentials.password);
      // Auth state will update automatically via onAuthStateChanged
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await authService.signInWithGoogle();
      // Auth state will update automatically via onAuthStateChanged
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Google sign in failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sign out current user
   * Note: Redirect should be handled by the component calling signOut
   */
  const signOut = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await authService.signOut();
      setUser(null);
      // Note: Redirect should be handled by the calling component
      // Example: router.push('/login') or navigate('/login')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign out failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user display name
   */
  const updateDisplayName = useCallback(async (displayName: string) => {
    try {
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user signed in');
      }
      await authService.updateDisplayName(currentUser, displayName);
      // Update local state
      setUser((prev) => (prev ? { ...prev, displayName } : null));
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Update display name failed');
      setError(error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateDisplayName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook - Access auth context
 *
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
