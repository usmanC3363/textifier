import {
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Helper function to convert email to a safe Firestore key
export function emailToKey(email: string): string {
  // Replace dots with underscores and normalize
  return email.toLowerCase().trim().replace(/\./g, '_');
}

// Helper function to convert key back to email
export function keyToEmail(key: string): string {
  return key.replace(/_/g, '.');
}

/**
 * Invite a collaborator to a document
 */
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

    // Check if this email already has access
    const existingAccess = docSnap.data().access || {};
    if (existingAccess[emailKey]) {
      throw new Error('User already has access to this document');
    }

    // Check if invite already exists for this email
    const existingInviteQuery = query(
      collection(db, 'invites'),
      where('documentId', '==', documentId),
      where('email', '==', normalizedEmail)
    );
    const existingInvites = await getDocs(existingInviteQuery);
    
    if (!existingInvites.empty) {
      // Update existing invite instead of creating duplicate
      const existingInvite = existingInvites.docs[0];
      await updateDoc(doc(db, 'invites', existingInvite.id), {
        role, // Update role if changed
        invitedAt: serverTimestamp(), // Update invite time
      });
      console.log('Updated existing invite:', existingInvite.id);
    } else {
      // Create new invite record
      const inviteId = crypto.randomUUID();
      await setDoc(doc(db, 'invites', inviteId), {
        documentId,
        email: normalizedEmail, // Store original email (with dots)
        role,
        isPending: true,
        grantedBy: invitedBy,
        invitedAt: serverTimestamp(),
        userId: null,
      });
      console.log('Created new invite:', inviteId);
    }
    
    // Grant access in document (use emailKey for Firestore map)
    await updateDoc(docRef, {
      [`access.${emailKey}`]: role, // This is the KEY in Firestore
      updatedAt: serverTimestamp(),
    });

    console.log('Access granted in document with key:', emailKey);
    return;
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    throw error;
  }
}

/**
 * Remove collaborator access and delete their invite
 */
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
    
    // Verify ownership
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    
    if (docSnap.data().ownerId !== removedBy) {
      throw new Error('Only document owner can remove collaborators');
    }
    
    // Remove from access map
    await updateDoc(docRef, {
      [`access.${emailKey}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('Removed from access map:', emailKey);
    
    // Also delete all invites for this email/document
    const invitesQuery = query(
      collection(db, 'invites'),
      where('documentId', '==', documentId),
      where('email', '==', normalizedEmail)
    );
    
    const invitesSnapshot = await getDocs(invitesQuery);
    const deletePromises = invitesSnapshot.docs.map(inviteDoc => 
      deleteDoc(doc(db, 'invites', inviteDoc.id))
    );
    
    await Promise.all(deletePromises);
    console.log('Deleted invites:', invitesSnapshot.size);
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
}

/**
 * Clean up invalid access entries (user IDs instead of emails)
 * Call this once to fix existing bad data
 */
export async function cleanupInvalidAccess(documentId: string) {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return;
    
    const access = docSnap.data().access || {};
    const updates: any = {};
    
    // Find entries that look like user IDs (long alphanumeric without underscores)
    Object.keys(access).forEach(key => {
      // User IDs are typically 28 chars and alphanumeric
      // Emails converted to keys have underscores
      if (key.length > 20 && !key.includes('_') && !key.includes('@')) {
        console.log('Found invalid access key (user ID):', key);
        updates[`access.${key}`] = deleteField();
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(docRef, updates);
      console.log('Cleaned up invalid access entries:', Object.keys(updates).length);
    }
  } catch (error) {
    console.error('Error cleaning up access:', error);
  }
}