import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { UserAttributionBadge } from './UserAttributionBadge';
import { Copy, Check, X } from 'lucide-react';
import type { VersionListItem as VersionListItemType } from '../types/version.types';
import { updateVersionName } from '../services/versionService';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';

interface Props {
  version: VersionListItemType;
  onClick: () => void;
}

export function VersionListItem({ version, onClick }: Props) {
  const { documentId } = useDocumentContext(); // ✅ Get documentId from context
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
      return formatDistanceToNow(version.createdAt.toDate(), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  })();

  return (
    <div
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        hover:bg-gray-50 hover:border-gray-300
        ${version.isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
      `}
      onClick={!isEditing ? onClick : undefined}
    >
      {/* Version name - editable */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="flex-1 px-2 py-1 text-sm font-medium border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Version name"
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <h4
            className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-text flex-1"
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
          <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full font-medium">
            Current
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 mb-2">
        <UserAttributionBadge
          userId={version.createdBy}
          userEmail={version.createdByEmail}
          userName={version.createdByName}
          size="sm"
        />
        <span className="text-xs text-gray-500">{timeAgo}</span>
      </div>

      {/* Version number and restore indicator */}
      <div className="pl-1 flex items-center gap-4 text-xs text-gray-600">
        <span className="font-medium">V_{version.versionNumber}</span>
        {version.isRestored && version.restoredFromVersion && (
          <div className="flex items-center gap-0.5 text-blue-600">
            <Copy className="w-3 h-3" />
            <span>Copy of Version {version.restoredFromVersion}</span>
          </div>
        )}
      </div>
    </div>
  );
}