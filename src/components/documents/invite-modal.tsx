'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { inviteCollaborator } from '@/features/documents/services/inviteCollaborator';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';

export function InviteCollaboratorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { documentId } = useDocumentContext();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!documentId || !email) return;

    setLoading(true);
    await inviteCollaborator({
      documentId,
      email,
      role: 'editor',
    });
    setLoading(false);
    setEmail('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription/>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button onClick={handleInvite} disabled={loading}>
            Send invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
