import { formatDistanceToNow } from 'date-fns';
import { Clock, Copy, Pin, Edit2 } from 'lucide-react';
import type { VersionListItem as VersionItem } from '../types/version.types';
import { UserAttributionBadge } from './UserAttributionBadge';
import { getUserColor } from '../utils/userColorMap';

interface VersionListItemProps {
  version: VersionItem;
  isSelected?: boolean;
  onClick: () => void;
  onRename?: () => void;
  onPin?: () => void;
}

export function VersionListItem({
  version,
  isSelected = false,
  onClick,
  onRename,
  onPin,
}: VersionListItemProps) {
  const userColor = getUserColor(version.createdBy);
  const timeAgo = formatDistanceToNow(version.createdAt.toDate(), {
    addSuffix: true,
  });

  return (
    <div
      className={`
        group relative px-3 py-2 rounded-lg cursor-pointer transition-all
        ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
        ${version.isCurrent ? 'border border-blue-300' : ''}
      `}
      onClick={onClick}
    >
      {/* Version indicator */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {/* Version number or restored indicator */}
          <div
            className={`
              w-2 h-2 rounded-full
              ${version.isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}
            `}
          />
          <span className="font-medium text-sm text-gray-900">
            {version.displayName}
          </span>
          {version.isPinned && (
            <Pin className="w-3 h-3 text-yellow-600 fill-yellow-600" />
          )}
        </div>

        {/* Actions (shown on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Rename version"
            >
              <Edit2 className="w-3 h-3 text-gray-600" />
            </button>
          )}
          {onPin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title={version.isPinned ? 'Unpin version' : 'Pin version'}
            >
              <Pin
                className={`w-3 h-3 ${
                  version.isPinned ? 'text-yellow-600 fill-yellow-600' : 'text-gray-600'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Time and author */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Clock className="w-3 h-3" />
        <span>{timeAgo}</span>
      </div>

      {/* User badge */}
      <div className="mt-2">
        <UserAttributionBadge
          userEmail={version.createdByEmail}
          userName={version.createdByName}
          color={userColor}
          size="sm"
          showName
        />
      </div>

      {/* Restored indicator */}
      {version.isRestored && version.restoredFromVersion && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
          <Copy className="w-3 h-3" />
          <span>Copy of Version {version.restoredFromVersion}</span>
        </div>
      )}

      {/* Current version badge */}
      {version.isCurrent && (
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
            Current
          </span>
        </div>
      )}
    </div>
  );
}