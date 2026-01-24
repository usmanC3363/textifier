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
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-gray-500">No documents found</p>
        <p className="mt-2 text-sm text-gray-400">
          Create your first document to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
