import { useLocation } from 'react-router';

import type { JwtPayload } from '@supabase/supabase-js';

import { Settings, Users } from 'lucide-react';

import type {
  AppNavModule,
  AppNavSubModule,
} from '@aloha/access-control/view-contracts';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@aloha/ui/shadcn-sidebar';

import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';

import { ModuleSidebarNavigation } from './module-sidebar-navigation';
import { TeamAccountAccountsSelector } from './team-account-accounts-selector';

type AccountModel = {
  label: string | null;
  value: string | null;
  image: string | null;
};

export function TeamAccountLayoutSidebar(props: {
  account: string;
  accountId: string;
  accounts: AccountModel[];
  user: JwtPayload;
  navigation: {
    modules: AppNavModule[];
    subModules: AppNavSubModule[];
  };
}) {
  return (
    <SidebarContainer
      account={props.account}
      accountId={props.accountId}
      accounts={props.accounts}
      user={props.user}
      navigation={props.navigation}
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
}) {
  const { account, accounts, user, navigation } = props;
  const userId = user.id;

  return (
    <Sidebar collapsible={'icon'}>
      <SidebarHeader className={'h-16 justify-center'}>
        <div className={'flex items-center justify-between gap-x-3'}>
          <TeamAccountAccountsSelector
            userId={userId}
            selectedAccount={account}
            accounts={accounts}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className={`mt-5 h-[calc(100%-160px)] overflow-y-auto`}>
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
          <ProfileAccountDropdownContainer user={props.user} />
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
