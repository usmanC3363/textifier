import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createVersion } from '@/features/versions/services/versionService';
import type { ContentMetadata } from '@/features/editor/types/editor.types';

export async function updateDocumentContent(
  documentId: string,
  content: string,
  userId: string,
  metadata: ContentMetadata,
  options?: {
    commit?: boolean;
  }
) {
  try {
    const docRef = doc(db, 'documents', documentId);

    if (options?.commit) {
      // ✅ REAL save → version bump
      await updateDoc(docRef, {
        content,
        wordCount: metadata.wordCount,
        characterCount: metadata.characterCount,
        lastEditedBy: userId,
        updatedAt: serverTimestamp(),
        version: increment(1),
      });

      // ✅ CREATE VERSION SNAPSHOT
      await createVersion(
        documentId,
        content,
        {
          wordCount: metadata.wordCount,
          characterCount: metadata.characterCount,
          userId: userId,
          userEmail: metadata.userEmail ?? null,   // IMPORTANT – see next section
          userName: metadata.userName ?? null,
        }
      )
    } else {
      // 📝 Draft save → no version
      await updateDoc(docRef, {
        content,
        wordCount: metadata.wordCount,
        characterCount: metadata.characterCount,
        lastEditedBy: userId,
        draftUpdatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating document content:', error);
    throw error;
  }
}
