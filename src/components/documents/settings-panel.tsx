'use client';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useDocument } from '@/features/documents/hooks/useDocuments';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';
import { useDocumentAccess } from '@/features/documents/hooks/useDocumentAccess';
import { 
  inviteCollaborator, 
  removeCollaborator,
  emailToKey,
  keyToEmail 
} from '@/features/documents/services/inviteCollaborator';
import { useAuth } from '@/providers/AuthProvider';
import { useState, useMemo, useEffect } from 'react';
import { Loader2, Crown, Edit, Eye, Copy, Check} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/date';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AccessRow } from './settings/access-row';

interface Collaborator {
  email: string;
  role: 'editor' | 'viewer';
  isPending: boolean;
}

export function PermissionsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const { documentId } = useDocumentContext();
  const { document } = useDocument(documentId);
  const { canEdit, isOwner } = useDocumentAccess(documentId);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pendingEmails, setPendingEmails] = useState<Map<string, boolean>>(new Map());

  // Fetch pending invites - map email to pending status
  useEffect(() => {
    if (!documentId) return;

    const fetchPendingInvites = async () => {
      try {
        const invitesQuery = query(
          collection(db, 'invites'),
          where('documentId', '==', documentId)
        );
        
        const snapshot = await getDocs(invitesQuery);
        const pendingMap = new Map<string, boolean>();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const emailKey = emailToKey(data.email); // Convert to same format as access map
          pendingMap.set(emailKey, data.isPending === true);
        });
        
        console.log('Pending invites map:', pendingMap);
        setPendingEmails(pendingMap);
      } catch (error) {
        console.error('Error fetching pending invites:', error);
      }
    };

    fetchPendingInvites();
  }, [documentId, document?.access]); // Re-fetch when access changes

  // Get collaborators from document.access map
  const collaborators = useMemo(() => {
    if (!document?.access) return [];
    
    const collabs: Collaborator[] = [];
    
    Object.entries(document.access).forEach(([key, role]) => {
      // Skip if key looks like a user ID (invalid data)
      if (key.length > 20 && !key.includes('_')) {
        console.warn('Skipping invalid access key (looks like user ID):', key);
        return;
      }
      
      // Ensure role is a string and valid
      const validRole = typeof role === 'string' && (role === 'editor' || role === 'viewer') 
        ? role 
        : 'viewer';
      
      // Convert key back to email for display
      const email = keyToEmail(key);
      
      // Check if this email has a pending invite
      const isPending = pendingEmails.get(key) === true;
      
      console.log('Collaborator:', { key, email, role: validRole, isPending });
      
      collabs.push({
        email,
        role: validRole as 'editor' | 'viewer',
        isPending,
      });
    });
    
    return collabs;
  }, [document?.access, pendingEmails]);

  // Generate shareable link
  const shareableLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/document/${documentId}`;
  }, [documentId]);

  // Handle copying link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Handle sending invite
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !user || !isOwner) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if already has access
    const normalizedEmail = inviteEmail.toLowerCase().trim();
    const emailKey = emailToKey(normalizedEmail);
    
    const alreadyHasAccess = collaborators.some(
      (c) => emailToKey(c.email.toLowerCase()) === emailKey
    );
    
    if (alreadyHasAccess) {
      toast.error('This user already has access');
      return;
    }

    setInviting(true);
    try {
      await inviteCollaborator({
        documentId,
        email: inviteEmail.trim(),
        role: inviteRole,
        invitedBy: user.uid,
      });

      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invite';
      toast.error(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  // Handle removing collaborator
  const handleRemove = async (email: string) => {
    if (!user || !isOwner) return;

    setRemovingEmail(email);
    try {
      await removeCollaborator({
        documentId,
        email,
        removedBy: user.uid,
      });

      toast.success('Collaborator removed');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    } finally {
      setRemovingEmail(null);
    }
  };

  // Get owner info
  const ownerInfo = document
    ? {
        id: document.ownerId,
        email: document.ownerEmail || 'Owner',
        isYou: document.ownerId === user?.uid,
      }
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Share & permissions</SheetTitle>
          <SheetDescription>
            Manage who has access to this document
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Share Link Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share link</label>
            <div className="flex gap-2">
              <Input
                value={shareableLink}
                readOnly
                className="text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link and invited access can view this document
            </p>
          </div>

          <Separator />

          {/* Invite Section - Only for owners */}
          {isOwner && (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium">Add people</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendInvite();
                    }}
                    disabled={inviting}
                  />
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setInviteRole(inviteRole === 'editor' ? 'viewer' : 'editor')
                    }
                    disabled={inviting}
                  >
                    {inviteRole === 'editor' ? (
                      <Edit className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1)}
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim() || inviting}
                  className="w-full text-[13px]"
                  variant="outline"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send invite'
                  )}
                </Button>
              </div>

              <Separator />
            </>
          )}

          {/* Access list */}
          <div className="space-y-3">
            <p className="text-sm font-medium">
              People with access ({collaborators.length + 1})
            </p>

            {/* Owner */}
            {ownerInfo && (
              <AccessRow
                name={
                  ownerInfo.isYou
                    ? `${user?.email || 'You'} (You)`
                    : ownerInfo.email
                }
                role="Owner"
                roleIcon={<Crown className="h-3 w-3" />}
                isPending={false}
                canRemove={false}
              />
            )}

            {/* Collaborators from access map */}
            {collaborators.map((collab) => {
              // Safe role formatting
              const roleDisplay = typeof collab.role === 'string' 
                ? collab.role.charAt(0).toUpperCase() + collab.role.slice(1)
                : 'Viewer';
                
              return (
                <AccessRow
                  key={collab.email}
                  name={
                    collab.email === user?.email
                      ? `${collab.email} (You)`
                      : collab.email
                  }
                  role={roleDisplay}
                  roleIcon={
                    collab.role === 'editor' ? (
                      <Edit className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )
                  }
                  isPending={collab.isPending}
                  canRemove={isOwner && collab.email !== user?.email}
                  onRemove={
                    isOwner && collab.email !== user?.email
                      ? () => handleRemove(collab.email)
                      : undefined
                  }
                  isRemoving={removingEmail === collab.email}
                />
              );
            })}

            {collaborators.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No collaborators yet. {isOwner && 'Invite someone to get started!'}
              </p>
            )}
          </div>

          <Separator />

          {/* Document Settings - Future Implementation */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Document settings</p>

            <div className="space-y-2 opacity-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Editors can share</span>
                <input type="checkbox" disabled />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Viewers can comment</span>
                <input type="checkbox" disabled />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Notify on changes</span>
                <input type="checkbox" disabled />
              </div>
            </div>
          </div>

          <Separator />

          {/* Document Info */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Document Information</p>
            {document && (
              <>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{formatDate(document.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last modified:</span>
                  <span>{formatDate(document.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span>{document.version}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

