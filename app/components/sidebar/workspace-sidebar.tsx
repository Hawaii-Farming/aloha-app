import { PanelLeft } from 'lucide-react';

import { Sidebar, SidebarContent, useSidebar } from '@aloha/ui/shadcn-sidebar';
import { cn } from '@aloha/ui/utils';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
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
}) {
  const { account, navigation } = props;

  return (
    <Sidebar
      collapsible={'icon'}
      className="bg-card border-border border-r md:top-[72px] md:h-[calc(100svh-72px)]"
    >
      <SidebarEdgeToggle />

      <SidebarContent className="mt-2 flex-1 overflow-y-auto">
        <ModuleSidebarNavigation
          account={account}
          modules={navigation.modules}
          subModules={navigation.subModules}
        />
      </SidebarContent>
    </Sidebar>
  );
}
