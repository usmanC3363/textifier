'use client';

import { useNavigate } from 'react-router-dom';
import { type DocumentWithRole } from '@/features/documents/types/document.types';
import { formatDistanceToNow } from '@/lib/utils/date';
import { Button } from '../ui/button';

interface DocumentCardProps {
  document: DocumentWithRole;
  onDelete?: (documentId: string) => void;
  onArchive?: (documentId: string, isArchived: boolean) => void;
  isDeleting?: boolean;
}

/**
 * DocumentCard - Displays a single document in the dashboard
 * Shows document metadata and provides actions (view, delete, archive)
 */
export function DocumentCard({
  document,
  onDelete,
  onArchive,
  isDeleting = false,
}: DocumentCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/document/${document.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm('Are you sure you want to delete this document?')) {
      onDelete(document.id);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) {
      onArchive(document.id, !document.isArchived);
    }
  };

const timeAgo = formatDistanceToNow(document.updatedAt);

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow ${
        document.isArchived ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-semibold text-gray-900 truncate flex-1">
          {document.title || 'Untitled Document'}
        </h3>
        <div className="flex items-center gap-2 ml-2">
          {document.isArchived && (
            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
              Archived
            </span>
          )}
          <span
            className={`px-2 py-1 text-xs rounded ${
              document.userRole === 'owner'
                ? 'bg-blue-100 text-blue-700'
                : document.userRole === 'editor'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {document.userRole}
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        <p>Updated {timeAgo}</p>
        {document.wordCount !== undefined && (
          <p>{document.wordCount.toLocaleString()} words</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Version {document.version}
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {document.isOwner && (
            <>
              <Button
                onClick={handleArchive}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 bg-gray-200 rounded"
                disabled={isDeleting}
              >
                {document.isArchived ? 'Unarchive' : 'Archive'}
              </Button>
              <Button
                onClick={handleDelete}
                className="px-3 py-1 text-sm text-black/90 bg-red-400 rounded"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
