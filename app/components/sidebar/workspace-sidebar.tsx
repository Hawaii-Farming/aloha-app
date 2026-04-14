import { Sidebar, SidebarContent } from '@aloha/ui/shadcn-sidebar';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

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

  return (
    <Sidebar
      collapsible={'icon'}
      className="bg-card border-border border-r md:top-[72px] md:h-[calc(100svh-72px)]"
    >
      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-0.5 pt-3">
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
