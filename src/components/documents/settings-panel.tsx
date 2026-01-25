'use client';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useDocumentPermissions } from '@/features/documents/hooks/useDocumentPermissions';
import  { useDocument } from '@/features/documents/hooks/useDocuments';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';
import { useDocumentAccess } from '@/features/documents/hooks/useDocumentAccess';

export function PermissionsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { documentId } = useDocumentContext();
  const {document}  = useDocument(documentId)
  const { canEdit, isOwner } = useDocumentAccess(document);

  const { permissions, loading } = useDocumentPermissions(documentId);
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Share & permissions</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Invite */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add people</label>
            <div className="flex gap-2">
              <Input disabled placeholder="Email address" />
              <Button disabled variant="secondary">
                Editor
              </Button>
            </div>
            <Button disabled size="sm">
              Send invite
            </Button>
          </div>
          {/* {canEdit && isOwner && <p className='text-7xl'>nigger</p>} */}
          
          <Separator />

          {/* Access list */}
          <div className="space-y-3">
            <p className="text-sm font-medium">People with access</p>

            {loading && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}

            {permissions.map((perm) => (
              <AccessRow
                key={perm.id}
                name={perm.email ?? perm.userId}
                role={
                  perm.isPending
                    ? 'Pending'
                    : perm.role.charAt(0).toUpperCase() +
                      perm.role.slice(1)
                }
              />
            ))}

          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Document settings</p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Editors can share</span>
              <input type="checkbox" disabled />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Viewers can comment</span>
              <input type="checkbox" disabled />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AccessRow({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback>
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm truncate max-w-[160px]">
          {name}
        </span>
      </div>

      <span className="text-xs text-muted-foreground">
        {role}
      </span>
    </div>
  );
}

