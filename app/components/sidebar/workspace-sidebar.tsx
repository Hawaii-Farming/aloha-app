import { useMemo } from 'react';

import {
  ChevronLeft,
  LayoutGrid,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback } from '@aloha/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  useSidebar,
} from '@aloha/ui/shadcn-sidebar';
import { cn } from '@aloha/ui/utils';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
import { getOrgInitials } from '~/lib/workspace/get-org-initials';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

function NavigationCollapseButton() {
  const { toggleSidebar, state } = useSidebar();
  const Icon = state === 'collapsed' ? PanelLeft : PanelLeftClose;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      data-test="workspace-sidebar-toggle"
      aria-label="Toggle sidebar"
      className="border-border text-muted-foreground hover:text-foreground hover:bg-muted flex h-6 w-6 items-center justify-center rounded-md border transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
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
      <SidebarContent className="mt-2 flex-1 overflow-y-auto">
        {/*
         * Phase 10 PARITY-01: NAVIGATION + MODULES section headers with a
         * separator between them, above the module list. Both labels are
         * rendered (UI-SPEC §Surface 2 + Wave 0 e2e contract). Collapsed
         * mode hides the labels via group-data selector. The collapse
         * button lives inline in the NAVIGATION row (prototype parity).
         */}
        <div
          className={cn(
            'bg-card sticky top-0 z-10 flex items-center justify-between px-3 pt-3 pb-2',
            'group-data-[collapsible=icon]:justify-center',
          )}
        >
          <SidebarGroupLabel className="text-muted-foreground p-0 text-[11px] font-medium tracking-wider uppercase group-data-[collapsible=icon]:hidden">
            {t('shell.sidebar.nav_section')}
          </SidebarGroupLabel>
          <NavigationCollapseButton />
        </div>
        <SidebarGroupLabel
          className={cn(
            'text-muted-foreground px-3 pt-3 pb-2 text-[11px] font-medium tracking-wider uppercase',
            'group-data-[collapsible=icon]:hidden',
          )}
        >
          {t('shell.sidebar.modules_section')}
        </SidebarGroupLabel>

        <div className="flex flex-col gap-0.5">
          <ModuleSidebarNavigation
            account={account}
            modules={navigation.modules}
            subModules={navigation.subModules}
          />
        </div>
      </SidebarContent>

      {/*
       * Phase 10 PARITY-01: "Focused" footer placeholder (disabled visual).
       * CONTEXT D-14 default — no click handler, aria-disabled.
       */}
      <SidebarFooter className="border-sidebar-border border-t group-data-[collapsible=icon]:hidden">
        <div
          data-test="workspace-sidebar-profile"
          className="flex w-full items-center gap-3 px-3 py-2.5"
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
          className="text-muted-foreground flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium opacity-60"
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
