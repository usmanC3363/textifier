import {
  collection,
  query,
  where,
  orderBy,
  limit,
  doc,
  onSnapshot,
  QuerySnapshot,
  type DocumentData,
  collectionGroup,
  type Unsubscribe,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  Document,
  DocumentWithRole,
  DocumentPermission,
  DocumentRole,
} from '@/features/documents/types/document.types';
import { emailToKey } from '@/features/documents/services/inviteCollaborator';

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



interface SubscribeOptions {
  includeArchived?: boolean;
}

/**
 * Subscribe to all documents user has access to
 * This includes: documents owned by user AND documents shared via email
 */
export function subscribeToUserDocuments(
  userId: string,
  callback: (documents: DocumentWithRole[]) => void,
  options: SubscribeOptions = {},
  userEmail?: string
): Unsubscribe {
  const { includeArchived = false } = options;

  console.log('subscribeToUserDocuments:', { userId, userEmail, includeArchived });

  const allDocsQuery = query(
    collection(db, 'documents'),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    allDocsQuery,
    (snapshot) => {
      const documents: DocumentWithRole[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as Document;
        const docId = docSnap.id;

        const isOwner = data.ownerId === userId;
        
        // Convert email to safe key for lookup
        const normalizedEmail = userEmail?.toLowerCase().trim();
        const emailKey = normalizedEmail ? emailToKey(normalizedEmail) : null;
        const hasEmailAccess = emailKey && 
          data.access && 
          typeof data.access === 'object' &&
          emailKey in data.access;

        console.log('Document check:', {
          docId,
          title: data.title,
          isOwner,
          hasEmailAccess,
          normalizedEmail,
          emailKey,
          accessKeys: data.access ? Object.keys(data.access) : []
        });

        if (!isOwner && !hasEmailAccess) {
          return;
        }

        if (!includeArchived && data.isArchived) {
          return;
        }

        let userRole: DocumentRole;
        if (isOwner) {
          userRole = 'owner';
        } else if (hasEmailAccess && emailKey) {
          userRole = data.access![emailKey] as DocumentRole;
        } else {
          return;
        }

        documents.push({
          ...data,
          id: docId,
          userRole,
          isOwner,
        });
      });

      console.log('subscribeToUserDocuments: found documents', documents.length, documents.map(d => ({ id: d.id, title: d.title, role: d.userRole })));
      callback(documents);
    },
    (error) => {
      console.error('Error subscribing to user documents:', error);
      callback([]);
    }
  );
}

export function subscribeToDocument(
  documentId: string,
  callback: (document: Document | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'documents', documentId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          ...data,
          id: snapshot.id,
        } as Document);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to document:', error);
      if (onError) {
        onError(error);
      } else {
        callback(null);
      }
    }
  );
}

export async function getDocument(
  documentId: string
): Promise<Document | null> {
  try {
    const docRef = doc(db, 'documents', documentId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        ...data,
        id: snapshot.id,
      } as Document;
    }

    return null;
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
}

export async function getUserDocumentRole(
  documentId: string,
  userId: string,
  userEmail: string
): Promise<DocumentRole | null> {
  try {
    const document = await getDocument(documentId);
    if (!document) return null;

    if (document.ownerId === userId) {
      return 'owner';
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    const emailKey = emailToKey(normalizedEmail);
    
    if (document.access && emailKey in document.access) {
      return document.access[emailKey];
    }

    return null;
  } catch (error) {
    console.error('Error getting user document role:', error);
    return null;
  }
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

