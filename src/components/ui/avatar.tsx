import { cn } from '@/lib/utils';
import { initials, hueFor } from '@/lib/utils';

export interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 28, className }: AvatarProps) {
  return (
    <div
      className={cn('flex items-center justify-center rounded-full text-white font-sans font-bold border border-border-subtle shrink-0', className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `oklch(0.4 0.08 ${hueFor(name)})` }}
    >
      {initials(name)}
    </div>
  );
}
