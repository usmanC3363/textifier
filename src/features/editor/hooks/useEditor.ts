import { useEditor as useTiptapEditor } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { getEditorExtensions } from '../extensions';
import { deserializeContent, serializeContent, getContentMetadata } from '../utils/contentSerializer';
import { useAutoSave } from './useAutoSave';
import { useEditorSync } from './useEditorSync';
import type { ContentMetadata } from '../types/editor.types';
// import { type SaveStatus } from '../types/editor.types';
// import { type JSONContent } from '@tiptap/react';

interface UseEditorOptions {
  documentId: string;
  initialContent: string;
  isReadOnly: boolean;
  onSave: (
    content: string,
    metadata: ContentMetadata,
    options: { commit: boolean }
  ) => Promise<void>;
  placeholder?: string;
}

/**
 * Main hook for initializing and managing the Tiptap editor
 */
export function useEditor({
  documentId,
  initialContent,
  isReadOnly,
  onSave,
  placeholder = 'Start writing...',
}: UseEditorOptions) {
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  // Parse initial content
  const parsedContent = initialContent
    ? deserializeContent(initialContent)
    : { type: 'doc', content: [] };

  // Auto-save handler
  const handleSave = async (
    content: string,
    metadata: ContentMetadata,
    options: { commit: boolean }
  ) => {
    await onSave(content, metadata, options);
  };
  

  const { saveStatus, lastSaved, debouncedSave, forceSave, isTypingRef } = useAutoSave({
    documentId,
    onSave: handleSave,
    delay: 2000,
    enabled: !isReadOnly,
  });

  // Initialize Tiptap editor
  const editor = useTiptapEditor({
    extensions: getEditorExtensions(placeholder),
    content: parsedContent,
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none px-8 py-6',
      },
    },

    onUpdate: ({ editor, transaction }) => {
      if (isReadOnly) return;
      if (!transaction.docChanged) return;
    
      const content = editor.getJSON();
      const serialized = serializeContent(content);
      const metadata = getContentMetadata(content);
    
      setWordCount(metadata.wordCount);
      setCharacterCount(metadata.characterCount);
    
      debouncedSave(serialized, metadata);
    },

  });

  // Sync with Firestore for real-time collaboration
  useEditorSync({
    documentId,
    editor,
    isReadOnly,
    isTypingRef
  });

  // Update counts on mount
  useEffect(() => {
    if (editor) {
      const content = editor.getJSON();
      const metadata = getContentMetadata(content);
      setWordCount(metadata.wordCount);
      setCharacterCount(metadata.characterCount);
    }
  }, [editor]);

  // Update editable state when permission changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [editor, isReadOnly]);

  useEffect(() => {
    if (!editor || isReadOnly) return;
  
    const handleBlur = () => {
      const content = serializeContent(editor.getJSON());
      const metadata = getContentMetadata(editor.getJSON());
  
      forceSave(content, metadata).catch(console.error);
    };
  
    editor.on('blur', handleBlur);
  
    return () => {
      editor.off('blur', handleBlur);
    };
  }, [editor, isReadOnly, forceSave]);
  

  return {
    editor,
    saveStatus,
    lastSaved,
    wordCount,
    characterCount,
    forceSave: () => {
      if (editor) {
        const content = serializeContent(editor.getJSON());
        const metadata = getContentMetadata(editor.getJSON());
        return forceSave(content, metadata);
      }
      return Promise.resolve();
    },
  };
}