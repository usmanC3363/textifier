import { createContext } from 'react';

export interface DocumentContextValue {
  // WIP
  documentId: string;
  // document: Document
  // loading: boolean;
}

export const DocumentContext = createContext<DocumentContextValue | null>(null);
