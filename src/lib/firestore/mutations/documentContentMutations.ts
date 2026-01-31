import { 
    doc, 
    updateDoc, 
    increment, 
    serverTimestamp,
    getDoc,
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  
  /**
   * Update document content with metadata
   */
  export async function updateDocumentContent(
    documentId: string,
    content: string,
    userId: string,
    metadata: {
      wordCount: number;
      characterCount: number;
    },
    options?: {
      commit?: boolean;
    }
  ) {
    // const commit = options?.commit ?? false;
    try {
      const docRef = doc(db, 'documents', documentId);
  
      const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const existing = docSnap.data()?.content;
          if (existing === content && options?.commit) {
            console.log('⏭️ Skipping commit: content identical');
            return;
          }
        }

      if (options?.commit) {
        // REAL save → version bump
        await updateDoc(docRef, {
          content,
          wordCount: metadata.wordCount,
          characterCount: metadata.characterCount,
          lastEditedBy: userId,
          updatedAt: serverTimestamp(),
          version: increment(1),
        });
      } else {
        // Draft save → no version bump
        // await updateDoc(docRef, {
        //   content,
        //   wordCount: metadata.wordCount,
        //   characterCount: metadata.characterCount,
        //   lastEditedBy: userId,
        //   draftUpdatedAt: serverTimestamp(),
        // });
      }
    } catch (error) {
      console.error('Error updating document content:', error);
      throw error;
    }
  }
  
  /**
   * Update document title
   */
  export async function updateDocumentTitle(
    documentId: string,
    title: string,
    userId: string
  ) {
    try {
      const docRef = doc(db, 'documents', documentId);
      
      await updateDoc(docRef, {
        title,
        lastEditedBy: userId,
        updatedAt: serverTimestamp(),
        version: increment(1),
      });
    } catch (error) {
      console.error('Error updating document title:', error);
      throw error;
    }
  }
  
  /**
   * Archive/unarchive document
   */
  export async function toggleDocumentArchive(
    documentId: string,
    isArchived: boolean
  ) {
    try {
      const docRef = doc(db, 'documents', documentId);
      
      await updateDoc(docRef, {
        isArchived,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error toggling document archive:', error);
      throw error;
    }
  }