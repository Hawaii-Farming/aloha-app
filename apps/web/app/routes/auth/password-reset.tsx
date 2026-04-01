import { Link, redirect } from 'react-router';

import { PasswordResetRequestContainer } from '@aloha/auth/password-reset';
import { requireUser } from '@aloha/supabase/require-user';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import { Button } from '@aloha/ui/button';
import { Heading } from '@aloha/ui/heading';
import { Trans } from '@aloha/ui/trans';

import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import type { Route } from '~/types/app/routes/auth/+types/password-reset';

export const loader = async ({ request }: Route.LoaderArgs) => {
  const i18n = await createI18nServerInstance(request);
  const user = await requireUser(getSupabaseServerClient(request));

  if (user.data) {
    throw redirect(pathsConfig.app.home);
  }

  return {
    title: i18n.t('auth:passwordResetLabel'),
  };
};

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: data?.title,
    },
  ];
};

const { callback, passwordUpdate, signIn } = pathsConfig.auth;
const redirectPath = `${callback}?next=${passwordUpdate}`;

export default function PasswordResetPage() {
  return (
    <>
      <Heading level={5} className={'tracking-tight'}>
        <Trans i18nKey={'auth:passwordResetLabel'} />
      </Heading>

      <div className={'flex flex-col space-y-4'}>
        <PasswordResetRequestContainer redirectPath={redirectPath} />

        <div className={'flex justify-center text-xs'}>
          <Button asChild variant={'link'} size={'sm'}>
            <Link to={signIn}>
              <Trans i18nKey={'auth:passwordRecoveredQuestion'} />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
