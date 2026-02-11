import { Input } from '@/components/ui/input';
import { useDocument, useDocumentMutations } from '@/features/documents/hooks/useDocuments';
import {  useEffect, useState } from 'react';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';

export function DocumentTitle() {
  const { documentId } = useDocumentContext();
  const { document } = useDocument(documentId); 
  const { updateDocument } = useDocumentMutations();
  const [title, setTitle] = useState(document?.title || "");

    // ✅ Update local state when document loads/changes
    useEffect(() => {
      if (document?.title) {
        setTitle(document.title);
      }
    }, [document?.title]);
  
    const handleBlur = () => {
      if (document && title !== document.title && title.trim()) {
        updateDocument(documentId, { title: title.trim() });
      }
    };
  
  if (!document) return null;
  return (
    <Input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleBlur}
      className="h-9 max-w-xs md:text-base border-none px-0 text-base font-medium shadow-none focus-visible:ring-0"
    />
  );
}
