import { useState, useEffect } from 'react';
import { X, RotateCcw, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVersionByNumber } from '../services/versionService';
import type { DocumentVersion } from '../types/version.types';
import { UserAttributionBadge } from './UserAttributionBadge';
import { formatDateTime } from '@/lib/utils/date';
import { RestoreDialog } from './RestoreDialog';
import { useVersionRestore } from '../hooks/useVersionRestore';
import { useDocumentAccess } from '@/features/documents/hooks/useDocumentAccess';

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
  const { role } = useDocumentAccess(documentId || null);

  const {
    restoreVersion,
    isRestoring,
    error: restoreError,
  } = useVersionRestore({
    documentId,
    onRestoreComplete,
    role,
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

  // Loading
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">
            Loading version {versionNumber}...
          </p>
        </div>
      </div>
    );
  }

  // Error or if version not found

  if (error || !version) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold">Failed to load version</h3>
          <p className="mb-4 text-sm text-gray-600">
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
      <div className="flex flex-1 flex-col bg-white">
        {/* Header */}
        <div className="border-b bg-gray-50 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Version title */}
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {version.displayName}
                </h2>
                {isCurrent && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Current Version
                  </span>
                )}
                {version.isRestored && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
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
                <p className="mt-2 text-sm italic text-gray-700">
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
                size={'sm'}
                className="bg-blue-500 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  isCurrent
                    ? 'This is already the current version'
                    : role === 'viewer'
                      ? 'You dont have access to perform this action'
                      : 'Restore this version'
                }
              >
                {role === 'viewer' ? (
                  <Pencil className="mr-1" />
                ) : (
                  <RotateCcw className="mr-1" />
                )}
                {isCurrent
                  ? 'Current Version'
                  : role === 'viewer'
                    ? 'Request Access'
                    : 'Restore This Version'}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Current version info */}
          {isCurrent && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800">
                This is the current version of your document. You cannot restore
                it because it's already active.
              </p>
            </div>
          )}

          {/* Restore error */}
          {restoreError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-800">{restoreError.message}</p>
            </div>
          )}
        </div>

        {/* Content preview */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">{renderContent()}</div>
        </div>
      </div>

      {/* Restore dialog */}
      {/* WIP: replace to ask for access to edit */}
      {!isCurrent && role !== 'viewer' && (
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
    return <p className="italic text-gray-500">Empty document</p>;
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
            text = (
              <code key="code" className="rounded bg-gray-100 px-1">
                {text}
              </code>
            );
            break;
          case 'link':
            text = (
              <a
                key="link"
                href={mark.attrs?.href}
                className="text-blue-600 hover:underline"
              >
                {text}
              </a>
            );
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
        <blockquote className="my-4 border-l-4 border-gray-300 pl-4 italic">
          {node.content?.map((child: any, i: number) => (
            <TiptapNode key={i} node={child} />
          ))}
        </blockquote>
      );

    case 'codeBlock':
      return (
        <pre className="my-4 overflow-x-auto rounded bg-gray-100 p-4">
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
