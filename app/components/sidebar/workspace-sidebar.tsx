import { Sidebar, SidebarContent } from '@aloha/ui/shadcn-sidebar';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

export function WorkspaceSidebar(props: {
  account: string;
  navigation: {
    modules: AppNavModule[];
    subModules: AppNavSubModule[];
  };
}) {
  const { account, navigation } = props;

  return (
    <Sidebar collapsible={'icon'}>
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
