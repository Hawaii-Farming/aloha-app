import { Menu } from 'lucide-react';

import { Avatar, AvatarFallback } from '@aloha/ui/avatar';
import { cn } from '@aloha/ui/utils';

import { AlohaLogoSquare } from './aloha-logo-square';

interface WorkspaceMobileHeaderProps {
  user: { email?: string | null };
  onOpenDrawer: () => void;
  drawerOpen: boolean;
  hamburgerRef?: React.RefObject<HTMLButtonElement | null>;
  className?: string;
}

export function WorkspaceMobileHeader({
  user,
  onOpenDrawer,
  drawerOpen,
  hamburgerRef,
  className,
}: WorkspaceMobileHeaderProps) {
  const initial = user.email?.[0]?.toUpperCase() ?? 'U';
  return (
    <header
      data-test="workspace-mobile-header"
      className={cn(
        'bg-card border-border flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden',
        className,
      )}
    >
      <button
        ref={hamburgerRef}
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open navigation menu"
        aria-expanded={drawerOpen}
        data-test="workspace-mobile-header-hamburger"
        className="text-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex flex-1 items-center gap-2">
        <AlohaLogoSquare size="sm" />
        <span className="text-foreground text-base font-semibold">Aloha</span>
      </div>

      <Avatar size="md" data-test="workspace-mobile-header-avatar">
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
    </header>
  );
}
