import {
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Helper function to convert email to a safe Firestore key
function emailToKey(email: string): string {
  // Replace dots with underscores and normalize
  return email.toLowerCase().trim().replace(/\./g, '_');
}

// Helper function to convert key back to email
function keyToEmail(key: string): string {
  return key.replace(/_/g, '.');
}

export async function inviteCollaborator({
  documentId,
  email,
  role,
  invitedBy,
}: {
  documentId: string;
  email: string;
  role: 'editor' | 'viewer';
  invitedBy: string;
}) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const emailKey = emailToKey(normalizedEmail);
    
    console.log('inviteCollaborator:', { 
      documentId, 
      email, 
      normalizedEmail, 
      emailKey, 
      role, 
      invitedBy 
    });
    
    const docRef = doc(db, 'documents', documentId);
    
    // Verify the document exists and user is owner
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    if (docSnap.data().ownerId !== invitedBy) {
      throw new Error('Only document owner can invite collaborators');
    }
    
    // Use the safe key instead of raw email
    await updateDoc(docRef, {
      [`access.${emailKey}`]: role,
      updatedAt: serverTimestamp(),
    });

    console.log('inviteCollaborator: access granted with key', emailKey);

    // Create invite record with the ORIGINAL email
    const inviteId = crypto.randomUUID();
    await setDoc(doc(db, 'invites', inviteId), {
      documentId,
      email: normalizedEmail, // Store original email in invite
      role,
      isPending: true,
      grantedBy: invitedBy,
      invitedAt: serverTimestamp(),
      userId: null,
    });

    console.log('inviteCollaborator: invite created', inviteId);
    return inviteId;
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    throw error;
  }
}

export async function removeCollaborator({
  documentId,
  email,
  removedBy,
}: {
  documentId: string;
  email: string;
  removedBy: string;
}) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const emailKey = emailToKey(normalizedEmail);
    const docRef = doc(db, 'documents', documentId);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    if (docSnap.data().ownerId !== removedBy) {
      throw new Error('Only document owner can remove collaborators');
    }
    
    const { deleteField } = await import('firebase/firestore');
    await updateDoc(docRef, {
      [`access.${emailKey}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('removeCollaborator: access removed');
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
}

// Export these helpers so other files can use them
export { emailToKey, keyToEmail };