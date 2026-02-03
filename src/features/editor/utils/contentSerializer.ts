import { type JSONContent } from '@tiptap/core';
import { type ContentMetadata } from '../types/editor.types';

/**
 * Serialize Tiptap JSON content to string for Firestore storage
 */
export function serializeContent(content: JSONContent): string {
  return JSON.stringify(content);
}

/**
 * Deserialize string content from Firestore to Tiptap JSON
 */
export function deserializeContent(content: string): JSONContent {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse content:', error);
    // Return empty document if parsing fails
    return {
      type: 'doc',
      content: [],
    };
  }
}

/**
 * Extract plain text from Tiptap JSON content for word counting
 */
function extractText(node: JSONContent): string {
  let text = '';

  if (node.text) {
    text += node.text;
  }

  if (node.content) {
    for (const child of node.content) {
      text += extractText(child);
    }
  }

  // Add space between block elements
  if (node.type === 'paragraph' || node.type === 'heading') {
    text += ' ';
  }

  return text;
}

/**
 * Count words and characters in Tiptap content
 */
export function getContentMetadata(content: JSONContent): ContentMetadata {
  const text = extractText(content).trim();

  // Count words (split by whitespace and filter empty strings)
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  // Count characters (excluding spaces)
  const characterCount = text.replace(/\s/g, '').length;

  return {
    wordCount,
    characterCount,
  };
}

/**
 * Validate if content is valid Tiptap JSON
 */
export function isValidContent(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' && parsed.type === 'doc';
  } catch {
    return false;
  }
}

/**
 * Create empty document structure
 */
export function createEmptyDocument(): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  };
}
