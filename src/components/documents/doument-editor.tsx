import { TiptapEditor } from '@/features/editor/components/TiptapEditor';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { updateDocumentContent } from '@/lib/firestore/mutations/documentContentMutations';
import { type ContentMetadata, type SaveStatus } from '@/features/editor/types/editor.types';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useDocument } from '@/features/documents/hooks/useDocuments';
import { useDocumentAccess } from '@/features/documents/hooks/useDocumentAccess';

interface DocumentEditorProps {
  documentId: string;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const { document, loading } = useDocument(documentId);
  const { role } = useDocumentAccess(documentId);
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Document not found</p>
      </div>
    );
  }

  const isReadOnly = role === 'viewer';

  const handleSave = async (
    content: string,
    metadata: ContentMetadata,
    options: { commit: boolean }
  ) => {
    if (!user || isReadOnly) return;
  
    await updateDocumentContent(
      documentId,
      content,
      {
        id: user.uid,
        email: user.email,
        name: user.displayName,
      },
      metadata,
      options
    );
  };
  

  return (
    <TiptapEditor
      documentId={documentId}
      initialContent={document.content || ''}
      user={
        user
          ? {
              id: user.uid,
              email: user.email,
              name: user.displayName,
            }
          : null
      }
      isReadOnly={isReadOnly}
      onSave={handleSave}
      onStatusChange={setSaveStatus}
      placeholder="Start writing your document..."
    />
  );
}