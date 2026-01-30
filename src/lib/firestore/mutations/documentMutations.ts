import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from '@/features/documents/types/document.types';

/**
 * Create a new document
 */
export async function createDocument(
  userId: string,
  input: CreateDocumentInput,
  userEmail: string
): Promise<string> {
  try {
    const docRef = doc(collection(db, 'documents'));
    
    await setDoc(docRef, {
      title: input.title || 'Untitled Document',
      content: input.content || '',
      ownerId: userId,
      ownerEmail: userEmail, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastEditedBy: userId,
      version: 1,
      isArchived: false,
      wordCount: 0,
      characterCount: 0,
      access: {}, // IMPORTANT: Initialize empty access object
    });

    // console.log('Document created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

/**
 * Update an existing document
 */
export async function updateDocument(
  documentId: string,
  userId: string,
  input: UpdateDocumentInput
): Promise<void> {
  try {
    const docRef = doc(db, 'documents', documentId);
    
    const updateData: any = {
      ...input,
      updatedAt: serverTimestamp(),
      lastEditedBy: userId,
    };

    // Increment version if content changed
    if (input.content !== undefined) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        updateData.version = (docSnap.data().version || 0) + 1;
      }
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

/**
 * Delete a document and all its subcollections
 */
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Delete main document
    const docRef = doc(db, 'documents', documentId);
    batch.delete(docRef);

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
    const docRef = doc(db, 'documents', documentId);
    
    await updateDoc(docRef, {
      isArchived,
      updatedAt: serverTimestamp(),
      lastEditedBy: userId,
    });
  } catch (error) {
    console.error('Error archiving document:', error);
    throw error;
  }
}
