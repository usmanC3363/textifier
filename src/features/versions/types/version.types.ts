import { Timestamp } from 'firebase/firestore';

/**
 * Version snapshot stored in Firestore
 */
export interface DocumentVersion {
  id: string; // Auto-generated version ID
  versionNumber: number; // Sequential: 1, 2, 3...
  documentId: string; // Parent document ID
  
  // Content
  content: string; // Tiptap JSON stringified
  contentPreview: string; // First 200 chars of plain text
  
  // Metadata
  wordCount: number;
  characterCount: number;
  
  // Authorship
  createdBy: string; // User ID
  createdByEmail: string;
  createdByName?: string; // Display name
  createdAt: Timestamp;
  
  // Restoration tracking
  isRestored: boolean; // True if this is a restored version
  restoredFromVersion?: number; // Original version number if restored
  
  // Custom naming
  displayName: string; // Auto: "Version 15" or custom: "Final Draft"
  customName?: string; // Optional user-provided name
  description?: string; // Optional change description
  
  // Pinning (prevent auto-deletion)
  isPinned: boolean;
  
  // Content Annotation 
  annotations?: ContentAnnotation[];
  contributors?: VersionContributor[];
}


export interface VersionContributor {
  userId: string;
  email?: string | null;
  name?: string | null;
  role: 'owner' | 'editor';
}

export interface ContentAnnotation {
  from: number;
  to: number;
  userId: string;
}
/**
 * Block-level change tracking for diffs
 */
export interface BlockChange {
  blockId: string; // Unique block identifier
  blockType: 'paragraph' | 'heading' | 'list' | 'blockquote' | 'codeBlock' | 'table' | 'other';
  changeType: 'added' | 'modified' | 'deleted' | 'unchanged';
  
  // Content
  oldContent?: string; // Previous text (if modified/deleted)
  newContent?: string; // Current text (if added/modified)
  
  // Attribution
  authorId: string;
  authorEmail: string;
  authorName?: string;
  authorColor: string; // Assigned color for this user
  
  // Position
  position: number; // Block index in document
}

/**
 * Version diff result (comparing two versions)
 */
export interface VersionDiff {
  fromVersion: number;
  toVersion: number;
  
  blocks: BlockChange[];
  
  summary: {
    blocksAdded: number;
    blocksModified: number;
    blocksDeleted: number;
    totalChanges: number;
    authors: string[]; // List of users who made changes
  };
}

/**
 * Version list item (for sidebar display)
 */
export interface VersionListItem {
  id: string;
  versionNumber: number;
  displayName: string;
  customName?: string;
  createdBy: string;
  createdByEmail: string;
  createdByName?: string;
  createdAt: Timestamp;
  isRestored: boolean;
  restoredFromVersion?: number;
  isPinned: boolean;
  isCurrent: boolean; // Is this the active version?
}

/**
 * User color assignment for attribution
 */
export interface UserColorMap {
  [userId: string]: string; // userId -> hex color
}