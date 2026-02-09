import { useState, useEffect } from 'react';
import { X, RotateCcw, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVersionByNumber } from '../services/versionService';
import type {DocumentVersion} from '../types/version.types';
import { UserAttributionBadge } from './UserAttributionBadge';
import { formatDateTime } from '@/lib/utils/date';
import { RestoreDialog } from './RestoreDialog';
import { useVersionRestore } from '../hooks/useVersionRestore';
import { useDocumentAccess } from '@/features/documents/hooks/useDocumentAccess';
import { VersionContributors } from './version-contributors';
import { EditorContent, useEditor } from '@tiptap/react';
import { getEditorExtensions } from '@/features/editor/extensions';
import { VersionAnnotationsExtension } from '@/features/editor/extensions/VersionAnnotationExtension';

interface VersionViewerProps {
  documentId: string;
  versionNumber: number;
  isCurrent: boolean;
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

  // Create editor
  const editor = useEditor({
    editable: false,
    extensions: [
      ...getEditorExtensions(),
      VersionAnnotationsExtension.configure({
        annotations: [],
        // hoveredUserId: undefined,
      }),
    ],
    content: { type: 'doc', content: [] },
  });
  
  // Fetch version
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[VersionViewer] Fetching version:', versionNumber);
        const versionData = await getVersionByNumber(documentId, versionNumber);
        
        console.log('[VersionViewer] Version data received:', {
          versionNumber: versionData?.versionNumber,
          hasAnnotations: !!versionData?.annotations,
          annotationCount: versionData?.annotations?.length || 0,
          annotations: versionData?.annotations,
        });
        
        setVersion(versionData);
      } catch (err) {
        console.error('[VersionViewer] Error fetching version:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, [documentId, versionNumber]);

  // Update editor with content and annotations
  useEffect(() => {
    if (!editor || !version) {
      console.log('[VersionViewer] Skipping update - editor or version missing', {
        hasEditor: !!editor,
        hasVersion: !!version,
      });
      return;
    }

    try {
      console.log('[VersionViewer] Updating editor...');
      
      // 1. Parse content
      const parsedContent = JSON.parse(version.content);
      console.log('[VersionViewer] Parsed content:', parsedContent);
      
      // 2. Set content
      editor.commands.setContent(parsedContent, { emitUpdate: false });
      console.log('[VersionViewer] ✅ Content set');

      // 3. Handle annotations
      if (version.annotations && version.annotations.length > 0) {
        console.log('[VersionViewer] Processing annotations:', version.annotations);
        
        // Validate annotations
        const docSize = editor.state.doc.content.size;
        console.log('[VersionViewer] Document size:', docSize);
        
        const validAnnotations = version.annotations.filter(ann => {
          const isValid = ann.from >= 0 && 
                         ann.to <= docSize && 
                         ann.from < ann.to &&
                         ann.userId;
          
          if (!isValid) {
            console.warn('[VersionViewer] Invalid annotation:', ann, {
              from: ann.from,
              to: ann.to,
              docSize,
            });
          }
          
          return isValid;
        });
        
        console.log('[VersionViewer] Valid annotations:', validAnnotations.length, '/', version.annotations.length);
        
        if (validAnnotations.length > 0) {
          // ✅ FIX: Use the command to update annotations
          // This properly triggers the extension to rebuild decorations
          editor.commands.setAnnotations(validAnnotations);
          
          console.log('[VersionViewer] ✅ Annotations applied via command');
        } else {
          console.log('[VersionViewer] No valid annotations to apply');
        }
      } else {
        console.log('[VersionViewer] No annotations in version data');
      }
      
    } catch (err) {
      console.error('[VersionViewer] Failed to load version:', err);
    }
  }, [editor, version]);

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
          {version.contributors && version.contributors.length > 0 && (
            <div className="mb-3">
              <VersionContributors editor={editor} contributors={version.contributors} />
            </div>
          )}

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
              {/* {version.description && (
                <p className="mt-2 text-sm italic text-gray-700">
                  "{version.description}"
                </p>
              )} */}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowRestoreDialog(true)}
                disabled={isCurrent || isRestoring || role === 'viewer'}
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
                  <Pencil className="mr-1 size-4" />
                ) : (
                  <RotateCcw className="mr-1 size-4" />
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

          {isCurrent && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800">
                You cannot restore this version because it's already active.
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

        {/* Content with annotations */}
        <div className="flex-1 overflow-y-auto">
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto max-w-4xl px-6 py-8">
            {editor && <EditorContent editor={editor} />}
          </div>
        </div>
      </div>

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