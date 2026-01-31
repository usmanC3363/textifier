import { Editor } from '@tiptap/core';
import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Highlighter,
  Link,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BubbleMenuProps {
  editor: Editor | null;
}

export function BubbleMenu({ editor }: BubbleMenuProps) {
  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    icon: any; 
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`h-7 w-7 z-[1000] p-0 ${isActive ? 'bg-yellow-200 text-white' : 'text-white hover:bg-yellow-400'}`}
      title={title}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <TiptapBubbleMenu
      editor={editor}
      options={{ 
        // WIP: duration is not in options, prev tippyOptions
        // duration: 100,
        placement: 'top',
      }}
      className="bg-blue-300 z-50 rounded-lg shadow-lg border border-gray-600 p-1 flex items-center gap-0.5"
    >
      <ToolbarButton
        // onClick={() => editor.chain().focus().toggleBold().run()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={Bold}
        title="Bold"
      />
      <ToolbarButton
        // onClick={() => editor.chain().focus().toggleItalic().run()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={Italic}
        title="Italic"
      />
      <ToolbarButton
        // onClick={() => editor.chain().focus().toggleUnderline().run()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        icon={Underline}
        title="Underline"
      />
      <ToolbarButton
        // onClick={() => editor.chain().focus().toggleStrike().run()}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        icon={Strikethrough}
        title="Strikethrough"
      />
      <ToolbarButton
        // onClick={() => editor.chain().focus().toggleHighlight().run()}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        icon={Highlighter}
        title="Highlight"
      />
      <ToolbarButton
        // onClick={() => editor.chain().focus().toggleCode().run()}
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        icon={Code}
        title="Code"
      />
      <div className="w-px h-4 bg-gray-700 mx-1" />
      <ToolbarButton
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) {
            // editor.chain().focus().setLink({ href: url }).run();
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive('link')}
        icon={Link}
        title="Add Link"
      />
    </TiptapBubbleMenu>
  );
}