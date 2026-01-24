import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  Document,
} from '@/features/documents/types/document.types';

/**
 * Create a new document
 * Sets the current user as owner
 */
export async function createDocument(
  userId: string,
  input: CreateDocumentInput
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'documents'), {
      title: input.title || 'Untitled Document',
      content: input.content || JSON.stringify({ type: 'doc', content: [] }),
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastEditedBy: userId,
      version: 1,
      isArchived: false,
    });

    await addDoc(collection(db, 'documents', docRef.id, 'permissions'), {
      userId,
      email: null, //  resolve later
      role: 'owner',
      grantedBy: userId,
      grantedAt: serverTimestamp(),
      isPending: false,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

/**
 * Update document metadata
 * Only updates provided fields
 */
export async function updateDocument(
  documentId: string,
  userId: string,
  input: UpdateDocumentInput
): Promise<void> {
  try {
    const docRef = doc(db, 'documents', documentId);
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
      lastEditedBy: userId,
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
      // Increment version when content changes
      const currentDoc = await docRef.get();
      const currentVersion = currentDoc.data()?.version || 1;
      updateData.version = currentVersion + 1;
    }

    if (input.isArchived !== undefined) {
      updateData.isArchived = input.isArchived;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

/**
 * Delete a document
 * Only owners can delete (enforced by security rules)
 * Also deletes related data (permissions, versions, presence)
 */
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Delete document
    const docRef = doc(db, 'documents', documentId);
    batch.delete(docRef);

    // Note: Firestore doesn't support cascading deletes natively
    // You may want to use Cloud Functions to clean up:
    // - permissions subcollection
    // - documentVersions/{documentId} collection
    // - presence/{documentId} collection
    // For now, we'll just delete the document
    // Security rules will prevent access to orphaned subcollections

    await batch.commit();
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Archive/unarchive a document
 */
export async function archiveDocument(
  documentId: string,
  userId: string,
  isArchived: boolean
): Promise<void> {
  try {
    await updateDocument(documentId, userId, { isArchived });
  } catch (error) {
    console.error('Error archiving document:', error);
    throw error;
  }
}

export async function inviteUserToDocument({
  documentId,
  email,
  role,
  grantedBy,
}: {
  documentId: string;
  email: string;
  role: 'editor' | 'viewer';
  grantedBy: string;
}) {
  await addDoc(collection(db, 'documents', documentId, 'permissions'), {
    userId: null,
    email,
    role,
    grantedBy,
    grantedAt: serverTimestamp(),
    isPending: true,
  });
}

export async function inviteCollaboratorByEmail(
  documentId: string,
  email: string,
  role: 'editor' | 'viewer',
  invitedByUid: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  // Simple deterministic hash (no crypto lib needed)
  const emailHash = btoa(normalizedEmail);

  const permissionRef = doc(
    db,
    'documents',
    documentId,
    'permissions',
    emailHash
  );

  await setDoc(permissionRef, {
    email: normalizedEmail,
    role,
    isPending: true,
    invitedBy: invitedByUid,
    createdAt: serverTimestamp(),
  });
}
