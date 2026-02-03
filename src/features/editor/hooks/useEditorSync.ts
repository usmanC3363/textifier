import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Editor } from '@tiptap/react';

interface UseEditorSyncOptions {
  documentId: string;
  editor: Editor | null;
  isReadOnly: boolean;
  isTypingRef: React.RefObject<boolean>;
  enabled?: boolean;
}


export function useEditorSync({
  documentId,
  editor,
  isReadOnly,
  isTypingRef,
  enabled = true,
}: UseEditorSyncOptions) {
  const isLocalUpdate = useRef(false);

  useEffect(() => {
    if (!enabled || !editor || !documentId || isReadOnly) return;

    const docRef = doc(db, 'documents', documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        // 🚫 If user is typing, do NOT apply remote updates
        if (isTypingRef.current === true) {
          return;
        }

        const remoteContent = snapshot.data().content;
        if (!remoteContent) return;

        try {
          const parsed =
            typeof remoteContent === 'string'
              ? JSON.parse(remoteContent)
              : remoteContent;

          const current = editor.getJSON();
          const changed =
            JSON.stringify(current) !== JSON.stringify(parsed);

          if (!changed) return;

          isLocalUpdate.current = true;

          // 👇 Critical: do not emit update
          editor.commands.setContent(parsed, { emitUpdate: false });

          isLocalUpdate.current = false;
        } catch (err) {
          console.error('[EditorSync] Failed to sync content:', err);
        }
      },
      (err) => {
        console.error('[EditorSync] Snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [documentId, editor, enabled, isReadOnly, isTypingRef]);

  return {};
}
