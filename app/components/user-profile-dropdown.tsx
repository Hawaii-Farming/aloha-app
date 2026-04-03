'use client';

import { JwtPayload } from '@supabase/supabase-js';

import { LogOut, Settings } from 'lucide-react';

import { Avatar, AvatarFallback } from '@aloha/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@aloha/ui/dropdown-menu';
import { Trans } from '@aloha/ui/trans';

import { useSignOut } from '~/lib/supabase/hooks/use-sign-out';
import { useUser } from '~/lib/supabase/hooks/use-user';


export function UserProfileDropdown(props: {
  user?: JwtPayload | null;
  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };
  accountSlug?: string;
  accessLevelId?: string;
}) {
  const signOut = useSignOut();
  const user = useUser(props.user);
  const userData = user.data ?? props.user ?? null;
  if (!userData) {
    return null;
  }

  const displayName =
    userData.email ?? userData.user_metadata?.name ?? 'Account';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <Trans i18nKey={'common:signedInAs'} />
          <span className="block truncate text-xs font-normal">
            {displayName}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {props.accountSlug ? (
          <>
            <DropdownMenuItem asChild>
              <a href={`/home/${props.accountSlug}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                <Trans i18nKey={'teams:settings.pageTitle'}>Settings</Trans>
              </a>
            </DropdownMenuItem>

          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => signOut.mutateAsync()}>
          <LogOut className="mr-2 h-4 w-4" />
          <Trans i18nKey={'auth:signOut'} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
