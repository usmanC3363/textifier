import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { DocumentVersion, VersionListItem } from '../types/version.types';
import type { ContentMetadata } from '@/features/editor/types/editor.types';

const MAX_VERSIONS = 30;

/**
 * Create a new version snapshot
 * Version numbering starts at 2 (because doc info v1 is the initial empty state)
 */
export async function createVersion(
  documentId: string,
  content: string,
  metadata: ContentMetadata,
  options?: {
    isRestored?: boolean;
    restoredFromVersion?: number;
    description?: string;
  }
): Promise<DocumentVersion> {
  try {
    // Get current version number (starts at 1 so first version is 2)
    const currentVersion = await getCurrentVersionNumber(documentId);
    const newVersionNumber = currentVersion + 1;

    console.log('[createVersion] Creating version:', newVersionNumber);

    // Extract preview (first 200 chars of plain text)
    const contentPreview = extractPreview(content);

    // Determine display name
    let displayName: string;
    if (options?.description) {
      // Custom name provided - use it
      displayName = options.description;
    } else if (options?.isRestored) {
      // ✅ FIX: Restored version uses NEW version number, not original
      // Example: Restoring v4 creates v8 → name is "Ver_8" (not "Ver_4")
      displayName = `Ver_${newVersionNumber}`;
    } else {
      // Regular auto-saved version
      displayName = `Version ${newVersionNumber}`;
    }

    function cleanUndefined<T extends Record<string, any>>(obj: T): T {
      return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
      ) as T;
    }

    if (!metadata.userId) {
      throw new Error('[createVersion] userId is required');
    }

    const safeUserEmail = metadata.userEmail || 'unknown@user';
    const safeUserName = metadata.userName || null;
    // Create version document
    const versionData = cleanUndefined({
      versionNumber: newVersionNumber,
      documentId,
      content,
      contentPreview,
      wordCount: metadata.wordCount,
      characterCount: metadata.characterCount,
      createdBy: metadata.userId,
      createdByEmail: safeUserEmail,
      createdByName: safeUserName,
      createdAt: serverTimestamp(),
      isRestored: options?.isRestored || false,
      restoredFromVersion: options?.restoredFromVersion,
      displayName,
      customName: options?.description || null, // Store custom name separately
      description: options?.description,
      isPinned: false,
    });
    
    const versionsRef = collection(db, `documents/${documentId}/versions`);
    const versionDocRef = await addDoc(versionsRef, versionData);

    // Cleanup old versions if exceeded limit
    await cleanupOldVersions(documentId);

    console.log('[createVersion] Created version:', newVersionNumber, 'with name:', displayName);

    // Return created version
    return {
      id: versionDocRef.id,
      ...versionData,
      createdAt: Timestamp.now(),
    } as DocumentVersion;
  } catch (error) {
    console.error('Error creating version:', error);
    throw error;
  }
}

/**
 * Get current version number for a document
 * Returns 1 if no versions exist (so first version will be 2)
 */
async function getCurrentVersionNumber(documentId: string): Promise<number> {
  try {
    const versionsRef = collection(db, `documents/${documentId}/versions`);
    const q = query(versionsRef, orderBy('versionNumber', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 1; // First version will be 2

    return snapshot.docs[0].data().versionNumber;
  } catch (error) {
    console.error('Error getting current version number:', error);
    throw error;
  }  
}

/**
 * Get all versions for a document
 */
export async function getVersionHistory(
  documentId: string
): Promise<VersionListItem[]> {
  try {
    const versionsRef = collection(db, `documents/${documentId}/versions`);
    const q = query(versionsRef, orderBy('versionNumber', 'desc'));
    const snapshot = await getDocs(q);

    const currentVersion = snapshot.empty ? 1 : snapshot.docs[0].data().versionNumber;

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        versionNumber: data.versionNumber,
        displayName: data.customName || data.displayName,
        customName: data.customName,
        createdBy: data.createdBy,
        createdByEmail: data.createdByEmail,
        createdByName: data.createdByName,
        createdAt: data.createdAt,
        isRestored: data.isRestored || false,
        restoredFromVersion: data.restoredFromVersion,
        isPinned: data.isPinned || false,
        isCurrent: data.versionNumber === currentVersion,
      };
    });
  } catch (error) {
    console.error('Error getting version history:', error);
    return [];
  }
}

/**
 * Get a specific version by version number
 */
export async function getVersionByNumber(
  documentId: string,
  versionNumber: number
): Promise<DocumentVersion | null> {
  try {
    const versionsRef = collection(db, `documents/${documentId}/versions`);
    const q = query(versionsRef, orderBy('versionNumber', 'desc'));
    const snapshot = await getDocs(q);

    const versionDoc = snapshot.docs.find(
      doc => doc.data().versionNumber === versionNumber
    );

    if (!versionDoc) return null;

    return {
      id: versionDoc.id,
      ...versionDoc.data(),
    } as DocumentVersion;
  } catch (error) {
    console.error('Error getting version:', error);
    return null;
  }
}

/**
 * Update version custom name (editable from list)
 */
export async function updateVersionName(
  documentId: string,
  versionId: string,
  customName: string
): Promise<void> {
  try {
    const versionRef = doc(db, `documents/${documentId}/versions/${versionId}`);
    await updateDoc(versionRef, {
      customName,
      displayName: customName, // Update display name too
    });
    console.log('[updateVersionName] Updated version name to:', customName);
  } catch (error) {
    console.error('Error updating version name:', error);
    throw error;
  }
}

/**
 * Toggle version pin status
 */
export async function toggleVersionPin(
  documentId: string,
  versionId: string,
  isPinned: boolean
): Promise<void> {
  try {
    const versionRef = doc(db, `documents/${documentId}/versions/${versionId}`);
    await updateDoc(versionRef, { isPinned });
  } catch (error) {
    console.error('Error toggling version pin:', error);
    throw error;
  }
}

/**
 * Delete a specific version
 */
export async function deleteVersion(
  documentId: string,
  versionId: string
): Promise<void> {
  try {
    const versionRef = doc(db, `documents/${documentId}/versions/${versionId}`);
    await deleteDoc(versionRef);
  } catch (error) {
    console.error('Error deleting version:', error);
    throw error;
  }
}

/**
 * Cleanup old versions (keep last 30, preserve pinned)
 */
async function cleanupOldVersions(documentId: string): Promise<void> {
  try {
    const versionsRef = collection(db, `documents/${documentId}/versions`);
    const q = query(versionsRef, orderBy('versionNumber', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.size <= MAX_VERSIONS) return;

    // Get versions to delete (oldest, unpinned)
    const versionsToDelete = snapshot.docs
      .slice(MAX_VERSIONS)
      .filter(doc => !doc.data().isPinned);

    if (versionsToDelete.length === 0) return;

    // Batch delete
    const batch = writeBatch(db);
    versionsToDelete.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${versionsToDelete.length} old versions`);
  } catch (error) {
    console.error('Error cleaning up old versions:', error);
  }
}

/**
 * Extract preview text from Tiptap JSON content
 */
function extractPreview(content: string, maxLength = 200): string {
  try {
    const doc = JSON.parse(content);
    const text = extractTextFromDoc(doc);
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  } catch (error) {
    return content.substring(0, maxLength);
  }
}

/**
 * Recursively extract text from Tiptap document
 */
function extractTextFromDoc(node: any): string {
  if (node.type === 'text') return node.text || '';
  
  if (node.content) {
    return node.content.map(extractTextFromDoc).join(' ');
  }
  
  return '';
}