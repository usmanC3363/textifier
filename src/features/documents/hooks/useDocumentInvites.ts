import { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { inviteCollaboratorByEmail } from '@/lib/firestore/mutations/documentMutations';

export function useDocumentInvites() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const invite = useCallback(
    async (documentId: string, email: string, role: 'editor' | 'viewer') => {
      if (!user) {
        throw new Error('Authentication required');
      }

      if (!documentId) {
        throw new Error('Document ID is required');
      }

      try {
        setLoading(true);
        setError(null);

        await inviteCollaboratorByEmail(documentId, email, role, user.uid);
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Failed to invite collaborator');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    invite,
    loading,
    error,
  };
}
