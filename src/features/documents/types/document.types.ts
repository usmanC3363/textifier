import { Timestamp } from 'firebase/firestore';

/**
 * Document role/permission type
 */
export type DocumentRole = 'owner' | 'editor' | 'viewer';

/**
 * Document metadata (matches Firestore schema)
 */
export interface Document {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  lastEditedBy: string | null;
  version: number;
  isArchived: boolean;
  wordCount?: number;
  characterCount?: number;
  access?: Record<string, DocumentRole>; // ADD THIS LINE - email to role mapping
}


/**
 * Document with user's role information
 */
export interface DocumentWithRole extends Document {
  userRole: DocumentRole;
  isOwner: boolean;
}

// permissions.types.ts
export interface OwnableDocument {
  userId?: string;
  ownerId?: string;
  createdBy?: string;
}


/**
 * Document permission entry
 */
export interface DocumentPermission {
  id: string;
  userId: string | null;
  email: string;
  role: DocumentRole;
  grantedBy: string;
  grantedAt: Timestamp | Date;
  isPending: boolean;
}

/**
 * Create document input
 */
export interface CreateDocumentInput {
  title: string;
  content?: string;
}

/**
 * Update document input
 */
export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  isArchived?: boolean;
}

/**
 * Document list filter options
 */
export interface DocumentFilter {
  isArchived?: boolean;
  role?: DocumentRole;
  searchQuery?: string;
}
