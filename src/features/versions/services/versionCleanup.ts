import {
    collection,
    query,
    orderBy,
    getDocs,
    writeBatch,
    Timestamp,
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  
  const MAX_VERSIONS = 30;
  
  /**
   * Manually trigger cleanup for a specific document
   */
  export async function cleanupDocumentVersions(
    documentId: string
  ): Promise<{ deleted: number; kept: number }> {
    try {
      const versionsRef = collection(db, `documents/${documentId}/versions`);
      const q = query(versionsRef, orderBy('versionNumber', 'desc'));
      const snapshot = await getDocs(q);
  
      if (snapshot.size <= MAX_VERSIONS) {
        return { deleted: 0, kept: snapshot.size };
      }
  
      // Identify versions to keep and delete
      const versionsToKeep = snapshot.docs.slice(0, MAX_VERSIONS);
      const versionsToDelete = snapshot.docs
        .slice(MAX_VERSIONS)
        .filter(doc => !doc.data().isPinned); // Preserve pinned versions
  
      if (versionsToDelete.length === 0) {
        return { deleted: 0, kept: snapshot.size };
      }
  
      // Batch delete
      const batch = writeBatch(db);
      versionsToDelete.forEach(doc => {
        batch.delete(doc.ref);
      });
  
      await batch.commit();
  
      return {
        deleted: versionsToDelete.length,
        kept: versionsToKeep.length,
      };
    } catch (error) {
      console.error('Error cleaning up versions:', error);
      throw error;
    }
  }
  
  /**
   * Delete all versions older than a specific date
   */
  export async function deleteVersionsOlderThan(
    documentId: string,
    cutoffDate: Date
  ): Promise<number> {
    try {
      const versionsRef = collection(db, `documents/${documentId}/versions`);
      const q = query(versionsRef);
      const snapshot = await getDocs(q);
  
      const versionsToDelete = snapshot.docs.filter(doc => {
        const data = doc.data();
        if (data.isPinned) return false; // Don't delete pinned
        
        const createdAt = data.createdAt as Timestamp;
        return createdAt.toDate() < cutoffDate;
      });
  
      if (versionsToDelete.length === 0) return 0;
  
      // Batch delete
      const batch = writeBatch(db);
      versionsToDelete.forEach(doc => {
        batch.delete(doc.ref);
      });
  
      await batch.commit();
  
      return versionsToDelete.length;
    } catch (error) {
      console.error('Error deleting old versions:', error);
      throw error;
    }
  }
  
  /**
   * Delete all unpinned versions for a document
   */
  export async function deleteAllUnpinnedVersions(
    documentId: string
  ): Promise<number> {
    try {
      const versionsRef = collection(db, `documents/${documentId}/versions`);
      const q = query(versionsRef);
      const snapshot = await getDocs(q);
  
      const versionsToDelete = snapshot.docs.filter(
        doc => !doc.data().isPinned
      );
  
      if (versionsToDelete.length === 0) return 0;
  
      // Batch delete
      const batch = writeBatch(db);
      versionsToDelete.forEach(doc => {
        batch.delete(doc.ref);
      });
  
      await batch.commit();
  
      return versionsToDelete.length;
    } catch (error) {
      console.error('Error deleting unpinned versions:', error);
      throw error;
    }
  }
  
  /**
   * Get version storage statistics for a document
   */
  export async function getVersionStats(documentId: string): Promise<{
    totalVersions: number;
    pinnedVersions: number;
    unpinnedVersions: number;
    oldestVersion: number | null;
    newestVersion: number | null;
    estimatedSizeKB: number;
  }> {
    try {
      const versionsRef = collection(db, `documents/${documentId}/versions`);
      const q = query(versionsRef, orderBy('versionNumber', 'desc'));
      const snapshot = await getDocs(q);
  
      const pinnedCount = snapshot.docs.filter(
        doc => doc.data().isPinned
      ).length;
  
      const versionNumbers = snapshot.docs.map(doc => doc.data().versionNumber);
  
      // Estimate storage (rough approximation)
      let totalSize = 0;
      snapshot.docs.forEach(doc => {
        const content = doc.data().content || '';
        totalSize += content.length;
      });
  
      return {
        totalVersions: snapshot.size,
        pinnedVersions: pinnedCount,
        unpinnedVersions: snapshot.size - pinnedCount,
        oldestVersion: versionNumbers.length > 0 ? Math.min(...versionNumbers) : null,
        newestVersion: versionNumbers.length > 0 ? Math.max(...versionNumbers) : null,
        estimatedSizeKB: Math.round(totalSize / 1024),
      };
    } catch (error) {
      console.error('Error getting version stats:', error);
      throw error;
    }
  }