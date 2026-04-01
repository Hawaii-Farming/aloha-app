'use client';

import { useMemo, useState } from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { Ellipsis } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@aloha/ui/badge';
import { Button } from '@aloha/ui/button';
import { DataTable } from '@aloha/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@aloha/ui/dropdown-menu';
import { If } from '@aloha/ui/if';
import { Input } from '@aloha/ui/input';
import { ProfileAvatar } from '@aloha/ui/profile-avatar';
import { Trans } from '@aloha/ui/trans';

import { RemoveMemberDialog } from './remove-member-dialog';
import { RoleBadge } from './role-badge';
import { TransferOwnershipDialog } from './transfer-ownership-dialog';
import { UpdateMemberRoleDialog } from './update-member-role-dialog';

// Phase 2 will replace with consumer schema types from get_account_members RPC.
interface AccountMember {
  user_id: string;
  account_id: string;
  name: string;
  email: string;
  picture_url: string;
  role: string;
  role_hierarchy_level: number;
  primary_owner_user_id: string;
  created_at: string;
  updated_at: string;
}

type Members = AccountMember[];

interface Permissions {
  canUpdateRole: (roleHierarchy: number) => boolean;
  canRemoveFromAccount: (roleHierarchy: number) => boolean;
  canTransferOwnership: boolean;
}

type AccountMembersTableProps = {
  members: Members;
  currentUserId: string;
  currentAccountId: string;
  userRoleHierarchy: number;
  isPrimaryOwner: boolean;
  canManageRoles: boolean;
};

export function AccountMembersTable({
  members,
  currentUserId,
  currentAccountId,
  isPrimaryOwner,
  userRoleHierarchy,
  canManageRoles,
}: AccountMembersTableProps) {
  const [search, setSearch] = useState('');
  const { t } = useTranslation('teams');

  const permissions = useMemo(
    () => ({
      canUpdateRole: (targetRole: number) => {
        return (
          isPrimaryOwner || (canManageRoles && userRoleHierarchy < targetRole)
        );
      },
      canRemoveFromAccount: (targetRole: number) => {
        return (
          isPrimaryOwner || (canManageRoles && userRoleHierarchy < targetRole)
        );
      },
      canTransferOwnership: isPrimaryOwner,
    }),
    [canManageRoles, isPrimaryOwner, userRoleHierarchy],
  );

  const columnsParams = useMemo(() => {
    return {
      currentUserId,
      currentAccountId,
      currentRoleHierarchy: userRoleHierarchy,
    };
  }, [currentUserId, currentAccountId, userRoleHierarchy]);

  const columns = useGetColumns(permissions, columnsParams);

  const filteredMembers = members
    .filter((member) => {
      const searchString = search.toLowerCase();
      const displayName = member.name ?? member.email.split('@')[0];

      return (
        displayName.includes(searchString) ||
        member.role.toLowerCase().includes(searchString)
      );
    })
    .sort((prev, next) => {
      if (prev.primary_owner_user_id === prev.user_id) {
        return -1;
      }

      if (prev.role_hierarchy_level < next.role_hierarchy_level) {
        return -1;
      }

      return 1;
    });

  return (
    <div className={'flex flex-col space-y-2'}>
      <Input
        value={search}
        onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
        placeholder={t(`searchMembersPlaceholder`)}
      />

      <DataTable columns={columns} data={filteredMembers} />
    </div>
  );
}

function useGetColumns(
  permissions: Permissions,
  params: {
    currentUserId: string;
    currentAccountId: string;
    currentRoleHierarchy: number;
  },
): ColumnDef<AccountMember>[] {
  const { t } = useTranslation('teams');

  return useMemo(
    () => [
      {
        header: t('memberName'),
        size: 200,
        cell: ({ row }) => {
          const member = row.original;
          const displayName = member.name ?? member.email.split('@')[0];
          const isSelf = member.user_id === params.currentUserId;

          return (
            <span className={'flex items-center space-x-4 text-left'}>
              <span>
                <ProfileAvatar
                  displayName={displayName}
                  pictureUrl={member.picture_url}
                />
              </span>

              <span>{displayName}</span>

              <If condition={isSelf}>
                <Badge variant={'outline'}>{t('youLabel')}</Badge>
              </If>
            </span>
          );
        },
      },
      {
        header: t('emailLabel'),
        accessorKey: 'email',
        cell: ({ row }) => {
          return row.original.email ?? '-';
        },
      },
      {
        header: t('roleLabel'),
        cell: ({ row }) => {
          const { role, primary_owner_user_id, user_id } = row.original;
          const isPrimaryOwner = primary_owner_user_id === user_id;

          return (
            <span className={'flex items-center space-x-1'}>
              <RoleBadge role={role} />

              <If condition={isPrimaryOwner}>
                <span
                  className={
                    'rounded-md bg-yellow-400 px-2.5 py-1 text-xs font-medium dark:text-black'
                  }
                >
                  {t('primaryOwnerLabel')}
                </span>
              </If>
            </span>
          );
        },
      },
      {
        header: t('joinedAtLabel'),
        cell: ({ row }) => {
          return new Date(row.original.created_at).toLocaleDateString();
        },
      },
      {
        header: '',
        id: 'actions',
        cell: ({ row }) => (
          <ActionsDropdown
            permissions={permissions}
            member={row.original}
            currentUserId={params.currentUserId}
            currentTeamAccountId={params.currentAccountId}
            currentRoleHierarchy={params.currentRoleHierarchy}
          />
        ),
      },
    ],
    [t, params, permissions],
  );
}

function ActionsDropdown({
  permissions,
  member,
  currentUserId,
  currentTeamAccountId,
  currentRoleHierarchy,
}: {
  permissions: Permissions;
  member: AccountMember;
  currentUserId: string;
  currentTeamAccountId: string;
  currentRoleHierarchy: number;
}) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const isCurrentUser = member.user_id === currentUserId;
  const isPrimaryOwner = member.primary_owner_user_id === member.user_id;

  if (isCurrentUser || isPrimaryOwner) {
    return null;
  }

  const memberRoleHierarchy = member.role_hierarchy_level;
  const canUpdateRole = permissions.canUpdateRole(memberRoleHierarchy);

  const canRemoveFromAccount =
    permissions.canRemoveFromAccount(memberRoleHierarchy);

  // if has no permission to update role, transfer ownership or remove from account
  // do not render the dropdown menu
  if (
    !canUpdateRole &&
    !permissions.canTransferOwnership &&
    !canRemoveFromAccount
  ) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={'ghost'} size={'icon'}>
            <Ellipsis className={'h-5 w-5'} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <If condition={canUpdateRole}>
            <DropdownMenuItem onClick={() => setIsUpdatingRole(true)}>
              <Trans i18nKey={'teams:updateRole'} />
            </DropdownMenuItem>
          </If>

          <If condition={permissions.canTransferOwnership}>
            <DropdownMenuItem onClick={() => setIsTransferring(true)}>
              <Trans i18nKey={'teams:transferOwnership'} />
            </DropdownMenuItem>
          </If>

          <If condition={canRemoveFromAccount}>
            <DropdownMenuItem onClick={() => setIsRemoving(true)}>
              <Trans i18nKey={'teams:removeMember'} />
            </DropdownMenuItem>
          </If>
        </DropdownMenuContent>
      </DropdownMenu>

      <If condition={isRemoving}>
        <RemoveMemberDialog
          isOpen={isRemoving}
          setIsOpen={setIsRemoving}
          teamAccountId={currentTeamAccountId}
          userId={member.user_id}
        />
      </If>

      <If condition={isUpdatingRole}>
        <UpdateMemberRoleDialog
          isOpen={isUpdatingRole}
          setIsOpen={setIsUpdatingRole}
          userId={member.user_id}
          userRole={member.role}
          teamAccountId={currentTeamAccountId}
          userRoleHierarchy={currentRoleHierarchy}
        />
      </If>

      <If condition={isTransferring}>
        <TransferOwnershipDialog
          isOpen
          setIsOpen={setIsTransferring}
          targetDisplayName={member.name ?? member.email}
          accountId={member.account_id}
          userId={member.user_id}
        />
      </If>
    </>
  );
}
