import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inviteCollaborator } from "@/features/documents/services/inviteCollaborator";
import { useDocumentContext } from "@/features/documents/context/useDocumentContext";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function InviteCollaboratorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { documentId } = useDocumentContext();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!documentId || !user || !email) return;

    setLoading(true);
    await inviteCollaborator({
      documentId,
      email,
      role,
      invitedBy: user.uid,
    });
    setLoading(false);

    setEmail("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite collaborator</DialogTitle>
          <DialogDescription/>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>

          <Button onClick={handleInvite} disabled={loading}>
            Send invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
