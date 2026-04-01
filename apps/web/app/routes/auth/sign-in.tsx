import { Link, redirect } from 'react-router';

import { SignInMethodsContainer } from '@aloha/auth/sign-in';
import { getSafeRedirectPath } from '@aloha/shared/utils';
import { requireUser } from '@aloha/supabase/require-user';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import { Button } from '@aloha/ui/button';
import { Heading } from '@aloha/ui/heading';
import { Trans } from '@aloha/ui/trans';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
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

      <div className={'flex justify-center'}>
        <Button asChild variant={'link'} size={'sm'}>
          <Link to={pathsConfig.auth.signUp} prefetch={'render'}>
            <Trans i18nKey={'auth:doNotHaveAccountYet'} />
          </Link>
        </Button>
      </div>
    </>
  );
}
