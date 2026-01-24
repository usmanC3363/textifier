import { Input } from '@/components/ui/input';
import { useDocumentMutations } from '@/features/documents/hooks/useDocuments';
import { useState } from 'react';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';

export function DocumentTitle() {
  const { documentId } = useDocumentContext();

  const { updateDocument } = useDocumentMutations();
  const [title, setTitle] = useState(document.title);

  const handleBlur = () => {
    if (title !== document.title) {
      updateDocument(documentId, { title });
    }
  };

  return (
    <Input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleBlur}
      className="h-9 max-w-xs border-none px-0 text-base font-medium shadow-none focus-visible:ring-0"
    />
  );
}
