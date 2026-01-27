import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
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
  input: CreateDocumentInput
): Promise<string> {
  try {
    const docRef = doc(collection(db, 'documents'));
    
    await setDoc(docRef, {
      title: input.title || 'Untitled Document',
      content: input.content || '',
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastEditedBy: userId,
      version: 1,
      isArchived: false,
      wordCount: 0,
      characterCount: 0,
      access: {}, // IMPORTANT: Initialize empty access object
    });

    console.log('Document created:', docRef.id);
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

// import {
//   collection,
//   doc,
//   addDoc,
//   updateDoc,
//   serverTimestamp,
//   writeBatch,
//   setDoc,
//   getDoc,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase/config';
// import type {
//   CreateDocumentInput,
//   UpdateDocumentInput,
// } from '@/features/documents/types/document.types';



// /* =========================
//    CREATE DOCUMENT
//    ========================= */
// export async function createDocument(
//   userId: string,
//   input: CreateDocumentInput
// ): Promise<string> {
//   try {
//     // 1️⃣ Create document WITH access map
//     const docRef = await addDoc(collection(db, 'documents'), {
//       title: input.title || 'Untitled Document',
//       content: input.content || JSON.stringify({ type: 'doc', content: [] }),
//       ownerId: userId,
//       access: {
//         [userId]: 'editor',
//       },
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//       lastEditedBy: userId,
//       version: 1,
//       isArchived: false,
//     });
    
//     // await addDoc(collection(db, "documents"), {
//     //   title: input.title || "Untitled Document",
//     //   content:
//     //     input.content || JSON.stringify({ type: "doc", content: [] }),
//     //   ownerId: userId,

//     //   access: {
//     //     [userId]: "owner", // 🔴 REQUIRED for sharing to work
//     //   },

//     //   createdAt: serverTimestamp(),
//     //   updatedAt: serverTimestamp(),
//     //   lastEditedBy: userId,
//     //   version: 1,
//     //   isArchived: false,
//     // });

//     // 2️⃣ Owner permission entry
//     await setDoc(
//       doc(db, "documents", docRef.id, "permissions", userId),
//       {
//         userId,
//         email: null,
//         role: "owner",
//         grantedBy: userId,
//         grantedAt: serverTimestamp(),
//         isPending: false,
//       }
//     );

//     return docRef.id;
//   } catch (error) {
//     console.error("Error creating document:", error);
//     throw error;
//   }
// }

// /* =========================
//    UPDATE DOCUMENT
//    ========================= */
// export async function updateDocument(
//   documentId: string,
//   userId: string,
//   input: UpdateDocumentInput
// ): Promise<void> {
//   try {
//     const docRef = doc(db, "documents", documentId);
//     const updateData: Record<string, unknown> = {
//       updatedAt: serverTimestamp(),
//       lastEditedBy: userId,
//     };

//     if (input.title !== undefined) {
//       updateData.title = input.title;
//     }

//     if (input.content !== undefined) {
//       updateData.content = input.content;

//       // 🔧 FIX: Firestore has NO docRef.get()
//       const snap = await getDoc(docRef);
//       const currentVersion = snap.data()?.version || 1;
//       updateData.version = currentVersion + 1;
//     }

//     if (input.isArchived !== undefined) {
//       updateData.isArchived = input.isArchived;
//     }

//     await updateDoc(docRef, updateData);
//   } catch (error) {
//     console.error("Error updating document:", error);
//     throw error;
//   }
// }

// /* =========================
//    INVITE USER (EMAIL)
//    ========================= */
// export async function inviteUserToDocument({
//   documentId,
//   email,
//   role,
//   grantedBy,
// }: {
//   documentId: string;
//   email: string;
//   role: "editor" | "viewer";
//   grantedBy: string;
// }) {
//   const normalizedEmail = email.trim().toLowerCase();

//   await addDoc(collection(db, "documents", documentId, "permissions"), {
//     userId: null,
//     email: normalizedEmail,
//     role,
//     grantedBy,
//     isPending: true,
//     grantedAt: serverTimestamp(),
//   });
// }

// /* =========================
//    DETERMINISTIC EMAIL INVITE
//    (OPTIONAL but GOOD)
//    ========================= */
// export async function inviteCollaboratorByEmail(
//   documentId: string,
//   email: string,
//   role: "editor" | "viewer",
//   invitedByUid: string
// ) {
//   const normalizedEmail = email.trim().toLowerCase();
//   const emailHash = btoa(normalizedEmail); // deterministic ID

//   const permissionRef = doc(
//     db,
//     "documents",
//     documentId,
//     "permissions",
//     emailHash
//   );

//   await setDoc(permissionRef, {
//     userId: null,
//     email: normalizedEmail,
//     role,
//     isPending: true,
//     grantedBy: invitedByUid,
//     grantedAt: serverTimestamp(),
//   });
// }


// /**
//  * Delete a document
//  * Only owners can delete (enforced by security rules)
//  * Also deletes related data (permissions, versions, presence)
//  */
// export async function deleteDocument(documentId: string): Promise<void> {
//   try {
//     const batch = writeBatch(db);

//     // Delete document
//     const docRef = doc(db, 'documents', documentId);
//     batch.delete(docRef);

//     // Note: Firestore doesn't support cascading deletes natively
//     // You may want to use Cloud Functions to clean up:
//     // - permissions subcollection
//     // - documentVersions/{documentId} collection
//     // - presence/{documentId} collection
//     // For now, we'll just delete the document
//     // Security rules will prevent access to orphaned subcollections

//     await batch.commit();
//   } catch (error) {
//     console.error('Error deleting document:', error);
//     throw error;
//   }
// }

// /**
//  * Archive/unarchive a document
//  */
// export async function archiveDocument(
//   documentId: string,
//   userId: string,
//   isArchived: boolean
// ): Promise<void> {
//   try {
//     await updateDocument(documentId, userId, { isArchived });
//   } catch (error) {
//     console.error('Error archiving document:', error);
//     throw error;
//   }
// }