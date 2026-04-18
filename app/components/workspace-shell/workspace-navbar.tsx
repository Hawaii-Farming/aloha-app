import type { JwtPayload } from '@supabase/supabase-js';

import { Command, PanelLeft, PanelLeftClose, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SidebarGroupLabel, useSidebar } from '@aloha/ui/shadcn-sidebar';
import { cn } from '@aloha/ui/utils';

import {
  NavbarSearch,
  type NavbarSearchItem,
} from '~/components/navbar-search';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

import { WorkspaceNavbarProfileMenu } from './workspace-navbar-profile-menu';

interface WorkspaceNavbarProps {
  account: string;
  user: JwtPayload;
  orgName?: string | null;
  navigation: {
    modules: AppNavModule[];
    subModules: AppNavSubModule[];
  };
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
  account,
  user,
  orgName,
  navigation,
  className,
}: WorkspaceNavbarProps) {
  const searchItems: NavbarSearchItem[] = [
    ...navigation.modules.map((mod) => ({
      path: `/home/${account}/${mod.module_slug}`,
      label: mod.display_name,
      group: 'Modules',
    })),
    ...navigation.subModules.map((sm) => ({
      path: `/home/${account}/${sm.module_slug}/${sm.sub_module_slug}`,
      label: sm.display_name,
      group: 'Pages',
    })),
  ];

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
          className="flex shrink-0 items-center gap-2"
        />
        <NavbarSearch
          items={searchItems}
          renderTrigger={({ open }) => (
            <button
              type="button"
              onClick={open}
              data-test="workspace-navbar-search-trigger"
              aria-label="Open search"
              className="bg-muted text-muted-foreground/60 hover:bg-muted/80 hover:text-muted-foreground/80 mx-auto flex max-w-md flex-1 items-center gap-2 rounded-2xl px-4 py-2.5 transition-colors dark:bg-slate-700"
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

        <div
          id="workspace-navbar-action-slot"
          data-test="workspace-navbar-action-slot"
          className="flex shrink-0 items-center gap-2"
        />

        <WorkspaceNavbarProfileMenu user={user} orgName={orgName} />
      </div>
    </header>
  );
}
