import { useMemo } from 'react';

import { ChevronLeft, LayoutGrid, PanelLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback } from '@aloha/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarSeparator,
  useSidebar,
} from '@aloha/ui/shadcn-sidebar';
import { cn } from '@aloha/ui/utils';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
import { getOrgInitials } from '~/lib/workspace/get-org-initials';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

function SidebarEdgeToggle() {
  const { toggleSidebar, open } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      data-test="workspace-sidebar-toggle"
      className={cn(
        'bg-sidebar border-sidebar-border text-muted-foreground hover:text-foreground absolute top-4 -right-3 z-30 hidden h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors md:flex',
      )}
    >
      <PanelLeft
        className={cn(
          'h-3.5 w-3.5 transition-transform duration-200',
          !open && 'rotate-180',
        )}
      />
    </button>
  );
}

export function WorkspaceSidebar(props: {
  account: string;
  navigation: {
    modules: AppNavModule[];
    subModules: AppNavSubModule[];
  };
  orgName?: string | null;
  userEmail?: string | null;
}) {
  const { account, navigation, orgName, userEmail } = props;
  const { t } = useTranslation('common');
  const initials = useMemo(
    () => getOrgInitials(orgName, userEmail),
    [orgName, userEmail],
  );

  return (
    <Sidebar
      collapsible={'icon'}
      className="bg-card border-border border-r md:top-[72px] md:h-[calc(100svh-72px)]"
    >
      <SidebarEdgeToggle />

      <SidebarContent className="mt-2 flex-1 overflow-y-auto">
        {/*
         * Phase 10 PARITY-01: NAVIGATION + MODULES section headers with a
         * separator between them, above the module list. Both labels are
         * rendered (UI-SPEC §Surface 2 + Wave 0 e2e contract). Collapsed
         * mode hides the labels via group-data selector.
         */}
        <SidebarGroupLabel
          className={cn(
            'text-muted-foreground px-3 pt-3 pb-2 text-xs font-semibold tracking-wider uppercase',
            'group-data-[collapsible=icon]:hidden',
          )}
        >
          {t('shell.sidebar.nav_section')}
        </SidebarGroupLabel>
        <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:hidden" />
        <SidebarGroupLabel
          className={cn(
            'text-muted-foreground px-3 pt-3 pb-2 text-xs font-semibold tracking-wider uppercase',
            'group-data-[collapsible=icon]:hidden',
          )}
        >
          {t('shell.sidebar.modules_section')}
        </SidebarGroupLabel>

        <ModuleSidebarNavigation
          account={account}
          modules={navigation.modules}
          subModules={navigation.subModules}
        />
      </SidebarContent>

      {/*
       * Phase 10 PARITY-01: "Focused" footer placeholder (disabled visual).
       * CONTEXT D-14 default — no click handler, aria-disabled.
       */}
      <SidebarFooter className="border-sidebar-border border-t group-data-[collapsible=icon]:hidden">
        <div
          data-test="workspace-sidebar-profile"
          className="flex w-full items-center gap-2 px-3 py-2"
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-muted text-foreground text-xs font-semibold dark:bg-slate-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-foreground flex-1 truncate text-xs font-medium">
            {orgName ?? 'Aloha'}
          </span>
        </div>
        <button
          type="button"
          aria-disabled="true"
          tabIndex={-1}
          className="text-muted-foreground flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-xs font-medium opacity-60"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="flex-1 text-left">
            {t('shell.sidebar.focused_footer')}
          </span>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
