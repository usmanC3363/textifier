import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getUserColor, getInitials } from '../utils/userColorMap';
import type { VersionContributor } from '@/features/versions/types/version.types';

export function VersionContributors({
  contributors,
}: {
  contributors: VersionContributor[];
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {contributors.map(c => (
        <div
          key={c.userId}
          className="flex items-center gap-2 rounded-full px-2 py-1 text-xs"
          style={{
            backgroundColor: `${getUserColor(c.userId)}22`,
          }}
        >
          <Avatar className="h-5 w-5">
            <AvatarFallback
              style={{
                backgroundColor: getUserColor(c.userId),
                color: 'white',
              }}
            >
              {getInitials(c.name ?? c.email ?? '')}
            </AvatarFallback>
          </Avatar>
          <span>{c.name ?? c.email}</span>
        </div>
      ))}
    </div>
  );
}
