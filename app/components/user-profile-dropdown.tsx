'use client';

import { JwtPayload } from '@supabase/supabase-js';

import { useNavigate } from 'react-router';

import { Building2, Check, LogOut } from 'lucide-react';

import { Avatar, AvatarFallback } from '@aloha/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@aloha/ui/dropdown-menu';
import { SubMenuModeToggle } from '@aloha/ui/mode-toggle';
import { Trans } from '@aloha/ui/trans';

import pathsConfig from '~/config/paths.config';
import { setLastOrg } from '~/lib/org-storage';
import { useSignOut } from '~/lib/supabase/hooks/use-sign-out';
import { useUser } from '~/lib/supabase/hooks/use-user';

interface OrgAccount {
  label: string | null;
  value: string | null;
  image: string | null;
}

export function UserProfileDropdown(props: {
  user?: JwtPayload | null;
  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };
  accountSlug?: string;
  accessLevelId?: string;
  accounts?: OrgAccount[];
}) {
  const signOut = useSignOut();
  const navigate = useNavigate();
  const user = useUser(props.user);
  const userData = user.data ?? props.user ?? null;

  if (!userData) {
    return null;
  }

  const displayName =
    userData.email ?? userData.user_metadata?.name ?? 'Account';
  const initials = displayName.charAt(0).toUpperCase();
  const accounts = props.accounts ?? [];
  const hasMultipleOrgs = accounts.length > 1;

  const handleOrgSwitch = (value: string) => {
    setLastOrg(value);

    const path = pathsConfig.app.accountHome.replace('[account]', value);

    navigate(path, { replace: true });
  };

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

        {hasMultipleOrgs && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Building2 className="mr-2 h-4 w-4" />
                <span>
                  {accounts.find((a) => a.value === props.accountSlug)
                    ?.label ?? props.accountSlug}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {accounts.map((org) => (
                  <DropdownMenuItem
                    key={org.value}
                    onClick={() => handleOrgSwitch(org.value ?? '')}
                  >
                    {org.value === props.accountSlug && (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    <span
                      className={
                        org.value !== props.accountSlug ? 'ml-6' : ''
                      }
                    >
                      {org.label ?? org.value}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        <SubMenuModeToggle />

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => signOut.mutateAsync()}>
          <LogOut className="mr-2 h-4 w-4" />
          <Trans i18nKey={'auth:signOut'} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
