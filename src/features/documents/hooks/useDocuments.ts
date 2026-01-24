import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  subscribeToUserDocuments,
  subscribeToDocument,
} from '@/lib/firestore/queries/documentQueries';
import * as documentMutations from '@/lib/firestore/mutations/documentMutations';
import type {
  Document,
  DocumentWithRole,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentFilter,
} from '@/features/documents/types/document.types.ts';

/**
 * Hook to get all documents user has access to (owned + shared)
 * Provides real-time updates via Firestore snapshots
 */
export function useDocuments(filter?: DocumentFilter) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentWithRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to user documents with real-time updates
    const unsubscribe = subscribeToUserDocuments(
      user.uid,
      (docs) => {
        let filteredDocs = docs;

        // Apply filters
        if (filter?.isArchived !== undefined) {
          filteredDocs = filteredDocs.filter(
            (doc) => doc.isArchived === filter.isArchived
          );
        }

        if (filter?.role) {
          filteredDocs = filteredDocs.filter(
            (doc) => doc.userRole === filter.role
          );
        }

        if (filter?.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filteredDocs = filteredDocs.filter((doc) =>
            doc.title.toLowerCase().includes(query)
          );
        }

        setDocuments(filteredDocs);
        setLoading(false);
      },
      {
        includeArchived: filter?.isArchived === true,
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user, filter?.isArchived, filter?.role, filter?.searchQuery]);

  return { documents, loading, error };
}

/**
 * Hook to get a single document by ID
 * Provides real-time updates
 */
export function useDocument(documentId: string | null) {
  const { user } = useAuth(); // ✅ Add this
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(!!documentId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId || !user) {
      // ✅ Check user
      setDocument(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToDocument(
      documentId,
      (doc) => {
        setDocument(doc);
        setLoading(false);
      },
      (err) => {
        // ✅ Add error callback
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [documentId, user]); // ✅ Add user to dependencies

  if (!documentId || !user) {
    return { document: null, loading: false, error: null };
  }

  return { document, loading, error };
}

/**
 * Hook for document mutations (create, update, delete)
 */
export function useDocumentMutations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const createDocument = useCallback(
    async (input: CreateDocumentInput): Promise<string | null> => {
      if (!user) {
        throw new Error('User must be authenticated to create documents');
      }

      try {
        setLoading(true);
        setError(null);
        const documentId = await documentMutations.createDocument(
          user.uid,
          input
        );
        return documentId;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to create document');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateDocument = useCallback(
    async (documentId: string, input: UpdateDocumentInput): Promise<void> => {
      if (!user) {
        throw new Error('User must be authenticated to update documents');
      }

      try {
        setLoading(true);
        setError(null);
        await documentMutations.updateDocument(documentId, user.uid, input);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to update document');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const deleteDocument = useCallback(
    async (documentId: string): Promise<void> => {
      if (!user) {
        throw new Error('User must be authenticated to delete documents');
      }

      try {
        setLoading(true);
        setError(null);
        await documentMutations.deleteDocument(documentId);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to delete document');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const archiveDocument = useCallback(
    async (documentId: string, isArchived: boolean): Promise<void> => {
      if (!user) {
        throw new Error('User must be authenticated to archive documents');
      }

      try {
        setLoading(true);
        setError(null);
        await documentMutations.archiveDocument(
          documentId,
          user.uid,
          isArchived
        );
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to archive document');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    archiveDocument,
    loading,
    error,
  };
}
