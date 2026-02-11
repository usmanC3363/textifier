import { getUserColor, getInitials } from '../utils/userColorMap';

interface UserAttributionBadgeProps {
  userId: string;
  userEmail: string;
  userName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function UserAttributionBadge({
  userId,
  userEmail,
  userName,
  size = 'md',
  showName = false,
}: UserAttributionBadgeProps) {
  const color = getUserColor(userId);
  const initials = getInitials(userName || userEmail || 'unknown');
  const displayName = userName || userEmail;

  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  return (
    <div className="flex items-center gap-2">
      {/* Avatar circle */}
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full font-medium text-white`}
        style={{ backgroundColor: color }}
        title={displayName}
      >
        {initials}
      </div>

      {/* Optional name */}
      {showName && (
        <span className="text-sm font-medium text-gray-700">{displayName}</span>
      )}
    </div>
  );
}
