import type { JwtPayload } from '@supabase/supabase-js';

import { Separator } from '@aloha/ui/separator';
import { SidebarTrigger } from '@aloha/ui/shadcn-sidebar';

import { NavbarBreadcrumbs } from '~/components/navbar-breadcrumbs';
import { UserProfileDropdown } from '~/components/user-profile-dropdown';

interface WorkspaceNavbarProps {
  account: string;
  accountId: string;
  accounts: Array<{
    label: string | null;
    value: string | null;
    image: string | null;
  }>;
  user: JwtPayload;
  accessLevelId: string;
}

export function WorkspaceNavbar(props: WorkspaceNavbarProps) {
  const { account, accounts, user, accessLevelId } = props;

  return (
    <header className="bg-background fixed top-0 z-20 flex h-12 w-full shrink-0 items-center border-b px-3">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground h-4! w-4!" />
        <Separator orientation="vertical" className="h-4" />
      </div>

      <div className="ml-2 flex flex-1 items-center">
        <NavbarBreadcrumbs
          accounts={accounts}
          userId={user.id ?? ''}
          selectedAccount={account}
        />
      </div>

      <div className="flex shrink-0 items-center">
        <UserProfileDropdown
          user={user}
          accountSlug={account}
          accessLevelId={accessLevelId}
        />
      </div>
    </header>
  );
}
