// import { useState, useCallback } from 'react';
// import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase/config';
// import { getVersionByNumber, createVersion } from '../services/versionService';
// import { useAuth } from '@/features/auth/hooks/useAuth';

// interface UseVersionRestoreOptions {
//   documentId: string;
//   onSuccess?: (newVersionNumber: number) => void;
//   onError?: (error: Error) => void;
// }

// export function useVersionRestore({
//   documentId,
//   onSuccess,
//   onError,
// }: UseVersionRestoreOptions) {
//   const { user } = useAuth();
//   const [restoring, setRestoring] = useState(false);
//   const [error, setError] = useState<Error | null>(null);

//   /**
//    * Restore a specific version as a new version
//    */
//   const restoreVersion = useCallback(
//     async (versionNumber: number, description?: string) => {
//       if (!user) {
//         const err = new Error('User not authenticated');
//         setError(err);
//         onError?.(err);
//         return;
//       }

//       try {
//         setRestoring(true);
//         setError(null);

//         // 1. Get the version to restore
//         const versionToRestore = await getVersionByNumber(documentId, versionNumber);

//         if (!versionToRestore) {
//           throw new Error(`Version ${versionNumber} not found`);
//         }

//         // 2. Update main document with restored content
//         const docRef = doc(db, 'documents', documentId);
//         await updateDoc(docRef, {
//           content: versionToRestore.content,
//           wordCount: versionToRestore.wordCount,
//           characterCount: versionToRestore.characterCount,
//           lastEditedBy: user.uid,
//           updatedAt: serverTimestamp(),
//           version: increment(1),
//         });

//         // 3. Create new version snapshot (marked as restored)
//         const newVersion = await createVersion(
//           documentId,
//           versionToRestore.content,
//           {
//             wordCount: versionToRestore.wordCount,
//             characterCount: versionToRestore.characterCount,
//             userId: user.uid,
//             userEmail: user.email || '',
//             userName: user.displayName || undefined,
//           },
//           {
//             isRestored: true,
//             restoredFromVersion: versionNumber,
//             description: description || `Restored from Version ${versionNumber}`,
//           }
//         );

//         console.log(
//           `✅ Restored version ${versionNumber} as version ${newVersion.versionNumber}`
//         );

//         onSuccess?.(newVersion.versionNumber);
//       } catch (err) {
//         console.error('Error restoring version:', err);
//         const error = err as Error;
//         setError(error);
//         onError?.(error);
//       } finally {
//         setRestoring(false);
//       }
//     },
//     [documentId, user, onSuccess, onError]
//   );

//   return {
//     restoreVersion,
//     restoring,
//     error,
//   };
// }

import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createVersion } from '../services/versionService';

export function useVersionRestore(documentId: string, userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const restoreVersion = async (
    versionNumber: number,
    description?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, 'documents', documentId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) throw new Error('Document not found');

      const currentContent = snap.data().content;

      const docData = snap.data();

      await createVersion(
        documentId,
        currentContent,
        {
          wordCount: docData.wordCount ?? 0,
          characterCount: docData.characterCount ?? 0,
          userId,
          userEmail: docData.lastEditedByEmail,
          userName: docData.lastEditedByName,
        }
      );
      

      // 2️⃣ Fetch old version
      const versionSnap = await getDoc(
        doc(db, 'documents', documentId, 'versions', String(versionNumber))
      );

      if (!versionSnap.exists()) {
        throw new Error('Version not found');
      }

      const oldContent = versionSnap.data().content;

      // 3️⃣ Restore old content
      await createVersion(
        documentId,
        oldContent,
        {
          wordCount: docData.wordCount ?? 0,
          characterCount: docData.characterCount ?? 0,
          userId,
          userEmail: docData.lastEditedByEmail,
          userName: docData.lastEditedByName,
        },
        {
          isRestored: true,
          restoredFromVersion: versionNumber,
          description,
        }
      );
      
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { restoreVersion, loading, error };
}
