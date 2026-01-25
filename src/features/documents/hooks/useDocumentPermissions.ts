import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { DocumentPermission } from '@/features/documents/types/document.types';

export function useDocumentPermissions(documentId: string | null) {
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [loading, setLoading] = useState<boolean>(!!documentId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) return;

    setLoading(true);
    setError(null);

    const permissionsRef = collection(
      db,
      'documents',
      documentId,
      'permissions'
    );

    const q = query(permissionsRef, orderBy('grantedAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const perms: DocumentPermission[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<DocumentPermission, 'id'>),
        }));

        setPermissions(perms);
        setLoading(false);
      },
      (err) => {
        console.error('Permissions subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [documentId]);

  // 👇 derive instead of mutating inside effect
  if (!documentId) {
    return {
      permissions: [],
      loading: false,
      error: null,
    };
  }

  return { permissions, loading, error };
}
