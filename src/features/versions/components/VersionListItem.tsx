import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { UserAttributionBadge } from './UserAttributionBadge';
import { Copy, Check, X } from 'lucide-react';
import type { VersionListItem as VersionListItemType } from '../types/version.types';
import { updateVersionName } from '../services/versionService';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';
import { useDocumentAccess } from '@/features/documents/hooks/useDocumentAccess';
import { Button } from '@/components/ui/button';

interface Props {
  version: VersionListItemType;
  onClick: () => void;
}

export function VersionListItem({ version, onClick }: Props) {
  const { documentId } = useDocumentContext(); // ✅ Get documentId from context
  const { role } = useDocumentAccess(documentId);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(version.displayName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when version changes
  useEffect(() => {
    setEditValue(version.displayName);
  }, [version.displayName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle save
  const handleSave = async () => {
    if (!documentId) {
      console.error('No documentId available');
      setIsEditing(false);
      return;
    }

    if (editValue.trim() === '' || editValue === version.displayName) {
      setIsEditing(false);
      setEditValue(version.displayName);
      return;
    }

    try {
      setIsSaving(true);
      await updateVersionName(documentId, version.id, editValue.trim());
      setIsEditing(false);
      console.log('[VersionListItem] Name updated successfully');
    } catch (err) {
      console.error('[VersionListItem] Error saving version name:', err);
      setEditValue(version.displayName); // Revert on error
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditValue(version.displayName);
    setIsEditing(false);
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Format time
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(version.createdAt.toDate(), {
        addSuffix: true,
      });
    } catch {
      return 'Recently';
    }
  })();

  return (
    <div
      className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-gray-300 hover:bg-gray-50 ${version.isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} `}
      onClick={!isEditing ? onClick : undefined}
    >
      {/* Version name - editable */}
      <div className="mb-2 flex items-center justify-between gap-2">
        {isEditing ? (
          <div
            className="flex flex-1 items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving || role === 'viewer'}
              className="flex-1 rounded border border-blue-500 px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Version name"
            />
            {role !== 'viewer' && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-40"
                title="Save"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              className={`${role === 'viewer' && 'w-8 items-center justify-center'} rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50`}
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <h4
            className="flex-1 cursor-text text-sm font-medium text-gray-900 hover:text-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Click to edit name"
          >
            {version.displayName}
          </h4>
        )}

        {version.isCurrent && (
          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
            Current
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="mb-2 flex items-center gap-2">
        <UserAttributionBadge
          userId={version.createdBy}
          userEmail={version.createdByEmail}
          userName={version.createdByName}
          size="sm"
        />
        <span className="text-xs text-gray-500">{timeAgo}</span>
      </div>

      {/* Version number and restore indicator */}
      <div className="flex items-center gap-4 pl-1 text-xs text-gray-600">
        <span className="font-medium">V_{version.versionNumber}</span>
        {version.isRestored && version.restoredFromVersion && (
          <div className="flex items-center gap-1.5 text-blue-600">
            <Copy className="h-3 w-3" />
            <span>Copy of Version {version.restoredFromVersion}</span>
          </div>
        )}
      </div>
    </div>
  );
}
