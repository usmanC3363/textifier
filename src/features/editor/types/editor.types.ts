import { Editor } from '@tiptap/core';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface EditorProps {
  documentId: string;
  initialContent: string;
  isReadOnly: boolean;
  onContentChange?: (content: string) => void;
}

export interface ToolbarProps {
  editor: Editor | null;
}

export interface BubbleMenuProps {
  editor: Editor | null;
}

export interface EditorState {
  content: string;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  wordCount: number;
  characterCount: number;
}

export interface ContentMetadata {
  wordCount: number;
  characterCount: number;
  userId: string,
  userEmail: string | null;
  userName: string | null;
}