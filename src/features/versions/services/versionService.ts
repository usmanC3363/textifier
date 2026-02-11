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
  FieldValue,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { DocumentVersion, VersionContributor, VersionListItem } from '../types/version.types';
import type { ContentMetadata } from '@/features/editor/types/editor.types';
import { annotateVersionContent } from '../utils/annotateVersionContent';
import { extractPlainTextFromJSON, extractPreview } from '../utils/contentText';
import { dedupeContributors } from '../utils/contributors';

const MAX_VERSIONS = 30;

type DocumentVersionWrite =
  Omit<DocumentVersion, 'id' | 'createdAt'> & {
    createdAt: FieldValue;
  };

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
  if (!metadata.userId) {
    throw new Error('[createVersion] userId is required');
  }

  /** STEP 1: version number */
  const currentVersion = await getCurrentVersionNumber(documentId);
  const newVersionNumber = currentVersion + 1;

  /** STEP 2: previous version */
  const prevVersion = await getLatestVersion(documentId);

  /** STEP 3: plain text */
  const nextPlainText = extractPlainTextFromJSON(content);
  const prevPlainText = prevVersion
    ? extractPlainTextFromJSON(prevVersion.content)
    : '';

  /** STEP 4: annotations */
  const prevAnnotations = prevVersion?.annotations ?? [];

  const newAnnotations = annotateVersionContent(
    prevPlainText,
    nextPlainText,
    metadata.userId
  );

  const mergedAnnotations = [
    ...prevAnnotations.filter(a => a.to <= nextPlainText.length),
    ...newAnnotations,
  ];

  /** STEP 5: contributors (CORRECT, KEEP THIS) */
  const contributors: VersionContributor[] = dedupeContributors([
    ...(prevVersion?.contributors ?? []),
    {
      userId: metadata.userId,
      email: metadata.userEmail ?? null,
      name: metadata.userName ?? null,
      role: options?.isRestored ? 'owner' : 'editor',
    },
  ]);

  /** STEP 6: preview + naming */
  const contentPreview = extractPreview(content);

  const displayName =
    options?.description ?? `Version ${newVersionNumber}`;

  /** STEP 7: build version payload */
  const versionData: DocumentVersionWrite = {
    versionNumber: newVersionNumber,
    documentId,
    content,
    contentPreview,
    wordCount: metadata.wordCount,
    characterCount: metadata.characterCount,
    createdBy: metadata.userId,
    createdByEmail: metadata.userEmail || 'unknown@user',
    createdByName: metadata.userName || undefined,
    createdAt: serverTimestamp(),
    isRestored: Boolean(options?.isRestored),
    displayName,
    isPinned: false,
    contributors, // 🔥 ALWAYS STORE CONTRIBUTORS
  };

  if (mergedAnnotations.length > 0) {
    versionData.annotations = mergedAnnotations;
  }

  if (options?.restoredFromVersion !== undefined) {
    versionData.restoredFromVersion = options.restoredFromVersion;
  }

  if (options?.description) {
    versionData.customName = options.description;
    versionData.description = options.description;
  }

  /** STEP 8: write version */
  const versionsRef = collection(db, `documents/${documentId}/versions`);
  const versionDocRef = await addDoc(versionsRef, versionData);

  /** STEP 9: 🔥 SNAPSHOT CONTRIBUTORS ON DOCUMENT */
  const documentRef = doc(db, 'documents', documentId);

  await updateDoc(documentRef, {
    version: newVersionNumber,
    latestVersionContributors: contributors,
    updatedAt: serverTimestamp(),
    lastEditedBy: metadata.userId,
  });

  /** STEP 10: cleanup (non-blocking) */
  cleanupOldVersions(documentId).catch(err => {
    console.warn('[cleanupOldVersions] Non-blocking error:', err);
  });

  return {
    id: versionDocRef.id,
    ...versionData,
    createdAt: Timestamp.now(),
  } satisfies DocumentVersion;
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

    if (snapshot.empty) return [];

    const latestVersionNumber =
      snapshot.docs[0]?.data()?.versionNumber ?? null;

    return snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: doc.id,
        versionNumber: data.versionNumber,
        displayName: data.customName || data.displayName || `Version ${data.versionNumber}`,
        customName: data.customName ?? null,
        createdBy: data.createdBy,
        createdByEmail: data.createdByEmail,
        createdByName: data.createdByName,
        createdAt: data.createdAt,
        isRestored: Boolean(data.isRestored),
        restoredFromVersion: data.restoredFromVersion ?? null,
        isPinned: Boolean(data.isPinned),
        isCurrent:
          latestVersionNumber !== null &&
          data.versionNumber === latestVersionNumber,
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
  const versionsRef = collection(db, `documents/${documentId}/versions`);
  const q = query(versionsRef, orderBy('versionNumber', 'desc'));
  const snapshot = await getDocs(q);

  if (snapshot.size <= MAX_VERSIONS) return;

  const unpinned = snapshot.docs.filter(d => !d.data().isPinned);

  const toDelete = unpinned.slice(MAX_VERSIONS);

  if (toDelete.length === 0) return;

  const batch = writeBatch(db);
  toDelete.forEach(doc => batch.delete(doc.ref));

  await batch.commit();
}

async function getLatestVersion(
  documentId: string
): Promise<DocumentVersion | null> {
  const versionsRef = collection(db, `documents/${documentId}/versions`);
  const q = query(versionsRef, orderBy('versionNumber', 'desc'), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as DocumentVersion;
}

export async function snapshotLatestContributors(
  documentId: string,
  versionNumber: number,
  contributors: VersionContributor[]
) {
  const documentRef = doc(db, 'documents', documentId);

  await updateDoc(documentRef, {
    version: versionNumber,
    latestVersionContributors: contributors,
    updatedAt: serverTimestamp(),
  });
}
