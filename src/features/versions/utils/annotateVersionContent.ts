import type { ContentAnnotation } from '@/features/versions/types/version.types';

/**
 * Annotate changed text ranges between versions
 * Operates on flattened plain-text offsets
 */
export function annotateVersionContent(
  prevText: string,
  nextText: string,
  userId: string
): ContentAnnotation[] {
  if (!nextText || !userId) return [];

  // First version: everything is authored by creator
  if (!prevText) {
    return [
      {
        from: 0,
        to: nextText.length,
        userId,
      },
    ];
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

  // No actual change
  if (start > endNext) return [];

  return [
    {
      from: start,
      to: endNext + 1,
      userId,
    },
  ];
}
