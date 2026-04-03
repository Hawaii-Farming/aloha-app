'use client';

import { JwtPayload } from '@supabase/supabase-js';

import { LogOut, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';

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

import { OrgSelector } from '~/components/sidebar/org-selector';
import featuresFlagConfig from '~/config/feature-flags.config';
import { useSignOut } from '~/lib/supabase/hooks/use-sign-out';
import { useUser } from '~/lib/supabase/hooks/use-user';

const ADMIN_ACCESS_LEVEL_IDS = ['admin', 'owner'];

export function UserProfileDropdown(props: {
  user?: JwtPayload | null;
  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };
  accountSlug?: string;
  accessLevelId?: string;
  accounts?: Array<{
    label: string | null;
    value: string | null;
    image: string | null;
  }>;
  userId?: string;
}) {
  const signOut = useSignOut();
  const user = useUser(props.user);
  const userData = user.data ?? props.user ?? null;
  const { setTheme, theme } = useTheme();
  const isAdmin =
    !!props.accessLevelId &&
    ADMIN_ACCESS_LEVEL_IDS.includes(props.accessLevelId);

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

        {isAdmin && props.accounts && props.userId && props.accountSlug ? (
          <>
            <DropdownMenuLabel>
              <Trans i18nKey={'common:organisation'}>Organisation</Trans>
            </DropdownMenuLabel>
            <div className="px-2 pb-1">
              <OrgSelector
                selectedAccount={props.accountSlug}
                userId={props.userId}
                accounts={props.accounts}
              />
            </div>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <DropdownMenuItem onClick={() => signOut.mutateAsync()}>
          <LogOut className="mr-2 h-4 w-4" />
          <Trans i18nKey={'auth:signOut'} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
