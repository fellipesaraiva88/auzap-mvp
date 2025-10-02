import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className = '',
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        bg-gradient-to-br from-blue-500 to-indigo-600
        flex items-center justify-center
        text-white font-semibold
        ${className}
      `}
    >
      {fallback ? (
        <span>{fallback.substring(0, 2).toUpperCase()}</span>
      ) : (
        <User className="w-1/2 h-1/2" />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string; alt?: string; fallback?: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarGroup({
  avatars,
  max = 3,
  size = 'md',
}: AvatarGroupProps) {
  const displayedAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {displayedAvatars.map((avatar, i) => (
        <Avatar
          key={i}
          {...avatar}
          size={size}
          className="border-2 border-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${sizeClasses[size]}
            rounded-full
            bg-gray-200
            border-2 border-white
            flex items-center justify-center
            text-gray-600 font-semibold
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
