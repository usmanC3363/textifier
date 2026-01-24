import { useContext } from 'react';
import { DocumentContext } from './document-context';

export function useDocumentContext() {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error(
      'useDocumentContext must be used inside a DocumentProvider'
    );
  }
  return ctx;
}
