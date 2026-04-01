import { Link } from 'react-router';

import { cn } from '@aloha/ui/utils';

function LogoImage({ className }: { className?: string; width?: number }) {
  return (
    <span
      className={cn(
        'text-primary text-xl font-bold tracking-tight lg:text-2xl dark:text-white',
        className,
      )}
    >
      Aloha
    </span>
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string;
  className?: string;
  label?: string;
}) {
  return (
    <Link
      aria-label={label ?? 'Home Page'}
      to={href ?? '/'}
      prefetch={'viewport'}
    >
      <LogoImage className={className} />
    </Link>
  );
}
