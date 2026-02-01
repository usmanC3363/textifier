import { useState, useCallback } from 'react';
import type { VersionDiff } from '../types/version.types';
import { getVersionByNumber } from '../services/versionService';
import { generateBlockDiff } from '../utils/blockDiff';

interface UseVersionDiffOptions {
  documentId: string;
}

export function useVersionDiff({ documentId }: UseVersionDiffOptions) {
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Compare two versions and generate diff
   */
  const compareVersions = useCallback(
    async (fromVersion: number, toVersion: number) => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both versions
        const [oldVer, newVer] = await Promise.all([
          getVersionByNumber(documentId, fromVersion),
          getVersionByNumber(documentId, toVersion),
        ]);

        if (!oldVer || !newVer) {
          throw new Error('One or both versions not found');
        }

        // Generate diff
        const diffResult = generateBlockDiff(
          oldVer.content,
          newVer.content,
          fromVersion,
          toVersion,
          newVer.createdBy,
          newVer.createdByEmail,
          newVer.createdByName
        );

        setDiff(diffResult);
      } catch (err) {
        console.error('Error comparing versions:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [documentId]
  );

  /**
   * Compare a version with current document
   */
  const compareWithCurrent = useCallback(
    async (versionNumber: number, currentContent: string, currentUserId: string, currentUserEmail: string) => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the old version
        const oldVersion = await getVersionByNumber(documentId, versionNumber);

        if (!oldVersion) {
          throw new Error(`Version ${versionNumber} not found`);
        }

        // Generate diff against current content
        const diffResult = generateBlockDiff(
          oldVersion.content,
          currentContent,
          versionNumber,
          -1, // -1 indicates "current" (not saved yet)
          currentUserId,
          currentUserEmail
        );

        setDiff(diffResult);
      } catch (err) {
        console.error('Error comparing with current:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [documentId]
  );

  /**
   * Clear current diff
   */
  const clearDiff = useCallback(() => {
    setDiff(null);
    setError(null);
  }, []);

  return {
    diff,
    loading,
    error,
    compareVersions,
    compareWithCurrent,
    clearDiff,
  };
}