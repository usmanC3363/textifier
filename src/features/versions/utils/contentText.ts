
/**
 * Extract preview text from Tiptap JSON content
 */
export function extractPreview(content: string, maxLength = 200): string {
  try {
    const doc = JSON.parse(content);
    const text = extractTextFromDoc(doc);
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  } catch (error) {
    return content.substring(0, maxLength);
  }
}

/**
 * Recursively extract text from Tiptap document
 */
export function extractTextFromDoc(node: any): string {
  if (node.type === 'text') return node.text || '';
  
  if (node.content) {
    return node.content.map(extractTextFromDoc).join(' ');
  }
  
  return '';
}

export function extractPlainTextFromJSON(content: string): string {
  try {
    const doc = JSON.parse(content);
    return extractTextFromDoc(doc);
  } catch {
    return '';
  }
}