import type { JwtPayload } from '@supabase/supabase-js';

import { PanelLeft, PanelLeftClose, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SidebarGroupLabel, useSidebar } from '@aloha/ui/shadcn-sidebar';
import { cn } from '@aloha/ui/utils';

import {
  NavbarSearch,
  type NavbarSearchItem,
} from '~/components/navbar-search';

import { WorkspaceNavbarProfileMenu } from './workspace-navbar-profile-menu';

interface WorkspaceNavbarProps {
  user: JwtPayload;
  orgName?: string | null;
  searchItems: NavbarSearchItem[];
  className?: string;
}

function NavigationCollapseButton() {
  const { toggleSidebar, state } = useSidebar();
  const Icon = state === 'collapsed' ? PanelLeft : PanelLeftClose;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      data-test="workspace-sidebar-toggle"
      aria-label="Toggle sidebar"
      className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-lg bg-transparent transition-colors"
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

function NavbarSidebarHeader() {
  const { t } = useTranslation('common');
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <div
      data-test="workspace-navbar-sidebar-header"
      className={cn(
        'border-border flex h-full shrink-0 items-center border-r',
        collapsed
          ? 'w-[4.25rem] justify-center px-3'
          : 'w-[13.75rem] justify-between px-5',
      )}
    >
      {!collapsed && (
        <SidebarGroupLabel className="text-muted-foreground p-0 text-[11px] font-medium tracking-wider uppercase">
          {t('shell.sidebar.nav_section')}
        </SidebarGroupLabel>
      )}
      <NavigationCollapseButton />
    </div>
  );
}

export function WorkspaceNavbar({
  user,
  orgName,
  searchItems,
  className,
}: WorkspaceNavbarProps) {
  return (
    <header
      data-test="workspace-navbar"
      className={cn(
        'bg-card border-border relative z-20 flex h-[72px] shrink-0 items-center border-b',
        className,
      )}
    >
      <NavbarSidebarHeader />
      <div className="flex flex-1 items-center gap-4 px-6">
        <div
          id="workspace-navbar-filter-slot"
          data-test="workspace-navbar-filter-slot"
          className="flex min-w-0 shrink-0 items-center gap-2"
        />

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <NavbarSearch
            items={searchItems}
            variant="desktop"
            renderTrigger={({ open }) => (
              <button
                type="button"
                onClick={open}
                data-test="workspace-navbar-search-trigger"
                aria-label="Open search"
                className="bg-muted text-muted-foreground/60 hover:bg-muted/80 hover:text-muted-foreground/80 flex w-full max-w-md min-w-0 items-center gap-2 rounded-2xl px-4 py-2.5 transition-colors"
              >
                <Search size={16} className="shrink-0" />
                <span className="truncate text-sm">Search...</span>
                <span className="ml-auto hidden shrink-0 items-center gap-1 font-mono text-xs lg:flex">
                  <span>/</span>
                  <span>K</span>
                </span>
              </button>
            )}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <WorkspaceNavbarProfileMenu user={user} orgName={orgName} />
        </div>
      </div>
    </header>
  );
}
