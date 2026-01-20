'use client';

import { DocumentWithRole } from '@/features/documents/types/document.types';
import { DocumentCard } from './DocumentCard';

interface DocumentListProps {
  documents: DocumentWithRole[];
  onDelete?: (documentId: string) => void;
  onArchive?: (documentId: string, isArchived: boolean) => void;
  deletingIds?: Set<string>;
  loading?: boolean;
}

/**
 * DocumentList - Displays a list of documents
 * Shows empty state when no documents
 */
export function DocumentList({
  documents,
  onDelete,
  onArchive,
  deletingIds = new Set(),
  loading = false,
}: DocumentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No documents found</p>
        <p className="text-gray-400 text-sm mt-2">
          Create your first document to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDelete={onDelete}
          onArchive={onArchive}
          isDeleting={deletingIds.has(document.id)}
        />
      ))}
    </div>
  );
}
