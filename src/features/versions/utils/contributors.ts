import type { VersionContributor } from "../types/version.types";

  
export function dedupeContributors(
contributors: VersionContributor[]
): VersionContributor[] {
const map = new Map<string, VersionContributor>();

for (const c of contributors) {
    if (!map.has(c.userId)) {
    map.set(c.userId, c);
    }
}

return Array.from(map.values());
}
