import { redirect, useRouteLoaderData } from 'react-router';

import { SupabaseClient } from '@supabase/supabase-js';

import { getI18n } from 'react-i18next';
import { z } from 'zod';

import { verifyCsrfToken } from '@aloha/csrf/server';
import { getSupabaseBrowserClient } from '@aloha/supabase/browser-client';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import { AccountMembersTable } from '@aloha/team-accounts/components';
import {
  RemoveMemberSchema,
  TransferOwnershipSchema,
  UpdateMemberRoleSchema,
} from '@aloha/team-accounts/schema';
import { AppBreadcrumbs } from '@aloha/ui/app-breadcrumbs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@aloha/ui/card';
import { PageBody } from '@aloha/ui/page';
import { Trans } from '@aloha/ui/trans';

import { Database } from '~/lib/database.types';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { TeamAccountLayoutPageHeader } from '~/routes/home/account/_components/team-account-layout-page-header';
import type { Route as AccountWorkspaceRoute } from '~/types/app/routes/home/account/+types/layout';
import type { Route } from '~/types/app/routes/home/account/+types/members';

import { loadMembersPageData } from './_lib/members-page-loader';

const MembersActionsSchema = z.union([
  UpdateMemberRoleSchema,
  RemoveMemberSchema,
  TransferOwnershipSchema,
]);

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: data?.title,
    },
  ];
};

async function membersLoader(
  client: SupabaseClient<Database>,
  accountSlug: string,
) {
  const [members, userResponse, canAddMember] = await loadMembersPageData(
    client,
    accountSlug,
  );

  if ('redirectTo' in userResponse) {
    throw redirect(userResponse.redirectTo);
  }

  return {
    accountSlug,
    members,
    user: userResponse.data,
    canAddMember,
  };
}

export async function loader(args: Route.LoaderArgs) {
  const client = getSupabaseServerClient(args.request);
  const i18n = await createI18nServerInstance(args.request);
  const title = i18n.t('teams:members.pageTitle');
  const accountSlug = args.params.account as string;

  const data = await membersLoader(client, accountSlug);

  return {
    title,
    ...data,
  };
}

export async function clientLoader(args: Route.LoaderArgs) {
  const client = getSupabaseBrowserClient();
  const accountSlug = args.params.account as string;

  const i18n = getI18n();
  const title = i18n.t('teams:members.pageTitle');
  const data = await membersLoader(client, accountSlug);

  return {
    title,
    ...data,
  };
}

export default function TeamAccountMembersPage(props: Route.ComponentProps) {
  const data = props.loaderData;

  const { workspace } = useRouteLoaderData(
    'routes/home/account/layout',
  ) as AccountWorkspaceRoute.ComponentProps['loaderData'];

  const currentOrg = workspace.currentOrg;

  const canManageRoles = true;
  const isPrimaryOwner = false;
  const currentUserRoleHierarchy = 0;

  return (
    <>
      <TeamAccountLayoutPageHeader
        title={<Trans i18nKey={'common:membersTabLabel'} />}
        description={<AppBreadcrumbs />}
        account={data.accountSlug}
      />

      <PageBody>
        <div className={'flex w-full max-w-4xl flex-col space-y-6 pb-32'}>
          <Card>
            <CardHeader className={'flex flex-row justify-between'}>
              <div className={'flex flex-col space-y-1.5'}>
                <CardTitle>
                  <Trans i18nKey={'common:accountMembers'} />
                </CardTitle>

                <CardDescription>
                  <Trans i18nKey={'common:membersTabDescription'} />
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <AccountMembersTable
                userRoleHierarchy={currentUserRoleHierarchy}
                currentUserId={data.user.id}
                currentAccountId={currentOrg.org_id}
                members={data.members}
                isPrimaryOwner={isPrimaryOwner}
                canManageRoles={canManageRoles}
              />
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

export const action = async function (args: Route.ActionArgs) {
  const client = getSupabaseServerClient(args.request);
  const json = await args.request.json();
  const data = await MembersActionsSchema.parseAsync(json);

  await verifyCsrfToken(args.request, data.payload.csrfToken);

  switch (data.intent) {
    case 'update-member-role': {
      const { updateMemberRoleAction } = await import(
        '@aloha/team-accounts/actions'
      );

      return updateMemberRoleAction({
        client,
        data,
      });
    }

    case 'remove-member': {
      const { removeMemberFromAccountAction } = await import(
        '@aloha/team-accounts/actions'
      );

      return removeMemberFromAccountAction({
        client,
        data,
      });
    }

    case 'transfer-ownership': {
      const { transferOwnershipAction } = await import(
        '@aloha/team-accounts/actions'
      );

      return transferOwnershipAction({
        client,
        data,
      });
    }
  }
};
