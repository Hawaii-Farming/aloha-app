import { getI18n } from 'react-i18next';

import { AppBreadcrumbs } from '@aloha/ui/app-breadcrumbs';
import { PageBody } from '@aloha/ui/page';
import { Trans } from '@aloha/ui/trans';

import { TeamAccountLayoutPageHeader } from '~/components/sidebar/team-account-layout-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import type { Route } from '~/types/app/routes/workspace/+types/settings';

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

export default function TeamAccountSettingsPage({
  params,
}: Route.ComponentProps) {
  return (
    <>
      <TeamAccountLayoutPageHeader
        account={params.account}
        title={<Trans i18nKey={'teams:settings.pageTitle'} />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className={'flex max-w-2xl flex-1 flex-col'}>
          <p className={'text-muted-foreground text-sm'}>
            <Trans i18nKey={'teams:settings.pageTitle'} />
          </p>
        </div>
      </PageBody>
    </>
  );
}
