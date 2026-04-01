import { Trans } from '@aloha/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import type { Route } from '~/types/app/routes/+types/no-access';

export const loader = async (args: Route.LoaderArgs) => {
  const i18n = await createI18nServerInstance(args.request);
  const title = i18n.t('auth:noAccess.pageTitle');

  return { title };
};

export const meta = ({ data }: Route.MetaArgs) => {
  return [{ title: data?.title ?? 'No Access' }];
};

export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">
          <Trans i18nKey="auth:noAccess.heading" defaults="Access Denied" />
        </h1>

        <p className="text-muted-foreground">
          <Trans
            i18nKey="auth:noAccess.message"
            defaults="Your account does not have an employee record in this system. Please contact your administrator or HR department to get access."
          />
        </p>

        <a
          href="/auth/sign-in"
          className="text-primary hover:text-primary/80 inline-block underline"
          data-test="no-access-sign-in-link"
        >
          <Trans
            i18nKey="auth:noAccess.signInLink"
            defaults="Sign in with a different account"
          />
        </a>
      </div>
    </div>
  );
}
