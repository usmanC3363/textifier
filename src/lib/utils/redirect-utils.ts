// src/lib/utils/redirect.ts

/**
 * Store intended destination before redirecting to login
 */
export function setIntendedRedirect(path: string) {
    sessionStorage.setItem('intendedRedirect', path);
  }
  
  /**
   * Get and clear intended redirect
   */
  export function getAndClearIntendedRedirect(): string | null {
    const redirect = sessionStorage.getItem('intendedRedirect');
    if (redirect) {
      sessionStorage.removeItem('intendedRedirect');
      return redirect;
    }
    return null;
  }
  
  /**
   * Check if path is a document URL and extract document ID
   */
  export function extractDocumentId(path: string): string | null {
    const match = path.match(/\/document\/([^/]+)/);
    return match ? match[1] : null;
  }