import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getUserColor, getInitials } from '../utils/userColorMap';
import type { VersionContributor } from '@/features/versions/types/version.types';
import type { Editor } from '@tiptap/core';

type Variant = 'default' | 'compact';

interface VersionContributorsProps {
  contributors: VersionContributor[];
  editor?: Editor;
  variant?: Variant;
  maxVisible?: number; // 🔥 useful for dashboard cards
}

export function VersionContributors({
  contributors,
  editor,
  variant = 'default',
  maxVisible,
}: VersionContributorsProps) {
  const visible = maxVisible
    ? contributors.slice(0, maxVisible)
    : contributors;

  const remaining =
    maxVisible && contributors.length > maxVisible
      ? contributors.length - maxVisible
      : 0;

  return (
    <div
      className={
        variant === 'compact'
          ? 'flex items-center -space-x-2'
          : 'flex items-center gap-2 flex-wrap'
      }
    >
      {visible.map(c => {
        const color = getUserColor(c.userId);

        return (
          <div
            key={c.userId}
            onMouseEnter={() =>
              variant === 'default' &&
              editor?.commands.setHoveredUser(c.userId)
            }
            onMouseLeave={() =>
              variant === 'default' &&
              editor?.commands.setHoveredUser(null)
            }
            className={
              variant === 'default'
                ? 'flex items-center gap-2 rounded-full px-2 py-1 text-xs cursor-pointer'
                : 'relative group group-hover:translate-x-20'
            }
            style={
              variant === 'default'
                ? { backgroundColor: `${color}22` }
                : undefined
            }
          >
            <Avatar className={variant === 'compact' ? 'size-7 group flex gap-x-3 group-hover:pr-[11.25vw] items-center group-hover:w-20 border transition-all duration-300 ease-in-out' : 'size-6'}
             style={{
              backgroundColor: color,
            }}>
              <AvatarFallback
                style={{
                  backgroundColor: color,
                  color: 'white',
                }}
                className='size-7'
              >
                <span 
                className={`${variant === 'compact'
                              ? 'text-xs text-center group-hover:font-medium tracking-wide transition-all duration-150 ease-linear group-hover:text-sm size-7 group-hover:mt-2 group-hover:ml-2.5 mt-3 '
                              : '-mt-1'
                            }`}
                style={{
                  backgroundColor: color,
                }}>
                {getInitials(c.name ?? c.email ?? '')}
                </span>
              </AvatarFallback>
              {variant === 'compact' && (
                <span className='opacity-0 justify-self-end text-white -mt-px scale-0 group-hover:opacity-100 transition-all duration-150 ease-linear text-[13px] group-hover:scale-100 z-50 delay-75'
                style={{
                  backgroundColor: color,
                  transformOrigin: "right center",
                }}>{c.email}</span>
              )}
            </Avatar>

            {variant === 'default' && (
              <span>{c.name ?? c.email}</span>
            )}
          </div>
        );
      })}

      {remaining > 0 && variant === 'compact' && (
        <div className="h-6 w-6 rounded-full bg-muted text-xs flex items-center justify-center border">
          +{remaining}
        </div>
      )}
    </div>
  );
}
