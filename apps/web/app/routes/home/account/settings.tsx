import { useRouteLoaderData } from 'react-router';

import { getI18n } from 'react-i18next';
import { z } from 'zod';

import { verifyCsrfToken } from '@aloha/csrf/server';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import {
  deleteTeamAccountAction,
  leaveTeamAccountAction,
  updateTeamAccountName,
} from '@aloha/team-accounts/actions';
import { TeamAccountSettingsContainer } from '@aloha/team-accounts/components';
import {
  DeleteTeamAccountSchema,
  LeaveTeamAccountSchema,
  UpdateTeamNameSchema,
} from '@aloha/team-accounts/schema';
import { AppBreadcrumbs } from '@aloha/ui/app-breadcrumbs';
import { PageBody } from '@aloha/ui/page';
import { Trans } from '@aloha/ui/trans';

import featureFlagsConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import type { Route as AccountWorkspaceRoute } from '~/types/app/routes/home/account/+types/layout';
import type { Route } from '~/types/app/routes/home/account/+types/settings';

import { TeamAccountLayoutPageHeader } from './_components/team-account-layout-page-header';

const paths = {
  teamAccountSettings: pathsConfig.app.accountSettings,
};

const ActionSchema = z.union([
  LeaveTeamAccountSchema,
  DeleteTeamAccountSchema,
  UpdateTeamNameSchema,
]);

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: data?.title,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const i18n = await createI18nServerInstance(args.request);
  const title = i18n.t('teams:settings.pageTitle');

  return {
    title,
  };
}

export async function clientLoader() {
  const i18n = getI18n();
  const title = i18n.t('teams:settings.pageTitle');

  return {
    title,
  };
}

export default function TeamAccountSettingsPage() {
  const data = useRouteLoaderData(
    'routes/home/account/layout',
  ) as AccountWorkspaceRoute.ComponentProps['loaderData'];

  const workspace = data.workspace;

  const account = {
    id: workspace.currentOrg.org_id,
    name: workspace.currentOrg.org_name,
    pictureUrl: null as string | null,
    slug: workspace.currentOrg.org_id,
    primaryOwnerUserId: workspace.user.id,
  };

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={account.slug}
        title={<Trans i18nKey={'teams:settings.pageTitle'} />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className={'flex max-w-2xl flex-1 flex-col'}>
          <TeamAccountSettingsContainer
            account={account}
            paths={paths}
            features={{
              enableTeamDeletion: featureFlagsConfig.enableTeamDeletion,
            }}
          />
        </div>
      </PageBody>
    </>
  );
}

export const action = async (args: Route.ActionArgs) => {
  const json = await args.request.json();
  const data = ActionSchema.parse(json);

  await verifyCsrfToken(args.request, data.payload.csrfToken);

  const client = getSupabaseServerClient(args.request);

  switch (data.intent) {
    case 'leave-team':
      return leaveTeamAccountAction({
        data,
        client,
      });

    case 'update-team-name':
      return updateTeamAccountName({
        client,
        data,
      });

    case 'delete-team-account':
      return deleteTeamAccountAction({
        data,
        client,
      });
  }
};
