'use client';

import type { JwtPayload } from '@supabase/supabase-js';

import { LogOut } from 'lucide-react';

import { Avatar, AvatarFallback } from '@aloha/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@aloha/ui/dropdown-menu';
import { SubMenuModeToggle } from '@aloha/ui/mode-toggle';
import { Trans } from '@aloha/ui/trans';

import { useSignOut } from '~/lib/supabase/hooks/use-sign-out';
import { useUser } from '~/lib/supabase/hooks/use-user';

interface WorkspaceNavbarProfileMenuProps {
  user: JwtPayload;
}

export function WorkspaceNavbarProfileMenu(
  props: WorkspaceNavbarProfileMenuProps,
) {
  const signOut = useSignOut();
  const user = useUser(props.user);
  const userData = user.data ?? props.user;

  const displayName =
    userData.email ?? userData.user_metadata?.name ?? 'Account';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-test="workspace-navbar-profile-trigger"
          aria-label="Open profile menu"
          className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Avatar size="md" data-test="workspace-navbar-avatar">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel>
          <Trans i18nKey="common:signedInAs" />
          <span className="block truncate text-xs font-normal">
            {displayName}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <SubMenuModeToggle />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          data-test="workspace-navbar-sign-out"
          onClick={() => signOut.mutateAsync()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <Trans i18nKey="auth:signOut" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
