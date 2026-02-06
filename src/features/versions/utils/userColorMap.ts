/**
 * User color map for attribution
 * Assigns consistent colors to users across the app
 */

const USER_COLORS = [
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

// Cache for user -> color mapping
const colorCache = new Map<string, string>();

/**
 * Get a consistent color for a user ID
 */
export function getUserColor(userId?: string | null): string {
  // fallback color if userId missing
  if (!userId) {
    return '#9ca3af'; // gray-400
  }

  if (colorCache.has(userId)) {
    return colorCache.get(userId)!;
  }

  const hash = hashString(userId);
  const colorIndex = hash % USER_COLORS.length;
  const color = USER_COLORS[colorIndex];

  colorCache.set(userId, color);
  return color;
}


/**
 * Simple string hash function
 */
function hashString(str?: string | null): number {
  if (!str) return 0;

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}


/**
 * Get initials from a name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name || name.trim() === '') return '?';

  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Clear the color cache (useful for testing)
 */
export function clearColorCache(): void {
  colorCache.clear();
}
