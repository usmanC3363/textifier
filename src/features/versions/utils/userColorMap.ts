/**
 * User color map for attribution
 * Assigns consistent colors to users across the app
 */

const USER_COLORS = [
  '#3b82f6', // blue
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

// import type { UserColorMap } from '../types/version.types';

// /**
//  * Predefined color palette for user attribution
//  * Colors are chosen to be:
//  * - Distinguishable from each other
//  * - Accessible (good contrast with text)
//  * - Pleasant to look at
//  */
// const USER_COLORS = [
//   '#93C5FD', // Blue 300
//   '#86EFAC', // Green 300
//   '#FDE047', // Yellow 300
//   '#FCA5A5', // Red 300
//   '#D8B4FE', // Purple 300
//   '#FED7AA', // Orange 300
//   '#67E8F9', // Cyan 300
//   '#FDA4AF', // Pink 300
//   '#A7F3D0', // Emerald 300
//   '#C4B5FD', // Violet 300
//   '#FEF08A', // Lime 300
//   '#F9A8D4', // Fuchsia 300
// ] as const;

// /**
//  * Generate a consistent color for a user based on their ID
//  * Same user always gets the same color
//  */
// export function getUserColor(userId: string, existingMap?: UserColorMap): string {
//   // If color already assigned, return it
//   if (existingMap && existingMap[userId]) {
//     return existingMap[userId];
//   }

//   // Generate deterministic index from userId
//   const hash = hashString(userId);
//   const colorIndex = hash % USER_COLORS.length;
  
//   return USER_COLORS[colorIndex];
// }

// /**
//  * Build a color map for all users in a document
//  */
// export function buildUserColorMap(userIds: string[]): UserColorMap {
//   const colorMap: UserColorMap = {};
  
//   userIds.forEach(userId => {
//     colorMap[userId] = getUserColor(userId, colorMap);
//   });
  
//   return colorMap;
// }

// /**
//  * Simple string hash function for deterministic color assignment
//  */
// function hashString(str: string): number {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     const char = str.charCodeAt(i);
//     hash = ((hash << 5) - hash) + char;
//     hash = hash & hash; // Convert to 32-bit integer
//   }
//   return Math.abs(hash);
// }

// /**
//  * Get a contrasting text color (black or white) for a background color
//  */
// export function getContrastColor(backgroundColor: string): string {
//   // Remove # if present
//   const hex = backgroundColor.replace('#', '');
  
//   // Convert to RGB
//   const r = parseInt(hex.substr(0, 2), 16);
//   const g = parseInt(hex.substr(2, 2), 16);
//   const b = parseInt(hex.substr(4, 2), 16);
  
//   // Calculate luminance
//   const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
//   // Return black or white based on luminance
//   return luminance > 0.5 ? '#000000' : '#FFFFFF';
// }