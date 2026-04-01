import { redirect } from 'react-router';

import { Heading } from '@aloha/ui/heading';
import { Trans } from '@aloha/ui/trans';

import { SignInMethodsContainer } from '~/components/auth/sign-in-methods-container';
import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { getSafeRedirectPath } from '~/lib/shared/utils';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { requireUser } from '~/lib/supabase/require-user';
import type { Route } from '~/types/app/routes/auth/+types/sign-in';

export const loader = async ({ request }: Route.LoaderArgs) => {
  const i18n = await createI18nServerInstance(request);
  const client = getSupabaseServerClient(request);
  const { data: user } = await requireUser(client);

  if (user) {
    throw redirect(pathsConfig.app.home);
  }

  const searchParams = new URL(request.url).searchParams;
  const returnPath = getSafeRedirectPath(
    searchParams.get('next'),
    pathsConfig.app.home,
  );

  return {
    title: i18n.t('auth:signIn'),
    returnPath,
  };
};

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: data?.title,
    },
  ];
};

export default function SignInPage(props: Route.ComponentProps) {
  const { returnPath } = props.loaderData;

  const paths = {
    callback: pathsConfig.auth.callback,
    returnPath,
  };

  return (
    <>
      <div className={'flex justify-center'}>
        <Heading level={4} className={'tracking-tight'}>
          <Trans i18nKey={'auth:signInHeading'} />
        </Heading>
      </div>

      <SignInMethodsContainer paths={paths} providers={authConfig.providers} />
    </>
  );
}
