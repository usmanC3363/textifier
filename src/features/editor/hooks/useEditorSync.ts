import { useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { deserializeContent, serializeContent } from '../utils/contentSerializer';

interface UseEditorSyncOptions {
  documentId: string;
  editor: Editor | null;
  isReadOnly: boolean;
  isTypingRef: React.RefObject<boolean>;
}

/**
 * Hook for syncing editor content with Firestore in real-time
 * Handles incoming changes from other users
 */
export function useEditorSync({
  documentId,
  editor,
  isReadOnly,
  isTypingRef
}: UseEditorSyncOptions) {
  const isUpdatingRef = useRef(false);
  const lastRemoteContentRef = useRef<string>('');
  const lastVersionRef = useRef<number>(0);

  /**
   * Update editor content from remote changes
   */
  const updateEditorContent = useCallback(
    (remoteContent: string) => {
      if (!editor) return;
      if (isUpdatingRef.current) return;
      if (isTypingRef.current) return;

      // Check if content actually changed
      if (remoteContent === lastRemoteContentRef.current) return;

      const currentSerialized = serializeContent(editor.getJSON());
      if (remoteContent === currentSerialized) return;

      try {
        isUpdatingRef.current = true;
        lastRemoteContentRef.current = remoteContent;

        const content = deserializeContent(remoteContent);

        // Get cursor position BEFORE update
        const { from, to } = editor.state.selection;

        // Update content without emitting update event
        editor.commands.setContent(content, { emitUpdate: false });

        // Try to restore cursor (might fail if doc changed significantly)
        if (!isReadOnly) {
          try {
            const docSize = editor.state.doc.content.size;
            if (from <= docSize && to <= docSize) {
              editor.commands.setTextSelection({ from, to });
            }
          } catch (e) {
            // Cursor restoration failed, that's ok
          }
        }
      } catch (error) {
        console.error('Failed to update editor content:', error);
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [editor, isTypingRef, isReadOnly]
  );

  /**
   * Subscribe to Firestore document changes
   */
  useEffect(() => {
    if (!editor || !documentId) return;

    let unsubscribe: Unsubscribe;

    try {
      const docRef = doc(db, 'documents', documentId);

      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            console.warn('Document does not exist');
            return;
          }

          const data = snapshot.data();
          const remoteContent = data?.content;
          const remoteVersion = data?.version || 0;

          if (!remoteContent) return;

          // FIRST TIME LOAD - Just set refs, don't update editor
          if (lastRemoteContentRef.current === '') {
            lastRemoteContentRef.current = remoteContent;
            lastVersionRef.current = remoteVersion;
            console.log('📝 Initial load - version:', remoteVersion);
            return;
          }

          // SKIP if version unchanged (draft saves)
          if (remoteVersion === lastVersionRef.current) {
            console.log('⏭️ Version unchanged, ignoring');
            return;
          }

          // SKIP if content is actually the same (even if version changed)
          if (remoteContent === lastRemoteContentRef.current) {
            console.log('⏭️ Content identical, just updating version tracker');
            lastVersionRef.current = remoteVersion;
            return;
          }

          console.log('🔄 Version changed:', lastVersionRef.current, '→', remoteVersion);
          lastVersionRef.current = remoteVersion;

          // Don't interrupt user typing - update will happen when they stop
          if (isTypingRef.current) {
            console.log('⏭️ User typing, skipping remote update');
            return;
          }

          updateEditorContent(remoteContent);
        },
        (error) => {
          console.error('Firestore sync error:', error);
        }
      );
    } catch (error) {
      console.error('Failed to setup Firestore sync:', error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [documentId, editor, updateEditorContent, isTypingRef]);
}