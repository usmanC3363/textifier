import { useParams } from "react-router-dom";
import { useDocument } from "@/features/documents/hooks/useDocuments";
import DocPage from "@/components/documents/doc-page";
import { DocumentProvider } from "@/features/documents/context/DocumentProvider";
import { FileExclamationPoint, Loader2 } from "lucide-react";

export default function DocumentPage() {
  const { documentId: rawDocumentId } = useParams<{
    documentId: string;
  }>();

  // Normalize undefined → null
  const documentId = rawDocumentId ?? null;

  const { document, loading } = useDocument(documentId);

  if (loading) return <Loader2 className="animate-spin" />;
  if (!document || !documentId) return (<div className="w-screen h-screen items-center justify-center flex flex-col gap-y-4 "><FileExclamationPoint className="size-10"/><p>File not Found</p></div>)


  return (
    <DocumentProvider documentId={documentId}>
      <DocPage />
    </DocumentProvider>
  );
}
