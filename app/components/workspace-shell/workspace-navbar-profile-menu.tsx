'use client';

import { useMemo } from 'react';

import { useNavigate } from 'react-router';

import type { JwtPayload } from '@supabase/supabase-js';

import { Check, LogOut, Tractor } from 'lucide-react';

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

import { useSignOut } from '~/lib/supabase/hooks/use-sign-out';
import { useUser } from '~/lib/supabase/hooks/use-user';
import { getOrgInitials } from '~/lib/workspace/get-org-initials';

const ORG_SWITCHER_ROLES = new Set(['owner', 'admin']);

interface WorkspaceNavbarProfileMenuProps {
  user: JwtPayload;
  orgName?: string | null;
  currentOrgId?: string | null;
  accessLevelId?: string | null;
  userOrgs?: Array<{ org_id: string; org_name: string }>;
}

export function WorkspaceNavbarProfileMenu(
  props: WorkspaceNavbarProfileMenuProps,
) {
  const signOut = useSignOut();
  const user = useUser(props.user);
  const userData = user.data ?? props.user;
  const navigate = useNavigate();

  const displayName =
    userData.email ?? userData.user_metadata?.name ?? 'Account';
  const initial = useMemo(
    () => getOrgInitials(props.orgName, userData.email ?? null),
    [props.orgName, userData.email],
  );

  const canSwitchOrg =
    !!props.accessLevelId &&
    ORG_SWITCHER_ROLES.has(props.accessLevelId.trim().toLowerCase());

  const sortedOrgs = useMemo(() => {
    if (!props.userOrgs) return [];
    return [...props.userOrgs].sort((a, b) =>
      a.org_name.localeCompare(b.org_name),
    );
  }, [props.userOrgs]);

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
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-green-500/25 dark:from-green-400 dark:to-emerald-500 dark:text-green-950">
              {initial}
            </AvatarFallback>
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

        {canSwitchOrg && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                data-test="workspace-navbar-org-switcher"
                className="gap-2"
              >
                <Tractor className="h-4 w-4" />
                <span>Switch farm</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-56">
                {sortedOrgs.map((org) => {
                  const isCurrent = org.org_id === props.currentOrgId;
                  return (
                    <DropdownMenuItem
                      key={org.org_id}
                      data-test={`workspace-navbar-org-${org.org_id}`}
                      disabled={isCurrent}
                      onClick={() => {
                        if (isCurrent) return;
                        navigate(`/home/${org.org_id}`);
                      }}
                    >
                      <Check
                        className={
                          isCurrent
                            ? 'mr-2 h-4 w-4 opacity-100'
                            : 'mr-2 h-4 w-4 opacity-0'
                        }
                      />
                      <span className="truncate">{org.org_name}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

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
