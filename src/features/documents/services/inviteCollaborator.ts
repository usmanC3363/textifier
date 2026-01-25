import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function inviteCollaborator({
  documentId,
  email,
  role,
}: {
  documentId: string;
  email: string;
  role: 'editor' | 'viewer';
}) {
  await addDoc(
    collection(db, 'documents', documentId, 'permissions'),
    {
      email: email.toLowerCase(),
      role,
      isPending: true,
      invitedAt: serverTimestamp(),
    }
  );
}
