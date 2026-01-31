import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {TextStyle} from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {Table} from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

// Initialize lowlight with common languages
const lowlight = createLowlight(common);

/**
 * Get all Tiptap extensions with configurations
 */
export function getEditorExtensions(placeholder = 'Start writing...') {
  return [
    // StarterKit includes: Bold, Italic, Strike, Code, Paragraph, Heading, etc.
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      codeBlock: false, // We'll use CodeBlockLowlight instead
      // Enable history for undo/redo
      undoRedo: {
          depth: 100,
          newGroupDelay: 500,
        },
      link: false,
      underline: false,
    }),

    // Additional formatting
    Underline,
    
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: 'left',
    }),

    // Link handling
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
      },
      validate: href => /^https?:\/\//.test(href),
    }),

    // Placeholder text
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),

    // Text styling
    TextStyle,
    Color,
    
    Highlight.configure({
      multicolor: true,
    }),

    // Task lists (checkboxes)
    TaskList.configure({
      HTMLAttributes: {
        class: 'task-list',
      },
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'task-item',
      },
    }),

    // Tables
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse table-auto w-full',
      },
    }),
    TableRow,
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 px-3 py-2',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 px-3 py-2 bg-gray-50 font-semibold',
      },
    }),

    // Code blocks with syntax highlighting
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm',
      },
    }),
  ];
}