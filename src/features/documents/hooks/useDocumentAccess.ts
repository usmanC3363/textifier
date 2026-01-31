import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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
    let cancelled = false;
  
    async function checkAccess() {
      if (!documentId || !user) return;
  
      setLoading(true);
  
      const snap = await getDoc(doc(db, 'documents', documentId));
      if (!snap.exists() || cancelled) return;
  
      const data = snap.data();
  
      if (data.ownerId === user.uid) {
        setRole('owner');
      } else {
        const emailKey = emailToKey(user.email!.toLowerCase().trim());
        setRole(data.access?.[emailKey] ?? null);
      }
  
      setLoading(false);
    }
  
    checkAccess();
    return () => { cancelled = true };
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