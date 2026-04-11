import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Sidebar,
  SidebarContent,
  SidebarGroupLabel,
  useSidebar,
} from '@aloha/ui/shadcn-sidebar';
import { cn } from '@aloha/ui/utils';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
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
      className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-7 w-7 items-center justify-center rounded-lg bg-transparent transition-colors"
    >
      <Icon className="h-[18px] w-[18px]" />
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
  const { account, navigation } = props;
  const { t } = useTranslation('common');

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
            'bg-card sticky top-0 z-10 flex items-center justify-between px-5 pt-3 pb-2',
            'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-3',
          )}
        >
          <SidebarGroupLabel className="text-muted-foreground p-0 text-[11px] font-medium tracking-wider uppercase group-data-[collapsible=icon]:hidden">
            {t('shell.sidebar.nav_section')}
          </SidebarGroupLabel>
          <NavigationCollapseButton />
        </div>
        <SidebarGroupLabel
          className={cn(
            'text-muted-foreground px-5 pt-3 pb-2 text-[11px] font-medium tracking-wider uppercase',
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
    </Sidebar>
  );
}
