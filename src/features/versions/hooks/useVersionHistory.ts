import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { VersionListItem } from '../types/version.types';
import { getVersionHistory } from '../services/versionService';

interface UseVersionHistoryOptions {
  documentId: string;
  realtime?: boolean; // Enable real-time updates
}

export function useVersionHistory({
  documentId,
  realtime = true,
}: UseVersionHistoryOptions) {
  const [versions, setVersions] = useState<VersionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch versions (one-time)
  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const versionList = await getVersionHistory(documentId);
      setVersions(versionList);
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  // Real-time subscription
  useEffect(() => {
    if (!realtime) {
      fetchVersions();
      return;
    }

    let unsubscribe: Unsubscribe;

    try {
      const versionsRef = collection(db, `documents/${documentId}/versions`);
      const q = query(versionsRef, orderBy('versionNumber', 'desc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const currentVersion = snapshot.empty
            ? 0
            : snapshot.docs[0].data().versionNumber;

          const versionList: VersionListItem[] = snapshot.docs.map(doc => {
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

          setVersions(versionList);
          setLoading(false);
        },
        (err) => {
          console.error('Version history snapshot error:', err);
          setError(err as Error);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error setting up version history listener:', err);
      setError(err as Error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [documentId, realtime, fetchVersions]);

  // Group versions by date for display
  const groupedVersions = useCallback(() => {
    const groups: Record<string, VersionListItem[]> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      'This Month': [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    versions.forEach(version => {
      const versionDate = version.createdAt.toDate();

      if (versionDate >= today) {
        groups.Today.push(version);
      } else if (versionDate >= yesterday) {
        groups.Yesterday.push(version);
      } else if (versionDate >= weekAgo) {
        groups['This Week'].push(version);
      } else if (versionDate >= monthAgo) {
        groups['This Month'].push(version);
      } else {
        groups.Older.push(version);
      }
    });

    // Remove empty groups
    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .reduce((acc, [key, items]) => {
        acc[key] = items;
        return acc;
      }, {} as Record<string, VersionListItem[]>);
  }, [versions]);

  return {
    versions,
    groupedVersions: groupedVersions(),
    loading,
    error,
    refresh: fetchVersions,
  };
}