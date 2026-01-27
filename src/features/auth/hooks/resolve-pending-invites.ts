import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function resolvePendingInvites({
  uid,
  email,
}: {
  uid: string;
  email: string;
}) {
  const q = query(
    collection(db, 'invites'),
    where('email', '==', email),
    where('isPending', '==', true)
  );

  const snap = await getDocs(q);

  for (const invite of snap.docs) {
    const { documentId, role } = invite.data();

    // 🔁 swap email-key to uid-key
    await updateDoc(doc(db, 'documents', documentId), {
      [`access.${uid}`]: role,
      [`access.${email}`]: null,
    });

    // mark invite resolved
    await updateDoc(invite.ref, {
      isPending: false,
      userId: uid,
      grantedAt: serverTimestamp(), // 🔑 REQUIRED
    });
  }
}
