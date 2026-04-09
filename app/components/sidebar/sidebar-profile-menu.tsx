'use client';

import { useNavigate } from 'react-router';

import type { JwtPayload } from '@supabase/supabase-js';

import { Building2, Check, ChevronsUpDown, LogOut } from 'lucide-react';

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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@aloha/ui/shadcn-sidebar';
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

export function SidebarProfileMenu(props: {
  user: JwtPayload;
  accountSlug: string;
  accounts: OrgAccount[];
  accessLevelId: string;
}) {
  const { isMobile } = useSidebar();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const user = useUser(props.user);
  const userData = user.data ?? props.user;

  const displayName =
    userData.email ?? userData.user_metadata?.name ?? 'Account';
  const initials = displayName.charAt(0).toUpperCase();
  const hasMultipleOrgs = props.accounts.length > 1;

  const handleOrgSwitch = (value: string) => {
    setLastOrg(value);
    const path = pathsConfig.app.accountHome.replace('[account]', value);
    navigate(path, { replace: true });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {props.accounts.find((a) => a.value === props.accountSlug)
                    ?.label ?? props.accountSlug}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
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
                      {props.accounts.find((a) => a.value === props.accountSlug)
                        ?.label ?? props.accountSlug}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {props.accounts.map((org) => (
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
