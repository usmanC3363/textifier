import { Link, useParams } from 'react-router-dom';
import { useDocument } from '@/features/documents/hooks/useDocuments';
import DocPage from '@/components/documents/doc-page';
import { DocumentProvider } from '@/features/documents/context/DocumentProvider';
import { FileExclamationPoint, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DocumentPage() {
  const { documentId: rawDocumentId } = useParams<{
    documentId: string;
  }>();
  
  const documentId = rawDocumentId ?? null;
  const { document, loading } = useDocument(documentId);

  if (loading) return <Loader2 className="animate-spin" />;
  if (!document || !documentId)
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-y-7">
        <div className="flex flex-col items-center justify-center gap-y-5">
          <FileExclamationPoint className="size-10" />
          <p>File not Found</p>
        </div>
        <Button variant={"outline"} asChild>
          <Link to="/dashboard">Back to Home</Link>
        </Button>
      </div>
    );

  return (
    <DocumentProvider documentId={documentId}>
      <DocPage />
    </DocumentProvider>
  );
}
