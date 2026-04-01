'use client';

import { JwtPayload } from '@supabase/supabase-js';

import { LogOut, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useSignOut } from '@aloha/supabase/hooks/use-sign-out';
import { useUser } from '@aloha/supabase/hooks/use-user';
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

import featuresFlagConfig from '~/config/feature-flags.config';

export function ProfileAccountDropdownContainer(props: {
  user?: JwtPayload | null;
  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };
}) {
  const signOut = useSignOut();
  const user = useUser(props.user);
  const userData = user.data ?? props.user ?? null;
  const { setTheme, theme } = useTheme();

  if (!userData) {
    return null;
  }

  const displayName =
    userData.email ?? userData.user_metadata?.name ?? 'Account';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm group-data-[minimized=true]:hidden">
            {displayName}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <Trans i18nKey={'common:signedInAs'} />
          <span className="block truncate text-xs font-normal">
            {displayName}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {featuresFlagConfig.enableThemeToggle ? (
          <DropdownMenuItem
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Palette className="mr-2 h-4 w-4" />
            <Trans i18nKey={'common:theme'} />
          </DropdownMenuItem>
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
