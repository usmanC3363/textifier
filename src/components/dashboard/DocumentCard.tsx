 

import { useNavigate } from 'react-router-dom';
import { type DocumentWithRole } from '@/features/documents/types/document.types';
import { formatDistanceToNow } from '@/lib/utils/date';
import { Button } from '../ui/button';
import { VersionContributors } from '@/features/versions/components/version-contributors';

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
    if (
      onDelete &&
      window.confirm('Are you sure you want to delete this document?')
    ) {
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
      className={`cursor-pointer border-muted-foreground/35 border rounded-lg lg:w-96 bg-white p-6 shadow-md transition-shadow hover:shadow-lg ${
        document.isArchived ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="flex-1 truncate text-[22px] font-bold text-gray-900">
          {document.title || 'Untitled Document'}
        </h3>
        <div className="ml-2 flex items-center gap-2">
          {document.isArchived && (
            <span className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600">
              Archived
            </span>
          )}
          <span
            className={`rounded px-2.5 py-[2px] text-xs ${
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

      <div className="mb-5 text-sm text-gray-500">
        <p>Updated {timeAgo}</p>
        {document.wordCount !== undefined && (
          <p>{document.wordCount.toLocaleString()} words</p>
        )}
      </div>
      <div className="mb-2.5 text-sm text-gray-500">
      <VersionContributors
        contributors={document.latestVersionContributors ?? []}
        variant="compact"
        maxVisible={3}
       />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">Version {document.version}</div>
      

        <div className="flex gap-x-3" onClick={(e) => e.stopPropagation()}>
          {document.isOwner && (
            <>
              <Button
                onClick={handleArchive}
                className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                disabled={isDeleting}
              >
                {document.isArchived ? 'Unarchive' : 'Archive'}
              </Button>
              <Button
                onClick={handleDelete}
                className="rounded bg-red-400 px-3 py-1 text-sm text-black/90"
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
