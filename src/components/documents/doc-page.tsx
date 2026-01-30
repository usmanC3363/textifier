 
import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { PermissionsSheet } from './settings-panel';
import { DocTopBar } from './topbar/doc-topbar';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';
import { useDocument } from '@/features/documents/hooks/useDocuments';
import { useDocumentAccess } from '@/features/documents/hooks/useDocumentAccess';
import { useAuth } from '@/providers/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Eye, Lock, Users } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';

export default function DocPage() {
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const { user } = useAuth();
  const { documentId } = useDocumentContext();
  const { document, loading: docLoading } = useDocument(documentId);
  const { role, isOwner, canEdit, canRead, loading: accessLoading } = useDocumentAccess(documentId);
  // const { permissions, loading: permsLoading } = useDocumentPermissions(documentId);

  // Calculate collaborator stats
  // const collaboratorStats = useMemo(() => {
  //   if (!permissions || !document) return null;

  //   const activePermissions = permissions.filter(p => !p.isPending);
  //   const editors = activePermissions.filter(p => p.role === 'editor');
  //   const viewers = activePermissions.filter(p => p.role === 'viewer');
    
  //   // Include owner
  //   const totalCollaborators = activePermissions.length + 1; // +1 for owner

  //   return {
  //     total: totalCollaborators,
  //     editors: editors.length + 1, // +1 for owner who is also an editor
  //     viewers: viewers.length,
  //     activePermissions,
  //   };
  // }, [permissions, document]);

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
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background/50">
        {/* Owner Avatar */}
        <Avatar className="h-7 w-7 ring-1 ring-primary bg-background/50 p-2 group relative">
          <AvatarFallback className="text-xs">
            {document.ownerId === user?.uid ? 'You' : (
              document.ownerEmail 
                ? document.ownerEmail.charAt(0).toUpperCase()
                : "O"
            )}
          </AvatarFallback>
          {/* <span className='absolute z-[1000] opacity-0 overflow-y-visible group-hover:opacity-100 group-hover:-translate-y-1 duration-300 ease-linear text-sm'>{document.ownerEmail}</span> */}
        </Avatar>

        {/* Active Collaborators from access map */}
        {collaboratorStats?.collaborators.slice(0, 5).map((collab, idx) => (
          <Avatar 
            key={idx}
            className={`h-7 w-7 group ${collab.email === user?.email ? 'ring-1 ring-primary ring-offset-1' : ''}`}
          >
            <AvatarFallback className="text-xs">
              {collab.email === user?.email ? 'You' : collab.email.charAt(0).toUpperCase()}
            </AvatarFallback>
            {/* <span className='absolute z-[1000] opacity-0 overflow-y-visible group-hover:opacity-100 group-hover:-translate-y-1 duration-300 ease-linear text-sm'>{document.ownerEmail}</span> */}
          </Avatar>
        ))}

        {/* Show +N if more collaborators */}
        {collaboratorStats && collaboratorStats.collaborators.length > 5 && (
          <Avatar className="h-7 w-7 bg-muted ">
            <AvatarFallback className="text-xs">
              +{collaboratorStats.collaborators.length - 5}
            </AvatarFallback>
            
          </Avatar>
        )}
      </div>

      {/* Document Metadata */}
      <div className="px-4 py-2 border-b bg-background/30 text-xs text-muted-foreground flex items-center gap-4 flex-wrap">
        <span>
          Last edited: {formatDateTime(document.updatedAt)}
        </span>
        <span>•</span>
        <span>Version {document.version}</span>
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

      {/* Editor Area */}
      <main className="flex flex-1 justify-center px-2 py-6 sm:px-4">
        <div 
          className={`w-full max-w-4xl rounded-md border bg-card shadow-sm sm:p-10 p-6 transition-opacity ${
            !canEdit ? 'opacity-75' : ''
          }`}
          style={{
            minHeight: '11in', // Standard letter size height
          }}
        >
          {/* Viewer-only overlay indicator */}
          {!canEdit && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md border border-dashed flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>You're viewing this document in read-only mode</span>
            </div>
          )}

          {/* TipTap will mount here */}
          <div className={!canEdit ? 'pointer-events-none select-text' : ''}>
            <p className="text-muted-foreground">
              {canEdit 
                ? 'Start typing your document…' 
                : 'This document is view-only for you.'}
            </p>
          </div>
        </div>
      </main>

      {/* Permissions / Settings Sheet */}
      <PermissionsSheet
        open={permissionsOpen}
        onOpenChange={setPermissionsOpen}
      />
    </section>
  );
}