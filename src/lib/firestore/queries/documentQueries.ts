import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  doc,
  onSnapshot,
  QuerySnapshot,
  type DocumentData,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  Document,
  DocumentWithRole,
  DocumentPermission,
} from '@/features/documents/types/document.types';

/**
 * Convert Firestore document to Document type
 */
function mapDocumentData(doc: DocumentData, id: string): Document {
  const data = doc.data();
  return {
    id,
    title: data.title || '',
    content: data.content || '',
    ownerId: data.ownerId,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    lastEditedBy: data.lastEditedBy || null,
    version: data.version || 1,
    isArchived: data.isArchived || false,
    wordCount: data.wordCount,
    characterCount: data.characterCount,
  };
}

/**
 * Query documents owned by a user
 * Real-time snapshot listener
 */
export function subscribeToOwnedDocuments(
  userId: string,
  callback: (documents: Document[]) => void,
  options?: { includeArchived?: boolean; limitCount?: number }
): () => void {
  let q = query(
    collection(db, 'documents'),
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  if (!options?.includeArchived) {
    q = query(q, where('isArchived', '==', false));
  }

  if (options?.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const documents = snapshot.docs.map((doc) =>
        mapDocumentData(doc, doc.id)
      );
      callback(documents);
    },
    (error) => {
      console.error('Error subscribing to owned documents:', error);
      callback([]);
    }
  );
}

/**
 * Query documents shared with a user via permissions
 * Uses collection group query to find permissions across all documents
 * Real-time snapshot listener
 */
export function subscribeToSharedDocuments(
  userId: string,
  callback: (documents: DocumentWithRole[]) => void,
  options?: { includeArchived?: boolean }
): () => void {
  const permissionsQuery = query(
    collectionGroup(db, 'permissions'),
    where('userId', '==', userId),
    where('isPending', '==', false),
    orderBy('grantedAt', 'desc')
  );

  const documentMap = new Map<string, DocumentWithRole>();
  const documentUnsubscribers = new Map<string, () => void>();

  const updateCallback = () => {
    const docs = Array.from(documentMap.values());
    const filtered = options?.includeArchived
      ? docs
      : docs.filter((doc) => !doc.isArchived);
    callback(filtered);
  };

  // Listen to permissions changes
  const unsubscribePermissions = onSnapshot(
    permissionsQuery,
    (permissionsSnapshot: QuerySnapshot<DocumentData>) => {
      const currentDocIds = new Set<string>();

      permissionsSnapshot.docs.forEach((permDoc) => {
        const permData = permDoc.data();
        const documentId = permDoc.ref.parent.parent?.id;

        if (!documentId) return;

        currentDocIds.add(documentId);

        // If we're not already listening to this document, start listening
        if (!documentUnsubscribers.has(documentId)) {
          const docRef = doc(db, 'documents', documentId);

          const unsubscribeDoc = onSnapshot(
            docRef,
            (docSnapshot) => {
              if (docSnapshot.exists()) {
                const document = mapDocumentData(docSnapshot, documentId);
                documentMap.set(documentId, {
                  ...document,
                  userRole: permData.role,
                  isOwner: false,
                });
                updateCallback();
              } else {
                documentMap.delete(documentId);
                updateCallback();
              }
            },
            (error) => {
              console.error(`Error fetching document ${documentId}:`, error);
              // Remove from map if we can't access it
              documentMap.delete(documentId);
              updateCallback();
            }
          );

          documentUnsubscribers.set(documentId, unsubscribeDoc);
        }
      });

      // Clean up listeners for permissions that were removed
      documentUnsubscribers.forEach((unsubscribe, docId) => {
        if (!currentDocIds.has(docId)) {
          unsubscribe();
          documentUnsubscribers.delete(docId);
          documentMap.delete(docId);
        }
      });

      updateCallback();
    },
    (error) => {
      console.error('Error subscribing to shared documents:', error);
      callback([]);
    }
  );

  // Cleanup function
  return () => {
    unsubscribePermissions();
    documentUnsubscribers.forEach((unsubscribe) => unsubscribe());
    documentUnsubscribers.clear();
  };
}

/**
 * Subscribe to all documents user has access to (owned + shared)
 * Combines owned and shared documents
 * Real-time updates via Firestore snapshots
 */
export function subscribeToUserDocuments(
  userId: string,
  callback: (documents: DocumentWithRole[]) => void,
  options?: { includeArchived?: boolean; limitCount?: number }
): () => void {
  const allDocuments = new Map<string, DocumentWithRole>();
  let unsubscribeOwned: (() => void) | null = null;
  let unsubscribeShared: (() => void) | null = null;

  const updateCallback = () => {
    callback(Array.from(allDocuments.values()));
  };

  // Subscribe to owned documents
  unsubscribeOwned = subscribeToOwnedDocuments(
    userId,
    (ownedDocs) => {
      // Remove old owned documents
      Array.from(allDocuments.keys()).forEach((id) => {
        if (allDocuments.get(id)?.isOwner) {
          allDocuments.delete(id);
        }
      });

      // Add owned documents with owner role
      ownedDocs.forEach((doc) => {
        allDocuments.set(doc.id, {
          ...doc,
          userRole: 'owner',
          isOwner: true,
        });
      });

      updateCallback();
    },
    options
  );

  // Subscribe to shared documents
  unsubscribeShared = subscribeToSharedDocuments(
    userId,
    (sharedDocs) => {
      // Remove old shared documents (but keep owned ones)
      Array.from(allDocuments.keys()).forEach((id) => {
        if (!allDocuments.get(id)?.isOwner) {
          allDocuments.delete(id);
        }
      });

      // Add shared documents
      sharedDocs.forEach((doc) => {
        // Don't overwrite owned documents
        if (!allDocuments.has(doc.id)) {
          allDocuments.set(doc.id, doc);
        }
      });

      updateCallback();
    },
    options
  );

  // Return cleanup function
  return () => {
    if (unsubscribeOwned) unsubscribeOwned();
    if (unsubscribeShared) unsubscribeShared();
  };
}

/**
 * Get a single document by ID
 * Real-time snapshot listener
 */
// ✅ With error handling
export function subscribeToDocument(
  documentId: string,
  onUpdate: (doc: Document | null) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, 'documents', documentId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as Document);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error fetching document:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Get document permissions
 * Real-time snapshot listener
 */
export function subscribeToDocumentPermissions(
  documentId: string,
  callback: (permissions: DocumentPermission[]) => void
): () => void {
  const permissionsRef = collection(db, 'documents', documentId, 'permissions');
  const q = query(permissionsRef, orderBy('grantedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const permissions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || null,
          email: data.email,
          role: data.role,
          grantedBy: data.grantedBy,
          grantedAt: data.grantedAt?.toDate() || new Date(),
          isPending: data.isPending || false,
        } as DocumentPermission;
      });
      callback(permissions);
    },
    (error) => {
      console.error('Error subscribing to document permissions:', error);
      callback([]);
    }
  );
}
