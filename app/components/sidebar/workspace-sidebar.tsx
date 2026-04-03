import { useLocation } from 'react-router';

import { Settings, Users } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@aloha/ui/shadcn-sidebar';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

export function WorkspaceSidebar(props: {
  account: string;
  navigation: {
    modules: AppNavModule[];
    subModules: AppNavSubModule[];
  };
}) {
  return (
    <SidebarContainer account={props.account} navigation={props.navigation} />
  );
}

function SidebarContainer(props: {
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
        <SidebarSeparator />
        <StaticNavigationItems account={account} />
      </SidebarContent>
    </Sidebar>
  );
}

function StaticNavigationItems({ account }: { account: string }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const items = [
    {
      label: 'Settings',
      path: `/home/${account}/settings`,
      Icon: Settings,
    },
    {
      label: 'Members',
      path: `/home/${account}/members`,
      Icon: Users,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={currentPath.startsWith(item.path)}
              >
                <a href={item.path}>
                  <item.Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
