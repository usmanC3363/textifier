import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { PermissionsSheet } from './settings-panel';
import { DocTopBar } from './topbar/doc-topbar';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';
import { useDocument } from '@/features/documents/hooks/useDocuments';
import { useDocumentAccess } from '@/features/documents/hooks/useDocumentAccess';
import { useAuth } from '@/providers/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Eye, Lock, Users, X } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';
import { DocumentEditor } from './doument-editor';
import { Button } from '../ui/button';
import { VersionHistoryPanel } from '@/features/versions/components/VersionHistoryPanel';
import { VersionContributors } from '@/features/versions/components/version-contributors';
import { getUserColor } from '@/features/versions/utils/userColorMap';
import { getVersionByNumber } from '@/features/versions/services/versionService';

export default function DocPage() {
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const { user } = useAuth();
  const { documentId } = useDocumentContext();
  const { document, loading: docLoading } = useDocument(documentId);
  const { role, isOwner, canEdit, canRead, loading: accessLoading } = useDocumentAccess(documentId);
  const [showVersions, setShowVersions] = useState(false);

  const collaboratorStats = useMemo(() => {
    if (!document) return null;
  
    const accessMap = document.access || {};
    const accessEmails = Object.keys(accessMap);
    
    // Count editors and viewers from access map
    let editors = 1; // Owner is always an editor
    let viewers = 0;
    
    accessEmails.forEach(email => {
      if (accessMap[email] === 'editor') {
        editors++;
      } else if (accessMap[email] === 'viewer') {
        viewers++;
      }
    });
  
    const totalCollaborators = 1 + accessEmails.length; // owner + shared users
  
    // Create array of collaborators for avatars
    const collaborators = accessEmails.map(email => ({
      email,
      role: accessMap[email],
    }));
  
    return {
      total: totalCollaborators,
      editors,
      viewers,
      collaborators,
    };
  }, [document]);

  const sortedCollaborators = useMemo(() => {
    if (!collaboratorStats) return [];
  
    return [...collaboratorStats.collaborators].sort((a, b) => {
      if (a.role === 'viewer' && b.role !== 'viewer') return 1;
      if (a.role !== 'viewer' && b.role === 'viewer') return -1;
      return 0;
    });
  }, [collaboratorStats]);  

  // Get user's role display
  const roleDisplay = useMemo(() => {
    if (isOwner) return { text: 'Owner', variant: 'default' as const, icon: Lock };
    if (role === 'editor') return { text: 'Editor', variant: 'secondary' as const, icon: Users };
    if (role === 'viewer') return { text: 'Viewer', variant: 'outline' as const, icon: Eye };
    return null;
  }, [role, isOwner]);

  // Loading state
  if (docLoading || accessLoading) {
    return (
      <section className="flex min-h-screen flex-col bg-muted/40">
        <div className="flex items-center justify-center flex-1">
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </section>
    );
  }

  // No access
  if (!canRead || !document) {
    return (
      <section className="flex min-h-screen flex-col bg-muted/40">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-2">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium">No access</p>
            <p className="text-sm text-muted-foreground">
              You don't have permission to view this document
            </p>
          </div>
        </div>
      </section>
    );
  }

  const RoleIcon = roleDisplay?.icon;

  return (
    <section className="flex min-h-screen flex-col bg-muted/40">
      {/* Top Bar */}
      <DocTopBar onOpenPermissions={() => setPermissionsOpen(true)} />

      {/* Document Info Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          {/* Left: Role Badge */}
          <div className="flex items-center gap-3">
            {roleDisplay && (
              <Badge variant={roleDisplay.variant} className="gap-1.5">
                {RoleIcon && <RoleIcon className="h-3 w-3" />}
                {roleDisplay.text}
              </Badge>
            )}
            
            {!canEdit && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Eye className="h-3 w-3" />
                View only
              </span>
            )}
          </div>

          {/* Right: Collaborators Info */}
          {collaboratorStats && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {collaboratorStats.total} {collaboratorStats.total === 1 ? 'person' : 'people'}
              </span>
              <span>
                {collaboratorStats.editors} {collaboratorStats.editors === 1 ? 'editor' : 'editors'}
              </span>
              {collaboratorStats.viewers > 0 && (
                <span>
                  {collaboratorStats.viewers} {collaboratorStats.viewers === 1 ? 'viewer' : 'viewers'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collaborators Avatars */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/50">
        <div className="flex items-center gap-2">
          {/* Owner Avatar */}
          {collaboratorStats?.collaborators.map((collab) => (
            <Avatar className="h-7 w-7 ring-1 ring-yellow-500 p-px" key={collab.email} 
            style={{
                backgroundColor: 
                collab.role === "viewer"
                ? undefined
                : getUserColor(collab.email),
              }}
              >
              <AvatarFallback className="text-xs">
                {document.ownerId === user?.uid ? 'You' : (
                  document.ownerEmail 
                    ? document.ownerEmail.charAt(0).toUpperCase()
                    : "O"
                )}
              </AvatarFallback>
            </Avatar>
          ))}

          {/* Active Collaborators from access map */}
          {collaboratorStats?.collaborators.slice(0, 5).map((collab, idx) => (
            <Avatar 
              key={idx}
              className={`h-7 w-7 ${collab.email === user?.email ? 'ring-1 ring-primary ring-offset-1' : ''}`}
            >
              <AvatarFallback className="text-xs">
                {collab.email === user?.email ? 'You' : collab.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}

          {/* Show +N if more collaborators */}
          {collaboratorStats && collaboratorStats.collaborators.length > 5 && (
            <Avatar className="h-7 w-7 bg-muted">
              <AvatarFallback className="text-xs">
                +{collaboratorStats.collaborators.length - 5}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <Button 
          variant="outline" 
          onClick={() => setShowVersions(v => !v)}
          className="gap-2"
        >
          {showVersions && <X className="h-4 w-4" />}
          {showVersions ? 'Hide Version History' : 'Version History'}
        </Button>
      </div>

      {/* Document Metadata */}
      <div className="px-4 py-2 border-b bg-background/30 text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
        <span>
          Last edited: {formatDateTime(document.updatedAt)}
        </span>
        <span>•</span>
        {/* Note: document.version is the Firestore document version (different from version history) */}
        <span>Document v{document.version}</span>
        {document.wordCount !== undefined && (
          <>
            <span>•</span>
            <span>{document.wordCount} words</span>
          </>
        )}
        {document.characterCount !== undefined && (
          <>
            <span>•</span>
            <span>{document.characterCount} characters</span>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto px-2 py-6 sm:px-4">
          <DocumentEditor documentId={documentId} />
        </div>

        {/* Version History Panel (slides in from right) */}
        {showVersions && (
          <VersionHistoryPanel
            documentId={documentId}
            onClose={() => setShowVersions(false)}
          />
        )}
      </main>

      {/* Permissions / Settings Sheet */}
      <PermissionsSheet
        open={permissionsOpen}
        onOpenChange={setPermissionsOpen}
      />
    </section>
  );
}