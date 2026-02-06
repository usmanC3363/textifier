
/**
 * Extract preview text from Tiptap JSON content
 */
export function extractPreview(
  jsonString: string,
  maxLength = 200
): string {
  try {
    const doc = JSON.parse(jsonString);

    let text = '';

    function walk(node: any) {
      if (text.length >= maxLength) return;

      if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      }

      if (Array.isArray(node.content)) {
        node.content.forEach(walk);
      }
    }

    walk(doc);

    return text.trim().slice(0, maxLength);
  } catch {
    return '';
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