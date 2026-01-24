import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useDocumentInvites } from '@/features/documents/hooks/useDocumentInvites';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';

interface InviteCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteCollaboratorDialog({
  open,
  onOpenChange,
}: InviteCollaboratorDialogProps) {
  const { documentId } = useDocumentContext();

  // ✅ hooks at top-level ONLY
  const { invite, loading, error } = useDocumentInvites();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');

  const handleInvite = async () => {
    if (!email.trim()) return;
 
  
    await invite(documentId, email, role);
  
    setEmail('');
    setRole('editor');
    onOpenChange(false);
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite collaborator</DialogTitle>
          <DialogDescription/>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant={role === 'editor' ? 'default' : 'outline'}
              onClick={() => setRole('editor')}
            >
              Editor
            </Button>
            <Button
              type="button"
              variant={role === 'viewer' ? 'default' : 'outline'}
              onClick={() => setRole('viewer')}
            >
              Viewer
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-500">
              {error.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleInvite}
            disabled={loading}
          >
            {loading ? 'Inviting...' : 'Send invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
