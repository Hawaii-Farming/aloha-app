import type { JwtPayload } from '@supabase/supabase-js';

import { Command, PanelLeft, Search } from 'lucide-react';

import { useSidebar } from '@aloha/ui/shadcn-sidebar';
import { cn } from '@aloha/ui/utils';

import {
  NavbarSearch,
  type NavbarSearchItem,
} from '~/components/navbar-search';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

import { AlohaLogoSquare } from './aloha-logo-square';
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

export function WorkspaceNavbar({
  account,
  user,
  orgName,
  navigation,
  className,
}: WorkspaceNavbarProps) {
  const { toggleSidebar } = useSidebar();

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
        'bg-card border-border relative z-20 flex h-[72px] shrink-0 items-center gap-4 border-b px-6',
        className,
      )}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        data-test="workspace-navbar-sidebar-toggle"
        aria-label="Toggle sidebar"
        className="text-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3">
        <AlohaLogoSquare size="md" />
        <span className="text-foreground text-lg font-semibold">Aloha</span>
      </div>

      <NavbarSearch
        items={searchItems}
        renderTrigger={({ open }) => (
          <button
            type="button"
            onClick={open}
            data-test="workspace-navbar-search-trigger"
            aria-label="Open search"
            className="bg-muted text-muted-foreground hover:bg-muted/80 mx-auto flex max-w-md flex-1 items-center gap-2 rounded-2xl px-4 py-2.5 transition-colors dark:bg-slate-700"
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

      <WorkspaceNavbarProfileMenu user={user} orgName={orgName} />
    </header>
  );
}
