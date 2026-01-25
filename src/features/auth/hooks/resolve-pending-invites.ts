import {
  collectionGroup,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function resolvePendingInvites(user: {
  uid: string;
  email: string;
}) {
  if (!user.email) return;

  const q = query(
    collectionGroup(db, 'permissions'),
    where('email', '==', user.email.toLowerCase()),
    where('isPending', '==', true)
  );

  const snapshot = await getDocs(q);

  const updates = snapshot.docs.map((snap) =>
    updateDoc(snap.ref, {
      userId: user.uid,
      isPending: false,
      acceptedAt: serverTimestamp(),
    })
  );

  await Promise.all(updates);
}
