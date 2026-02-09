import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getUserColor, getInitials } from '../utils/userColorMap';
import type { VersionContributor } from '@/features/versions/types/version.types';
import type { Editor } from '@tiptap/core';

export function VersionContributors({
  contributors,
  editor
}: {
  contributors: VersionContributor[];
  editor: Editor;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {contributors.map(c => (
        <div
          key={c.userId}
          onMouseEnter={() =>
            editor.commands.setHoveredUser(c.userId)
          }
          onMouseLeave={() =>
            editor.commands.setHoveredUser(null)
          }
          className="flex items-center gap-2 rounded-full px-2 py-1 text-xs cursor-pointer"
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
