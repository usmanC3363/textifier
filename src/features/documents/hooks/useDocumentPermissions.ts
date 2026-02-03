// hooks/use-document-permissions.ts
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

    const ref = collection(db, 'documents', documentId, 'permissions');

    const q = query(ref, orderBy('grantedAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPermissions(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<DocumentPermission, 'id'>),
          }))
        );
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [documentId]);

  return { permissions, loading, error };
}
