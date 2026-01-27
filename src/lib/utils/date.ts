import { Timestamp } from 'firebase/firestore';

export function formatDistanceToNow(
  date: Date | string | number | Timestamp | null | undefined
): string {
  if (!date) return 'unknown';

  const now = new Date();

  const then =
    date instanceof Timestamp
      ? date.toDate()
      : typeof date === 'string' || typeof date === 'number'
        ? new Date(date)
        : date;

  if (isNaN(then.getTime())) return 'unknown';

  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}


/**
 * Convert Firestore Timestamp or Date to JavaScript Date
 */
export function toDate(timestamp: Timestamp | Date | null | undefined): Date {
  if (!timestamp) {
    return new Date(); // Return current date if null/undefined
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
}

/**
 * Format date for display
 */
export function formatDate(timestamp: Timestamp | Date | null , options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(timestamp);
  return date.toLocaleDateString(undefined, options);
}

/**
 * Format date and time for display
 */
export function formatDateTime(timestamp: Timestamp | Date | null , options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(timestamp);
  return date.toLocaleString(undefined, options);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(timestamp: Timestamp | Date | null | undefined): string {
  const date = toDate(timestamp);
  return formatDistanceToNow(date);
}