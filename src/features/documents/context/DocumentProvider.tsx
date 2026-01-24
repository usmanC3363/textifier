import { DocumentContext } from "./document-context";

export function DocumentProvider({
  documentId,
  children,
}: {
  documentId: string;
  children: React.ReactNode;
}) {
  return (
    <DocumentContext.Provider value={{ documentId }}>
      {children}
    </DocumentContext.Provider>
  );
}
