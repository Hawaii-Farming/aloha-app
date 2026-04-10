import { Command, Search } from 'lucide-react';

import { Avatar, AvatarFallback } from '@aloha/ui/avatar';
import { cn } from '@aloha/ui/utils';

import { NavbarSearch } from '~/components/navbar-search';

import { AlohaLogoSquare } from './aloha-logo-square';

interface WorkspaceNavbarProps {
  user: { email?: string | null };
  className?: string;
}

export function WorkspaceNavbar({ user, className }: WorkspaceNavbarProps) {
  const initial = user.email?.[0]?.toUpperCase() ?? 'U';
  return (
    <header
      data-test="workspace-navbar"
      className={cn(
        'bg-card border-border flex h-[72px] shrink-0 items-center gap-4 border-b px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <AlohaLogoSquare size="md" />
        <span className="text-foreground text-lg font-semibold">Aloha</span>
      </div>

      <NavbarSearch
        renderTrigger={({ open }) => (
          <button
            type="button"
            onClick={open}
            data-test="workspace-navbar-search-trigger"
            aria-label="Open search"
            className="bg-muted text-muted-foreground hover:bg-muted/80 mx-auto flex max-w-md flex-1 items-center gap-2 rounded-2xl px-4 py-2.5 transition-colors"
          >
            <Search size={16} />
            <span className="text-sm">Search...</span>
            <span className="ml-auto flex items-center gap-1 text-xs">
              <Command size={12} />
              <span>K</span>
            </span>
          </button>
        )}
      />

      <Avatar size="md" data-test="workspace-navbar-avatar">
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
    </header>
  );
}
