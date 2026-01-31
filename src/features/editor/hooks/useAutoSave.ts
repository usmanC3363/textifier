import { useCallback, useRef, useState } from 'react';

export type SaveStatus = 'saving' | 'saved' | 'error';

interface Metadata {
  wordCount: number;
  characterCount: number;
}

interface UseAutoSaveOptions {
  documentId: string;
  onSave: (
    content: string,
    metadata: Metadata,
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const isSavingRef = useRef(false);

  const debouncedSave = useCallback(
    (content: string, metadata: Metadata) => {
      if (!enabled) return;

      isTypingRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        if (isSavingRef.current) return;

        try {
          isSavingRef.current = true;
          setSaveStatus('saving');

          // 🔥 DRAFT SAVE ONLY
          await onSave(content, metadata, { commit: false });

          setSaveStatus('saved');
          setLastSaved(new Date());
        } catch (err) {
          console.error('Autosave failed', err);
          setSaveStatus('error');
        } finally {
          isSavingRef.current = false;
          isTypingRef.current = false;
        }
      }, delay);
    },
    [onSave, delay, enabled]
  );

  const forceSave = useCallback(
    async (content: string, metadata: Metadata) => {
      if (!enabled) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      try {
        setSaveStatus('saving');
        await onSave(content, metadata, { commit: true }); // ✅ REAL SAVE
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (err) {
        console.error('Force save failed', err);
        setSaveStatus('error');
        throw err;
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
