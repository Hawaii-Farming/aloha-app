import { AppBreadcrumbs } from '@aloha/ui/app-breadcrumbs';
import { PageBody } from '@aloha/ui/page';
import { Trans } from '@aloha/ui/trans';

import { WorkspacePageHeader } from '~/components/sidebar/page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import type { Route } from '~/types/app/routes/workspace/+types/home';

export const loader = async (args: Route.LoaderArgs) => {
  const i18n = await createI18nServerInstance(args.request);

  const account = args.params.account as string;
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
    account,
  };
};

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: data?.title,
    },
  ];
};

export default function TeamAccountHomePage(props: Route.ComponentProps) {
  const data = props.loaderData;

  return (
    <>
      <WorkspacePageHeader
        account={data.account}
        title={<Trans i18nKey={'common:dashboardTabLabel'} />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className="text-muted-foreground flex items-center justify-center py-12">
          <Trans i18nKey={'common:dashboardTabLabel'} />
        </div>
      </PageBody>
    </>
  );
}
