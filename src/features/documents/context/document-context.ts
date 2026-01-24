import { createContext } from "react";

export interface DocumentContextValue {
  documentId: string;
}

export const DocumentContext =
  createContext<DocumentContextValue | null>(null);