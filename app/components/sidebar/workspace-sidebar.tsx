import { useLocation } from 'react-router';

import type { JwtPayload } from '@supabase/supabase-js';

import { Settings, Users } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@aloha/ui/shadcn-sidebar';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
import { UserProfileDropdown } from '~/components/user-profile-dropdown';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

type AccountModel = {
  label: string | null;
  value: string | null;
  image: string | null;
};

export function WorkspaceSidebar(props: {
  account: string;
  accountId: string;
  accounts: AccountModel[];
  user: JwtPayload;
  navigation: {
    modules: AppNavModule[];
    subModules: AppNavSubModule[];
  };
  accessLevelId: string;
}) {
  return (
    <SidebarContainer
      account={props.account}
      accountId={props.accountId}
      accounts={props.accounts}
      user={props.user}
      navigation={props.navigation}
      accessLevelId={props.accessLevelId}
    />
  );
}

function SidebarContainer(props: {
  account: string;
  accountId: string;
  accounts: AccountModel[];
  user: JwtPayload;
  navigation: {
    modules: AppNavModule[];
    subModules: AppNavSubModule[];
  };
  accessLevelId: string;
}) {
  const { account, accounts, user, navigation } = props;
  const userId = user.id;

  return (
    <Sidebar collapsible={'icon'}>
      <SidebarContent className={`mt-5 h-[calc(100%-80px)] overflow-y-auto`}>
        <ModuleSidebarNavigation
          account={account}
          modules={navigation.modules}
          subModules={navigation.subModules}
        />
        <SidebarSeparator />
        <StaticNavigationItems account={account} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarContent>
          <UserProfileDropdown
            user={props.user}
            accountSlug={account}
            accessLevelId={props.accessLevelId}
            accounts={accounts}
            userId={userId}
          />
        </SidebarContent>
      </SidebarFooter>
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
