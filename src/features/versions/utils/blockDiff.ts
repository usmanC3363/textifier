import type { VersionDiff, BlockChange } from '../types/version.types';
import { getUserColor } from './userColorMap';

/**
 * Generate a block-level diff between two versions of document content
 * This is a simplified diff - for production, consider using a library like diff-match-patch
 */
export function generateBlockDiff(
  oldContent: string,
  newContent: string,
  oldVersionNumber: number,
  newVersionNumber: number,
  changedBy: string,
  changedByEmail: string,
  changedByName?: string
): VersionDiff {
  // Parse content as JSON (Tiptap stores content as JSON)
  let oldBlocks: any[] = [];
  let newBlocks: any[] = [];

  try {
    const oldDoc = typeof oldContent === 'string' ? JSON.parse(oldContent) : oldContent;
    const newDoc = typeof newContent === 'string' ? JSON.parse(newContent) : newContent;
    
    oldBlocks = oldDoc?.content || [];
    newBlocks = newDoc?.content || [];
  } catch (err) {
    console.error('Error parsing content for diff:', err);
    // Fallback: treat as plain text
    oldBlocks = [{ type: 'paragraph', content: [{ type: 'text', text: oldContent }] }];
    newBlocks = [{ type: 'paragraph', content: [{ type: 'text', text: newContent }] }];
  }

  const blocks: BlockChange[] = [];
  let blocksAdded = 0;
  let blocksModified = 0;
  let blocksDeleted = 0;
  const authors = new Set<string>();
  authors.add(changedBy);

  // Get user color for attribution
  const authorColor = getUserColor(changedBy);

  // Simple block-by-block comparison
  const maxLength = Math.max(oldBlocks.length, newBlocks.length);

  for (let i = 0; i < maxLength; i++) {
    const oldBlock = oldBlocks[i];
    const newBlock = newBlocks[i];

    // Extract text content from blocks
    const oldText = oldBlock ? extractBlockText(oldBlock) : null;
    const newText = newBlock ? extractBlockText(newBlock) : null;

    // Determine block type
    const blockType = getBlockType(newBlock || oldBlock);
    const blockId = `block-${i}`;

    if (oldText === newText && oldText !== null) {
      // Unchanged block
      blocks.push({
        blockId,
        blockType,
        changeType: 'unchanged',
        newContent: newText || undefined,
        authorId: changedBy,
        authorEmail: changedByEmail,
        authorName: changedByName,
        authorColor,
        position: i,
      });
    } else if (!oldText && newText) {
      // Added block
      blocks.push({
        blockId,
        blockType,
        changeType: 'added',
        newContent: newText,
        authorId: changedBy,
        authorEmail: changedByEmail,
        authorName: changedByName,
        authorColor,
        position: i,
      });
      blocksAdded++;
    } else if (oldText && !newText) {
      // Deleted block
      blocks.push({
        blockId,
        blockType,
        changeType: 'deleted',
        oldContent: oldText,
        authorId: changedBy,
        authorEmail: changedByEmail,
        authorName: changedByName,
        authorColor,
        position: i,
      });
      blocksDeleted++;
    } else {
      // Modified block
      blocks.push({
        blockId,
        blockType,
        changeType: 'modified',
        oldContent: oldText || undefined,
        newContent: newText || undefined,
        authorId: changedBy,
        authorEmail: changedByEmail,
        authorName: changedByName,
        authorColor,
        position: i,
      });
      blocksModified++;
    }
  }

  return {
    fromVersion: oldVersionNumber,
    toVersion: newVersionNumber,
    blocks,
    summary: {
      blocksAdded,
      blocksModified,
      blocksDeleted,
      totalChanges: blocksAdded + blocksModified + blocksDeleted,
      authors: Array.from(authors),
    },
  };
}

/**
 * Extract plain text from a Tiptap block node
 */
function extractBlockText(block: any): string {
  if (!block) return '';
  
  if (block.type === 'text') {
    return block.text || '';
  }

  if (block.content && Array.isArray(block.content)) {
    return block.content.map(extractBlockText).join('');
  }

  return '';
}

/**
 * Determine block type from Tiptap node
 */
function getBlockType(block: any): BlockChange['blockType'] {
  if (!block || !block.type) return 'other';

  const type = block.type.toLowerCase();

  if (type.includes('heading')) return 'heading';
  if (type.includes('list') || type === 'bulletlist' || type === 'orderedlist') return 'list';
  if (type.includes('quote')) return 'blockquote';
  if (type.includes('code')) return 'codeBlock';
  if (type.includes('table')) return 'table';
  if (type === 'paragraph') return 'paragraph';

  return 'other';
}

/**
 * Extract plain text from Tiptap JSON content for simple display
 */
export function extractPlainText(content: any): string {
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch {
      return content;
    }
  }

  if (!content || !content.content) return '';

  let text = '';

  function traverse(node: any) {
    if (node.type === 'text') {
      text += node.text;
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  content.content.forEach(traverse);
  return text;
}

/**
 * Calculate character-level changes between two text strings
 * Returns percentage of content changed
 */
export function calculateChangePercentage(oldText: string, newText: string): number {
  const maxLength = Math.max(oldText.length, newText.length);
  if (maxLength === 0) return 0;

  let differences = 0;
  for (let i = 0; i < maxLength; i++) {
    if (oldText[i] !== newText[i]) {
      differences++;
    }
  }

  return Math.round((differences / maxLength) * 100);
}