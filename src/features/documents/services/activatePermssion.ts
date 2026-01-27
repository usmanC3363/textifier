import {
  doc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { auth } from "@/lib/firebase/auth";

export async function activatePermission({
  documentId,
  permissionId,
}: {
  documentId: string;
  permissionId: string;
}) {
  const user = auth.currentUser;
  if (!user) return;

  const permissionRef = doc(
    db,
    "documents",
    documentId,
    "permissions",
    permissionId
  );

  const documentRef = doc(db, "documents", documentId);

  await updateDoc(permissionRef, {
    isPending: false,
    userId: user.uid,
    grantedAt: serverTimestamp(),
  });

  await updateDoc(documentRef, {
    [`access.${user.uid}`]: "viewer",
  });
}
