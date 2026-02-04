import { useCallback, useRef, useState } from 'react';
import type { ContentMetadata } from '../types/editor.types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  documentId: string;
  onSave: (
    content: string,
    metadata: ContentMetadata,
    options: { commit: boolean }
  ) => Promise<void>;
  delay?: number;
  enabled?: boolean;
  initialContent?: string;
}

export function useAutoSave({
  documentId,
  onSave,
  delay = 2500,
  enabled = true,
  initialContent,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>(initialContent ?? '');
  const isTypingRef = useRef<boolean>(false);
  const isDirtyRef = useRef<boolean>(false);
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef<string>(initialContent ?? '');
  const latestMetadataRef = useRef<ContentMetadata | null>(null);
  

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const cancelPendingSave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const debouncedSave = useCallback(
    (content: string, metadata: ContentMetadata) => {
      if (!enabled) return;
      if (content === lastSavedContentRef.current) return;
  
      isDirtyRef.current = true;
      isTypingRef.current = true;
      setSaveStatus('saving');
      latestContentRef.current = content;
      latestMetadataRef.current = metadata;

  
      // persistence debounce
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
  
      timeoutRef.current = setTimeout(async () => {
        try {
          await onSave(content, metadata, { commit: false });
          lastSavedContentRef.current = content;
          setLastSaved(new Date());
          setSaveStatus('saved');
        } catch {
          setSaveStatus('error');
        }
      }, delay);
  
      // ✅ version commit debounce (LONGER)
      if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);
  
      commitTimeoutRef.current = setTimeout(async () => {
        if (!isDirtyRef.current) return;
        if (!latestMetadataRef.current) return;
      
        await onSave(
          latestContentRef.current,
          latestMetadataRef.current,
          { commit: true }
        );
      
        isDirtyRef.current = false;
      }, delay * 1.75); // recommend longer than draft debounce
      
    },
    [onSave, delay, enabled]
  );
  

  const forceSave = useCallback(
    async (content: string, metadata: ContentMetadata) => {
      if (!enabled) return;
      if (!isDirtyRef.current) return;
      try {
        setSaveStatus('saving');
        await onSave(content, metadata, { commit: true });

        lastSavedContentRef.current = content;
        isDirtyRef.current = false;
        setLastSaved(new Date());
        setSaveStatus('saved');
      } catch (err) {
        console.error('[AutoSave] Force save error:', err);
        setSaveStatus('error');
      }
    },
    [onSave, enabled]
  );

  return {
    saveStatus,
    lastSaved,
    debouncedSave,
    forceSave,
    isTypingRef,
    cancelPendingSave,
    isDirtyRef, //optional
  };
}
