'use client';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '@/components/ui/badge';
import { useDocumentPermissions } from '@/features/documents/hooks/useDocumentPermissions';
import { useDocument } from '@/features/documents/hooks/useDocuments';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';
import { useDocumentAccess } from '@/features/documents/hooks/useDocumentAccess';
import { inviteCollaborator, removeCollaborator } from '@/features/documents/services/inviteCollaborator';
import { useAuth } from '@/providers/AuthProvider';
import { useState } from 'react';
import { Loader2, Trash2, Crown, Edit, Eye, Clock, Check, XIcon } from 'lucide-react';
import { toast } from 'sonner'; // Assuming you're using sonner for toasts
import { formatDate } from '@/lib/utils/date';
import { AccessRow } from './settings/access-row';

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
  const { permissions, loading } = useDocumentPermissions(documentId);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Handle sending invite
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !user || !isOwner) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if already invited
    const alreadyInvited = permissions.some(
      (p) => p.email.toLowerCase() === inviteEmail.toLowerCase().trim()
    );
    if (alreadyInvited) {
      toast.error('This user has already been invited');
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
      toast.error('Failed to send invite. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Handle removing collaborator
  const handleRemove = async (permissionEmail: string, permissionId: string) => {
    if (!user || !isOwner) return;

    setRemovingId(permissionId);
    try {
      await removeCollaborator({
        documentId,
        email: permissionEmail,
        removedBy: user.uid,
      });

      toast.success('Collaborator removed');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    } finally {
      setRemovingId(null);
    }
  };

    // Get owner info
    const ownerInfo = document
      ? {
          id: document.ownerId,
          email: 'Owner', // You could fetch this from users collection if needed
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
                    {inviteRole === 'editor' ? <Edit className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1)}
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim() || inviting}
                  className="w-full text-[13px]"
                  variant={"outline"}
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
              People with access ({(permissions?.length || 0) + 1})
            </p>

            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Owner */}
            {ownerInfo && (
              <AccessRow
                name={ownerInfo.isYou ? `${user?.email || 'You'} (You)` : ownerInfo.email}
                role="Owner"
                roleIcon={<Crown className="h-3 w-3" />}
                isPending={false}
                canRemove={false}
              />
            )}

            {/* Collaborators */}
            {permissions?.map((perm) => (
              <AccessRow
                key={perm.id}
                name={
                  perm.email === user?.email
                    ? `${perm.email} (You)`
                    : perm.email || perm.userId || 'Unknown'
                }
                role={perm.role.charAt(0).toUpperCase() + perm.role.slice(1)}
                roleIcon={
                  perm.role === 'editor' ? (
                    <Edit className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )
                }
                isPending={perm.isPending}
                canRemove={isOwner && perm.email !== user?.email}
                onRemove={
                  isOwner && perm.email !== user?.email
                    ? () => handleRemove(perm.email, perm.id)
                    : undefined
                }
                isRemoving={removingId === perm.id}
              />
            ))}

            {!loading && permissions?.length === 0 && (
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

