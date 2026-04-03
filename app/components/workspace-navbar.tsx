'use client';

import type { JwtPayload } from '@supabase/supabase-js';

import { Bell } from 'lucide-react';

import { AppBreadcrumbs } from '@aloha/ui/app-breadcrumbs';
import { Button } from '@aloha/ui/button';
import { Separator } from '@aloha/ui/separator';
import { SidebarTrigger } from '@aloha/ui/shadcn-sidebar';

import { OrgSelector } from '~/components/sidebar/org-selector';
import { UserProfileDropdown } from '~/components/user-profile-dropdown';

interface WorkspaceNavbarProps {
  account: string;
  accountId: string;
  accounts: Array<{ label: string | null; value: string | null; image: string | null }>;
  user: JwtPayload;
  accessLevelId: string;
}

export function WorkspaceNavbar(props: WorkspaceNavbarProps) {
  const { account, accounts, user, accessLevelId } = props;

  return (
    <header className="flex h-12 w-full shrink-0 items-center border-b bg-background px-3 gap-3">
      <div className="flex items-center gap-2 shrink-0">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground" />
        <Separator orientation="vertical" className="h-4" />
        <OrgSelector
          selectedAccount={account}
          userId={user.id ?? ''}
          accounts={accounts}
        />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <AppBreadcrumbs maxDepth={4} />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <UserProfileDropdown
          user={user}
          accountSlug={account}
          accessLevelId={accessLevelId}
        />
      </div>
    </header>
  );
}
