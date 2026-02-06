import { useEditor, EditorContent } from '@tiptap/react';
import { getEditorExtensions } from '@/features/editor/extensions';

interface TiptapPreviewProps {
  content: string;
}

export function TiptapPreview({ content }: TiptapPreviewProps) {
  const editor = useEditor({
    extensions: getEditorExtensions(),
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
