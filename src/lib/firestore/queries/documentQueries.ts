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
import type { Document, DocumentWithRole, DocumentPermission } from '@/features/documents/types/document.types';

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
  // Query permissions where user is shared
  const permissionsQuery = query(
    collectionGroup(db, 'permissions'),
    where('userId', '==', userId),
    where('isPending', '==', false),
    orderBy('grantedAt', 'desc')
  );

  // const documentMap = new Map<string, DocumentWithRole>();
  const permissionMap = new Map<string, DocumentPermission>();

  // Listen to permissions changes
  const unsubscribePermissions = onSnapshot(
    permissionsQuery,
    async (permissionsSnapshot: QuerySnapshot<DocumentData>) => {
      // Update permission map
      permissionMap.clear();
      permissionsSnapshot.docs.forEach((permDoc) => {
        const permData = permDoc.data();
        const documentId = permDoc.ref.parent.parent?.id;
        if (documentId) {
          permissionMap.set(documentId, {
            id: permDoc.id,
            userId: permData.userId || null,
            email: permData.email,
            role: permData.role,
            grantedBy: permData.grantedBy,
            grantedAt: permData.grantedAt?.toDate() || new Date(),
            isPending: permData.isPending || false,
          });
        }
      });

      // Fetch documents for each permission
      const documentIds = Array.from(permissionMap.keys());
      if (documentIds.length === 0) {
        callback([]);
        return;
      }

      // Fetch documents directly by ID
      // Firestore doesn't support IN queries with >10 items easily, so fetch individually
      const documentPromises = documentIds.map(async (docId) => {
        try {
          const docRef = doc(db, 'documents', docId);
          const docSnapshot = await getDoc(docRef);
          
          if (docSnapshot.exists()) {
            const document = mapDocumentData(docSnapshot, docId);
            const permission = permissionMap.get(docId);
            
            if (permission && (!options?.includeArchived || !document.isArchived)) {
              return {
                ...document,
                userRole: permission.role,
                isOwner: false,
              } as DocumentWithRole;
            }
          }
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
        }
        return null;
      });

      const documents = (await Promise.all(documentPromises)).filter(
        (doc): doc is DocumentWithRole => doc !== null
      );

      callback(documents);
    },
    (error) => {
      console.error('Error subscribing to shared documents:', error);
      callback([]);
    }
  );

  return unsubscribePermissions;
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
export function subscribeToDocument(
  documentId: string,
  callback: (document: Document | null) => void
): () => void {
  const docRef = doc(db, 'documents', documentId);

  return onSnapshot(
    docRef,
    (docSnapshot) => {
      if (!docSnapshot.exists()) {
        callback(null);
        return;
      }
      callback(mapDocumentData(docSnapshot, documentId));
    },
    (error) => {
      console.error('Error subscribing to document:', error);
      callback(null);
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
