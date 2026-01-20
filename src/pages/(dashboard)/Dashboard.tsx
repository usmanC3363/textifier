'use client';

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useDocuments, useDocumentMutations } from '@/features/documents/hooks/useDocuments';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { CreateDocumentDialog } from '@/components/dashboard/CreateDocumentDialog';

/**
 * Dashboard Page - Main document management interface
 * 
 * Features:
 * - List documents user owns or has access to
 * - Create new document
 * - Delete document (owner only)
 * - Real-time updates via Firestore snapshots
 */
export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <AuthGuard onRedirect={(path) => navigate(path)}>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'owned' | 'shared' | 'archived'>('all');

  // Get documents with real-time updates
  const { documents, loading } = useDocuments({
    isArchived: filter === 'archived' ? true : filter !== 'all' ? false : undefined,
    role: filter === 'owned' ? 'owner' : filter === 'shared' ? 'editor' : undefined,
  });

  // Document mutations
  const {
    createDocument,
    deleteDocument,
    archiveDocument,
    loading: mutationLoading,
  } = useDocumentMutations();

  // Filter documents based on selected filter
  const filteredDocuments = documents.filter((doc) => {
    if (filter === 'owned') return doc.isOwner;
    if (filter === 'shared') return !doc.isOwner;
    if (filter === 'archived') return doc.isArchived;
    return true; // 'all'
  });

  const handleCreateDocument = useCallback(
    async (title: string) => {
      try {
        const documentId = await createDocument({ title });
        if (documentId) {
          // Navigate to the new document
          navigate(`/document/${documentId}`);
        }
      } catch (error) {
        console.error('Failed to create document:', error);
        throw error;
      }
    },
    [createDocument, navigate]
  );

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      setDeletingIds((prev) => new Set(prev).add(documentId));
      try {
        await deleteDocument(documentId);
      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('Failed to delete document. Please try again.');
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(documentId);
          return next;
        });
      }
    },
    [deleteDocument]
  );

  const handleArchiveDocument = useCallback(
    async (documentId: string, isArchived: boolean) => {
      try {
        await archiveDocument(documentId, isArchived);
      } catch (error) {
        console.error('Failed to archive document:', error);
        alert('Failed to archive document. Please try again.');
      }
    },
    [archiveDocument]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
            disabled={mutationLoading}
          >
            + New Document
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('owned')}
            className={`px-4 py-2 rounded-md font-medium ${
              filter === 'owned'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Owned
          </button>
          <button
            onClick={() => setFilter('shared')}
            className={`px-4 py-2 rounded-md font-medium ${
              filter === 'shared'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Shared
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-md font-medium ${
              filter === 'archived'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Document List */}
        <DocumentList
          documents={filteredDocuments}
          onDelete={handleDeleteDocument}
          onArchive={handleArchiveDocument}
          deletingIds={deletingIds}
          loading={loading}
        />

        {/* Create Document Dialog */}
        <CreateDocumentDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreate={handleCreateDocument}
          loading={mutationLoading}
        />
      </div>
    </div>
  );
}
