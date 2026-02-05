import type { ContentAnnotation } from '@/features/versions/types/version.types';

/**
 * Annotate text ranges for a version based on content diff
 * Works on flattened text offsets
 */
export function annotateVersionContent(
  prevText: string,
  nextText: string,
  userId: string
): ContentAnnotation[] {
  if (!prevText) {
    return [{
      from: 0,
      to: nextText.length,
      userId,
    }];
  }

  let start = 0;
  while (
    start < prevText.length &&
    start < nextText.length &&
    prevText[start] === nextText[start]
  ) {
    start++;
  }

  let endPrev = prevText.length - 1;
  let endNext = nextText.length - 1;

  while (
    endPrev >= start &&
    endNext >= start &&
    prevText[endPrev] === nextText[endNext]
  ) {
    endPrev--;
    endNext--;
  }

  if (start > endNext) return [];

  return [{
    from: start,
    to: endNext + 1,
    userId,
  }];
}
