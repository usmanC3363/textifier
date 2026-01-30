import {
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { auth } from "@/lib/firebase/auth";

/**
 * Activate a permission/invite
 * 
 * IMPORTANT: This does NOT modify document.access
 * Access is already granted via email key when invite was created
 * We only update the invite record to mark it as activated
 */
export async function activatePermission({
  documentId,
  permissionId,
}: {
  documentId: string;
  permissionId: string;
}) {
  const user = auth.currentUser;
  if (!user) {
    console.error('No authenticated user');
    return;
  }

  console.log(`Activating permission ${permissionId} for document ${documentId}`);

  // Update the invite record in the invites collection
  const inviteRef = doc(db, "invites", permissionId);
  
  try {
    // Check if invite exists
    const inviteSnap = await getDoc(inviteRef);
    
    if (!inviteSnap.exists()) {
      console.warn(`Invite ${permissionId} not found - may already be activated`);
      return;
    }

    // Update invite to mark as activated
    await updateDoc(inviteRef, {
      isPending: false,
      userId: user.uid,
      grantedAt: serverTimestamp(),
    });

    console.log(`✅ Permission ${permissionId} activated`);

  } catch (error) {
    console.error('Error activating permission:', error);
    // Don't throw - this shouldn't block document access
  }

  // NOTE: We do NOT modify document.access here
  // Access was already granted via email key when invite was created
  // The document.access map already has: "user_email_key": "role"
  // Adding user.uid would create duplicate entries!
}