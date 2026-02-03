import { useState, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getVersionByNumber, createVersion } from '../services/versionService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { ContentMetadata } from '@/features/editor/types/editor.types';
import type { DocumentWithRole } from '@/features/documents/types/document.types';

interface UseVersionRestoreOptions {
  documentId: string;
  onRestoreComplete?: () => void;
  role: DocumentWithRole['userRole'];
}

export function useVersionRestore({
  documentId,
  onRestoreComplete,
  role,
}: UseVersionRestoreOptions) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  /**
   * Restore a version
   * Process:
   * 1. Get version to restore
   * 2. Update document content AND increment doc version
   * 3. Create a version snapshot with "Ver_X" naming
   * 4. Force editor to update
   */

  const restoreVersion = useCallback(
    async (versionNumber: number, customName?: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (role === 'viewer') {
        throw new Error('You do not have permission to restore versions');
      }
      try {
        setIsRestoring(true);
        setError(null);

        console.log(`[Restore] Starting restore of version ${versionNumber}`);

        // 1. Get the version to restore
        const versionToRestore = await getVersionByNumber(
          documentId,
          versionNumber
        );

        if (!versionToRestore) {
          throw new Error(`Version ${versionNumber} not found`);
        }

        console.log('[Restore] Version content loaded');

        // 2. Update the document AND increment version
        const docRef = doc(db, 'documents', documentId);

        await updateDoc(docRef, {
          content: versionToRestore.content,
          wordCount: versionToRestore.wordCount || 0,
          characterCount: versionToRestore.characterCount || 0,
          updatedAt: serverTimestamp(),
          lastEditedBy: user.uid,
          version: increment(1), // ✅ Increment doc info version
        });

        console.log('[Restore] Document updated, version incremented');

        // 3. Create a version snapshot
        const metadata: ContentMetadata = {
          wordCount: versionToRestore.wordCount || 0,
          characterCount: versionToRestore.characterCount || 0,
          userId: user.uid,
          userEmail: user.email || '',
          userName: user.displayName || '',
        };

        await createVersion(documentId, versionToRestore.content, metadata, {
          isRestored: true,
          restoredFromVersion: versionNumber,
          description: customName, // Only set if custom name provided
        });

        console.log('[Restore] Version snapshot created');

        // 4. Trigger callback to force editor update
        onRestoreComplete?.();

        console.log(`✅ Version ${versionNumber} restored successfully`);
      } catch (err) {
        console.error('[Restore] Error restoring version:', err);
        setError(err as Error);
        throw err;
      } finally {
        setIsRestoring(false);
      }
    },
    [documentId, user, onRestoreComplete]
  );

  return {
    restoreVersion,
    isRestoring,
    error,
  };
}

// import { useState, useCallback } from 'react';
// import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase/config';
// import { getVersionByNumber, createVersion } from '../services/versionService';
// import { useAuth } from '@/features/auth/hooks/useAuth';
// import type { ContentMetadata } from '@/features/editor/types/editor.types';

// interface UseVersionRestoreOptions {
//   documentId: string;
//   onRestoreComplete?: () => void;
// }

// export function useVersionRestore({ documentId, onRestoreComplete }: UseVersionRestoreOptions) {
//   const [isRestoring, setIsRestoring] = useState(false);
//   const [error, setError] = useState<Error | null>(null);
//   const { user } = useAuth();

//   /**
//    * Restore a version
//    *
//    * Process:
//    * 1. Get version to restore
//    * 2. Update document content
//    * 3. Create a version snapshot marking it as "restored from vX"
//    * 4. Force editor to update
//    */
//   const restoreVersion = useCallback(
//     async (versionNumber: number, customName?: string) => {
//       if (!user) {
//         throw new Error('User not authenticated');
//       }

//       try {
//         setIsRestoring(true);
//         setError(null);

//         console.log(`[Restore] Starting restore of version ${versionNumber}`);

//         // 1. Get the version to restore
//         const versionToRestore = await getVersionByNumber(documentId, versionNumber);

//         if (!versionToRestore) {
//           throw new Error(`Version ${versionNumber} not found`);
//         }

//         console.log('[Restore] Version content loaded');

//         // 2. Update the document
//         const docRef = doc(db, 'documents', documentId);

//         await updateDoc(docRef, {
//           content: versionToRestore.content,
//           wordCount: versionToRestore.wordCount || 0,
//           characterCount: versionToRestore.characterCount || 0,
//           updatedAt: serverTimestamp(),
//           lastEditedBy: user.uid,
//         });

//         console.log('[Restore] Document updated');

//         // 3. Create a version snapshot (this is the "copy" you want to see)
//         const metadata: ContentMetadata = {
//           wordCount: versionToRestore.wordCount || 0,
//           characterCount: versionToRestore.characterCount || 0,
//           userId: user.uid,
//           userEmail: user.email || '',
//           userName: user.displayName || '',
//         };

//         await createVersion(
//           documentId,
//           versionToRestore.content,
//           metadata,
//           {
//             isRestored: true,
//             restoredFromVersion: versionNumber,
//             description: customName || `Restored from Version ${versionNumber}`,
//           }
//         );

//         console.log('[Restore] Version snapshot created');

//         // 4. Trigger callback to force editor update
//         onRestoreComplete?.();

//         console.log(`✅ Version ${versionNumber} restored successfully`);

//       } catch (err) {
//         console.error('[Restore] Error restoring version:', err);
//         setError(err as Error);
//         throw err;
//       } finally {
//         setIsRestoring(false);
//       }
//     },
//     [documentId, user, onRestoreComplete]
//   );

//   return {
//     restoreVersion,
//     isRestoring,
//     error,
//   };
// }
