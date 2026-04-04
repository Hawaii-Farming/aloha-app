import type { JwtPayload } from '@supabase/supabase-js';

import { ChevronsLeft } from 'lucide-react';

import { cn } from '@aloha/ui/utils';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from '@aloha/ui/shadcn-sidebar';

import { ModuleSidebarNavigation } from '~/components/sidebar/module-sidebar-navigation';
import { SidebarProfileMenu } from '~/components/sidebar/sidebar-profile-menu';
import type { AppNavModule, AppNavSubModule } from '~/lib/workspace/types';

interface OrgAccount {
  label: string | null;
  value: string | null;
  image: string | null;
}

function SidebarEdgeToggle() {
  const { toggleSidebar, open } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        'bg-sidebar border-sidebar-border text-muted-foreground hover:text-foreground absolute -right-3 top-4 z-30 hidden h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors md:flex',
      )}
    >
      <ChevronsLeft
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
  user: JwtPayload;
  accounts: OrgAccount[];
  accessLevelId: string;
}) {
  const { account, navigation, user, accounts, accessLevelId } = props;

  return (
    <Sidebar collapsible={'icon'}>
      <SidebarEdgeToggle />

      <SidebarContent className="mt-2 flex-1 overflow-y-auto">
        <ModuleSidebarNavigation
          account={account}
          modules={navigation.modules}
          subModules={navigation.subModules}
        />
      </SidebarContent>

      <SidebarFooter>
        <SidebarProfileMenu
          user={user}
          accountSlug={account}
          accounts={accounts}
          accessLevelId={accessLevelId}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
