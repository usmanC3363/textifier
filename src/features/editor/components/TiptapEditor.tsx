import { EditorContent } from '@tiptap/react';
import { useEditor } from '../hooks/useEditor';
import { EditorToolbar } from './EditorToolbar';
import { BubbleMenu } from './BubbleMenu';
import { type ContentMetadata, type SaveStatus } from '../types/editor.types';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface TiptapEditorProps {
  documentId: string;
  initialContent: string;
  isReadOnly: boolean;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  } | null,
  onSave: (content: string, metadata: ContentMetadata, options: {commit: boolean}) => Promise<void>;
  onStatusChange?: (status: SaveStatus) => void;
  placeholder?: string;
}

export function TiptapEditor({
  documentId,
  initialContent,
  isReadOnly,
  onSave,
  user,
  onStatusChange,
  placeholder,
}: TiptapEditorProps) {
  const { 
    editor, 
    saveStatus, 
    lastSaved, 
    wordCount, 
    characterCount 
  } = useEditor({
    documentId,
    initialContent,
    isReadOnly,
    user,
    onSave,
    placeholder,
  });

  // Notify parent of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(saveStatus);
    }
  }, [saveStatus, onStatusChange]);

  // useEffect(() => {
  //   if (!editor) return;
  
  //   editor.commands.setContent(initialContent, {emitUpdate: false});
  // }, [initialContent]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar (only show for editors) */}
      {!isReadOnly && <EditorToolbar editor={editor} />}

      {/* Bubble menu for text selection */}
      {!isReadOnly && <BubbleMenu editor={editor} />}

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          You're viewing this document in read-only mode. You don't have edit permissions.
        </div>
      )}

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Footer with metadata (optional) */}
      {!isReadOnly && (
        <div className="border-t px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>{characterCount} characters</span>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && lastSaved && (
              <span>
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600">Failed to save</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}