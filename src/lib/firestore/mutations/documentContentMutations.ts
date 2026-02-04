import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createVersion } from '@/features/versions/services/versionService';
import type { ContentMetadata } from '@/features/editor/types/editor.types';

export async function updateDocumentContent(
  documentId: string,
  content: string,
  user: {
    id: string;
    email: string | null;
    name: string | null;
  },
  metadata: ContentMetadata,
  options?: {
    commit?: boolean;
  }
) {

  if (!user?.id) {
    console.warn(
      '[updateDocumentContent] Skipped save — missing user.id',
      user
    );
    return;
  }
  
  try {
    const docRef = doc(db, 'documents', documentId);

    if (options?.commit) {
      // ✅ REAL save → version bump
      await updateDoc(docRef, {
        content,
        wordCount: metadata.wordCount,
        characterCount: metadata.characterCount,
        lastEditedBy: user.id,
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
          userId: user.id,
          userEmail: user.email, 
          userName: user.name,
        }
      )
    } else {
      // 📝 Draft save → no version
      await updateDoc(docRef, {
        content,
        wordCount: metadata.wordCount,
        characterCount: metadata.characterCount,
        lastEditedBy: user.id,
        draftUpdatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating document content:', error);
    throw error;
  }
}
