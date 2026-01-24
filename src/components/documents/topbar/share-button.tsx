import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InviteCollaboratorDialog } from '../invite-modal';
import { useDocumentContext } from '@/features/documents/context/useDocumentContext';

export function ShareButton() {
  const { documentId } = useDocumentContext();

  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!documentId}
        onClick={() => setOpen(true)}
      >
        Share
      </Button>

      <InviteCollaboratorDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
