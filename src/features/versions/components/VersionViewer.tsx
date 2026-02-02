import { useState, useEffect } from 'react';
import { X, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVersionByNumber } from '../services/versionService';
import type { DocumentVersion } from '../types/version.types';
import { UserAttributionBadge } from './UserAttributionBadge';
import { formatDateTime } from '@/lib/utils/date';
import { RestoreDialog } from './RestoreDialog';
import { useVersionRestore } from '../hooks/useVersionRestore';

interface VersionViewerProps {
  documentId: string;
  versionNumber: number;
  isCurrent: boolean; // Is this the current version?
  onClose: () => void;
  onRestoreComplete?: () => void;
}

export function VersionViewer({
  documentId,
  versionNumber,
  isCurrent,
  onClose,
  onRestoreComplete,
}: VersionViewerProps) {
  const [version, setVersion] = useState<DocumentVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const { restoreVersion, isRestoring, error: restoreError } = useVersionRestore({
    documentId,
    onRestoreComplete,
  });

  // Fetch version content
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setLoading(true);
        setError(null);
        const versionData = await getVersionByNumber(documentId, versionNumber);
        setVersion(versionData);
      } catch (err) {
        console.error('Error fetching version:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, [documentId, versionNumber]);

  // Handle restore
  const handleRestore = async (customName?: string) => {
    try {
      await restoreVersion(versionNumber, customName);
      setShowRestoreDialog(false);
      onClose();
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  // Render content (convert Tiptap JSON to readable format)
  const renderContent = () => {
    if (!version) return null;

    try {
      // Parse Tiptap JSON
      const doc = JSON.parse(version.content);
      return <TiptapPreview doc={doc} />;
    } catch (err) {
      // Fallback: render as plain text
      return (
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap">{version.content}</pre>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading version {versionNumber}...</p>
        </div>
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load version</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error?.message || 'Version not found'}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b bg-gray-50 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Version title */}
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {version.displayName}
                </h2>
                {isCurrent && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                    Current Version
                  </span>
                )}
                {version.isRestored && (
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                    Restored from v{version.restoredFromVersion}
                  </span>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <UserAttributionBadge
                  userId={version.createdBy}
                  userEmail={version.createdByEmail}
                  userName={version.createdByName}
                  size="sm"
                  showName
                />
                <span>•</span>
                <span>{formatDateTime(version.createdAt)}</span>
                <span>•</span>
                <span>{version.wordCount} words</span>
              </div>

              {/* Description if exists */}
              {version.description && (
                <p className="mt-2 text-sm text-gray-700 italic">
                  "{version.description}"
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Restore button - disabled if current version */}
              <Button
                onClick={() => setShowRestoreDialog(true)}
                disabled={isCurrent || isRestoring}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isCurrent ? "This is already the current version" : "Restore this version"}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isCurrent ? "Current Version" : "Restore This Version"}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Current version info */}
          {isCurrent && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                This is the current version of your document. You cannot restore it because it's already active.
              </p>
            </div>
          )}

          {/* Restore error */}
          {restoreError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{restoreError.message}</p>
            </div>
          )}
        </div>

        {/* Content preview */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Restore dialog */}
      {!isCurrent && (
        <RestoreDialog
          open={showRestoreDialog}
          onOpenChange={setShowRestoreDialog}
          versionNumber={versionNumber}
          versionName={version.displayName}
          onConfirm={handleRestore}
          isRestoring={isRestoring}
        />
      )}
    </>
  );
}

/**
 * Simple Tiptap JSON preview renderer
 */
function TiptapPreview({ doc }: { doc: any }) {
  if (!doc || !doc.content) {
    return <p className="text-gray-500 italic">Empty document</p>;
  }

  return (
    <div className="prose max-w-none">
      {doc.content.map((node: any, index: number) => (
        <TiptapNode key={index} node={node} />
      ))}
    </div>
  );
}

/**
 * Render individual Tiptap nodes
 */
function TiptapNode({ node }: { node: any }) {
  if (!node) return null;

  // Text node
  if (node.type === 'text') {
    let text: any = node.text || '';
    
    // Apply marks (bold, italic, etc.)
    if (node.marks) {
      node.marks.forEach((mark: any) => {
        switch (mark.type) {
          case 'bold':
            text = <strong key="bold">{text}</strong>;
            break;
          case 'italic':
            text = <em key="italic">{text}</em>;
            break;
          case 'code':
            text = <code key="code" className="bg-gray-100 px-1 rounded">{text}</code>;
            break;
          case 'link':
            text = <a key="link" href={mark.attrs?.href} className="text-blue-600 hover:underline">{text}</a>;
            break;
          case 'strike':
            text = <s key="strike">{text}</s>;
            break;
          case 'underline':
            text = <u key="underline">{text}</u>;
            break;
        }
      });
    }
    
    return <>{text}</>;
  }

  // Block nodes
  switch (node.type) {
    case 'paragraph':
      return (
        <p>
          {node.content?.map((child: any, i: number) => (
            <TiptapNode key={i} node={child} />
          ))}
        </p>
      );

    case 'heading': {
      const level = node.attrs?.level || 1;
      const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <HeadingTag>
          {node.content?.map((child: any, i: number) => (
            <TiptapNode key={i} node={child} />
          ))}
        </HeadingTag>
      );
    }

    case 'bulletList':
      return (
        <ul className="list-disc pl-6">
          {node.content?.map((child: any, i: number) => (
            <TiptapNode key={i} node={child} />
          ))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol className="list-decimal pl-6">
          {node.content?.map((child: any, i: number) => (
            <TiptapNode key={i} node={child} />
          ))}
        </ol>
      );

    case 'listItem':
      return (
        <li>
          {node.content?.map((child: any, i: number) => (
            <TiptapNode key={i} node={child} />
          ))}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
          {node.content?.map((child: any, i: number) => (
            <TiptapNode key={i} node={child} />
          ))}
        </blockquote>
      );

    case 'codeBlock':
      return (
        <pre className="bg-gray-100 rounded p-4 overflow-x-auto my-4">
          <code>
            {node.content?.map((child: any, i: number) => (
              <TiptapNode key={i} node={child} />
            ))}
          </code>
        </pre>
      );

    case 'hardBreak':
      return <br />;

    case 'horizontalRule':
      return <hr className="my-4 border-t border-gray-300" />;

    default:
      // Fallback for unknown nodes
      return (
        <div className="my-2">
          {node.content?.map((child: any, i: number) => (
            <TiptapNode key={i} node={child} />
          ))}
        </div>
      );
  }
}