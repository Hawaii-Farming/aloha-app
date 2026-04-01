import { redirect } from 'react-router';

import { UpdatePasswordForm } from '@aloha/auth/password-reset';
import { AuthLayoutShell } from '@aloha/auth/shared';

import { AppLogo } from '~/components/app-logo';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSafeRedirectPath } from '~/lib/shared/utils';
import type { Route } from '~/types/app/routes/auth/+types/update-password';

export const loader = async (args: Route.LoaderArgs) => {
  const { t } = await createI18nServerInstance(args.request);
  const params = new URL(args.request.url).searchParams;
  const next = getSafeRedirectPath(
    params.get('callback'),
    pathsConfig.app.home,
  );
  const user = await requireUserLoader(args.request);

  if (!user) {
    throw redirect(pathsConfig.auth.signIn);
  }

  return {
    title: t('auth:updatePassword'),
    next,
  };
};

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: data?.title,
    },
  ];
};

const Logo = () => <AppLogo href={''} />;

export default function UpdatePasswordPage(props: Route.ComponentProps) {
  const { next } = props.loaderData;

  return (
    <AuthLayoutShell Logo={Logo}>
      <UpdatePasswordForm redirectTo={next} />
    </AuthLayoutShell>
  );
}
