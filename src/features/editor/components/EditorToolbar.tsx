import { Editor } from '@tiptap/core';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  CodeSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Unlink,
  Table,
  Minus,
  Undo,
  Redo,
  Highlighter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

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
      className={`h-8 w-8 p-0 ${isActive ? 'bg-gray-200' : ''}`}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="border-muted-foreground/35 border-x border-t rounded-t rounded-tl rounded-tr bg-white sticky top-0 z-0 px-4 py-2">
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.commands.undo()}
          icon={Undo}
          title="Undo (Ctrl+Z)"
        />
        <ToolbarButton
          onClick={() => editor.commands.redo()}
          icon={Redo}
          title="Redo (Ctrl+Y)"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          title="Heading 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          title="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          title="Heading 3"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={UnderlineIcon}
          title="Underline (Ctrl+U)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={Strikethrough}
          title="Strikethrough"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          icon={Highlighter}
          title="Highlight"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          icon={Code}
          title="Inline Code"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={AlignLeft}
          title="Align Left"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={AlignCenter}
          title="Align Center"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={AlignRight}
          title="Align Right"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          icon={AlignJustify}
          title="Justify"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          title="Numbered List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          icon={ListTodo}
          title="Task List"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          title="Blockquote"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          icon={CodeSquare}
          title="Code Block"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          title="Horizontal Rule"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Table */}
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          icon={Table}
          title="Insert Table"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Links */}
        {showLinkInput ? (
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addLink();
                if (e.key === 'Escape') {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }
              }}
              placeholder="Enter URL..."
              className="border rounded px-2 py-1 text-sm w-64"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={addLink}
            >
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl('');
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <ToolbarButton
              onClick={() => {
                const previousUrl = editor.getAttributes('link').href;
                setLinkUrl(previousUrl || '');
                setShowLinkInput(true);
              }}
              isActive={editor.isActive('link')}
              icon={Link}
              title="Add Link"
            />
            {editor.isActive('link') && (
              <ToolbarButton
                onClick={() => editor.chain().focus().unsetLink().run()}
                icon={Unlink}
                title="Remove Link"
              />
            )}
          </>
        )}
      </div>

      {/* Table controls (show when inside a table) */}
      {editor.isActive('table') && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            Add Column Before
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            Add Column After
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            Delete Column
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            Add Row Before
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            Add Row After
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            Delete Row
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            Delete Table
          </Button>
        </div>
      )}
    </div>
  );
}