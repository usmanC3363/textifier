// hooks/use-document-access.ts
import { useAuth } from '@/providers/AuthProvider';
import type { OwnableDocument } from '@/features/documents/types/document.types';

export function useDocumentAccess(doc: OwnableDocument | null) {
  const { user } = useAuth();

  if (!doc || !user) {
    return {
      loading: false,
      canRead: false,
      canEdit: false,
      canDelete: false,
      isOwner: false,
    };
  }

  const ownerId =
    doc.ownerId ?? doc.userId ?? doc.createdBy ?? null;

  const isOwner = ownerId === user.uid;

  return {
    loading: false,
    canRead: true,
    canEdit: isOwner,
    canDelete: isOwner,
    isOwner,
  };
}
