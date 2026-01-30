import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
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
  const normalizedEmail = email.toLowerCase().trim();
  
  const q = query(
    collection(db, 'invites'),
    where('email', '==', normalizedEmail),
    where('isPending', '==', true)
  );

  const snap = await getDocs(q);

  console.log(`Found ${snap.size} pending invites for ${normalizedEmail}`);

  for (const invite of snap.docs) {
    const inviteData = invite.data();
    
    console.log(`Activating invite ${invite.id} for document ${inviteData.documentId}`);

    // ✅ ONLY update the invite record
    // ❌ DO NOT modify document.access - it's already set!
    await updateDoc(invite.ref, {
      isPending: false,
      userId: uid,
      grantedAt: serverTimestamp(),
    });

    console.log(`✅ Invite ${invite.id} activated`);
  }

  console.log('✅ All pending invites resolved');
  
}
