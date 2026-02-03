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
}

export function useAutoSave({
  documentId,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const isTypingRef = useRef<boolean>(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const debouncedSave = useCallback(
    (content: string, metadata: ContentMetadata) => {
      if (!enabled) return;

      isTypingRef.current = true;
      setSaveStatus('saving');

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          if (content === lastSavedContentRef.current) {
            setSaveStatus('saved');
            return;
          }

          await onSave(content, metadata, { commit: false });

          lastSavedContentRef.current = content;
          setLastSaved(new Date());
          setSaveStatus('saved');
        } catch (err) {
          console.error('[AutoSave] Error:', err);
          setSaveStatus('error');
        } finally {
          isTypingRef.current = false;
        }
      }, delay);
    },
    [onSave, delay, enabled]
  );

  const forceSave = useCallback(
    async (content: string, metadata: ContentMetadata) => {
      if (!enabled) return;

      try {
        setSaveStatus('saving');
        await onSave(content, metadata, { commit: true });

        lastSavedContentRef.current = content;
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
  };
}
