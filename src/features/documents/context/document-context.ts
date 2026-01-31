import { createContext } from 'react';
// import type { Document } from '../types/document.types';

export interface DocumentContextValue {
  // WIP
  documentId: string;
  // document: Document
  // role: "owner" | "viewer" | "editor";
  // loading: boolean;
}

export const DocumentContext = createContext<DocumentContextValue | null>(null);
