import { Timestamp } from 'firebase/firestore';
import type { DocumentRole } from './document.types';

export interface UserDocumentState {
  documentId: string;
  role: DocumentRole;

  invitedAt: Timestamp;
  firstOpenedAt: Timestamp | null;
  lastOpenedAt: Timestamp | null;

  isNew: boolean;
}
