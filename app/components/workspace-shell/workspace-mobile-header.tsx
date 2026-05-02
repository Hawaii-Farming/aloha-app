import type { JwtPayload } from '@supabase/supabase-js';

import { Menu, Search } from 'lucide-react';

import { cn } from '@aloha/ui/utils';

import {
  NavbarSearch,
  type NavbarSearchItem,
} from '~/components/navbar-search';

import { WorkspaceNavbarProfileMenu } from './workspace-navbar-profile-menu';

interface WorkspaceMobileHeaderProps {
  user: JwtPayload;
  orgName?: string | null;
  searchItems: NavbarSearchItem[];
  onOpenDrawer: () => void;
  drawerOpen: boolean;
  hamburgerRef?: React.RefObject<HTMLButtonElement | null>;
  className?: string;
}

export function WorkspaceMobileHeader({
  user,
  orgName,
  searchItems,
  onOpenDrawer,
  drawerOpen,
  hamburgerRef,
  className,
}: WorkspaceMobileHeaderProps) {
  return (
    <header
      data-test="workspace-mobile-header"
      className={cn(
        'bg-card border-border relative z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden',
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

      <div
        id="workspace-mobile-header-filter-slot"
        data-test="workspace-mobile-header-filter-slot"
        className="flex min-w-0 flex-1 items-center gap-2"
      />

      <div className="flex shrink-0 items-center gap-2">
        <NavbarSearch
          items={searchItems}
          variant="mobile"
          renderTrigger={({ open }) => (
            <button
              type="button"
              onClick={open}
              aria-label="Open search"
              data-test="workspace-mobile-header-search-trigger"
              className="text-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          )}
        />
        <WorkspaceNavbarProfileMenu user={user} orgName={orgName} />
      </div>
    </header>
  );
}
