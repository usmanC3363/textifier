import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { emailToKey } from '@/features/documents/services/inviteCollaborator';
import type { DocumentRole } from '@/features/documents/types/document.types';

export function useDocumentAccess(documentId: string | null | undefined) {
  const { user } = useAuth();
  const [role, setRole] = useState<DocumentRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId || typeof documentId !== 'string') {
      console.log('useDocumentAccess: invalid documentId', documentId);
      setRole(null);
      setLoading(false);
      return;
    }

    if (!user || !user.email) {
      console.log('useDocumentAccess: no user or email');
      setRole(null);
      setLoading(false);
      return;
    }

    console.log('useDocumentAccess: checking access for', documentId, user.email);
    setLoading(true);
    setError(null);

    const docRef = doc(db, 'documents', documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.log('useDocumentAccess: document does not exist');
          setRole(null);
          setLoading(false);
          return;
        }

        const data = snapshot.data();
        console.log('useDocumentAccess: document data', data);
        
        if (data.ownerId === user.uid) {
          console.log('useDocumentAccess: user is owner');
          setRole('owner');
          setLoading(false);
          return;
        }
        
        if (data.access && typeof data.access === 'object') {
          const normalizedEmail = user.email!.toLowerCase().trim();
          const emailKey = emailToKey(normalizedEmail);
          const accessRole = data.access[emailKey];
          
          console.log('useDocumentAccess: checking email access', {
            normalizedEmail,
            emailKey,
            accessRole,
            accessKeys: Object.keys(data.access)
          });
          
          if (accessRole) {
            console.log('useDocumentAccess: user has email access', accessRole);
            setRole(accessRole as DocumentRole);
            setLoading(false);
            return;
          }
        }
        
        console.log('useDocumentAccess: user has no access');
        setRole(null);
        setLoading(false);
      },
      (err) => {
        console.error('useDocumentAccess: error', err);
        setError(err);
        setRole(null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [documentId, user?.uid, user?.email]);

  return {
    role,
    loading,
    error,
    canRead: role !== null,
    canEdit: role === 'owner' || role === 'editor',
    canDelete: role === 'owner',
    isOwner: role === 'owner',
  };
}