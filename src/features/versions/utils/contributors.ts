export interface Contributor {
    userId: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    // role?: 'editor' | 'restorer';
  }
  
export function dedupeContributors(
contributors: Contributor[]
): Contributor[] {
const map = new Map<string, Contributor>();

for (const c of contributors) {
    if (!map.has(c.userId)) {
    map.set(c.userId, c);
    }
}

return Array.from(map.values());
}
