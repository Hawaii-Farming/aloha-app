import { cn } from '@aloha/ui/utils';

interface AlohaLogoSquareProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function AlohaLogoSquare({
  size = 'md',
  className,
}: AlohaLogoSquareProps = {}) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  return (
    <div
      className={cn(
        sizeClasses,
        'flex items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25',
        className,
      )}
      aria-hidden="true"
    >
      <span className="text-sm font-bold text-white">A</span>
    </div>
  );
}
