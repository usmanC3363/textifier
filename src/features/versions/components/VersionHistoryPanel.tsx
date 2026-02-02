import { useState } from 'react';
import { useVersionHistory } from '../hooks/useVersionHistory';
import { VersionListItem } from './VersionListItem';
import { VersionViewer } from './VersionViewer';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  documentId: string;
  onClose?: () => void;
}

export function VersionHistoryPanel({ documentId, onClose }: Props) {
  const { groupedVersions, loading, versions } = useVersionHistory({ 
    documentId,
    realtime: true 
  });

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  // Find if selected version is current
  const selectedVersionData = versions.find(v => v.versionNumber === selectedVersion);
  const isSelectedCurrent = selectedVersionData?.isCurrent || false;

  // Handle version selection
  const handleSelectVersion = (versionNumber: number) => {
    setSelectedVersion(versionNumber);
  };

  // Handle closing viewer
  const handleCloseViewer = () => {
    setSelectedVersion(null);
  };

  // Handle restore complete
  const handleRestoreComplete = () => {
    setSelectedVersion(null);
    // Optionally close the entire panel
    // onClose?.();
  };

  if (loading) {
    return (
      <aside className="w-80 border-l bg-white">
        <div className="p-4 text-sm text-gray-500">Loading versions…</div>
      </aside>
    );
  }

  // If a version is selected, show the viewer instead of the list
  if (selectedVersion !== null) {
    return (
      <div className="flex-1 flex">
        <VersionViewer
          documentId={documentId}
          versionNumber={selectedVersion}
          isCurrent={isSelectedCurrent}
          onClose={handleCloseViewer}
          onRestoreComplete={handleRestoreComplete}
        />
      </div>
    );
  }

  // Show version list
  return (
    <aside className="w-80 border-l bg-white overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="font-semibold text-gray-900">Version History</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedVersions).length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No version history yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Versions are created automatically as you edit
            </p>
          </div>
        ) : (
          Object.entries(groupedVersions).map(([group, versions]) => (
            <div key={group} className="p-3">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">
                {group}
              </h4>

              <div className="space-y-1">
                {versions.map(v => (
                  <VersionListItem
                    key={v.versionNumber}
                    version={v}
                    onClick={() => handleSelectVersion(v.versionNumber)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}