import { Link, redirect } from 'react-router';

import { SignUpMethodsContainer } from '@aloha/auth/sign-up';
import { requireUser } from '@aloha/supabase/require-user';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import { Button } from '@aloha/ui/button';
import { Heading } from '@aloha/ui/heading';
import { Trans } from '@aloha/ui/trans';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import type { Route } from '~/types/app/routes/auth/+types/sign-up';

export const loader = async ({ request }: Route.LoaderArgs) => {
  const i18n = await createI18nServerInstance(request);
  const user = await requireUser(getSupabaseServerClient(request));

  if (user.data) {
    throw redirect(pathsConfig.app.home);
  }

  return {
    title: i18n.t('auth:signUp'),
  };
};

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: data?.title,
    },
  ];
};

const paths = {
  callback: pathsConfig.auth.callback,
  appHome: pathsConfig.app.home,
};

export default function SignUpPage() {
  return (
    <>
      <div className={'flex justify-center'}>
        <Heading level={4} className={'tracking-tight'}>
          <Trans i18nKey={'auth:signUpHeading'} />
        </Heading>
      </div>

      <SignUpMethodsContainer
        providers={authConfig.providers}
        displayTermsCheckbox={authConfig.displayTermsCheckbox}
        paths={paths}
      />

      <div className={'flex justify-center'}>
        <Button asChild variant={'link'} size={'sm'}>
          <Link to={pathsConfig.auth.signIn} prefetch={'render'}>
            <Trans i18nKey={'auth:alreadyHaveAnAccount'} />
          </Link>
        </Button>
      </div>
    </>
  );
}
