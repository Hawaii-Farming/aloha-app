import { Link, redirect } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@aloha/ui/alert';
import { Button } from '@aloha/ui/button';
import { Trans } from '@aloha/ui/trans';

import pathsConfig from '~/config/paths.config';
import type { Route } from '~/types/app/routes/auth/+types/callback-error';

export const loader = ({ request }: Route.LoaderArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const error = searchParams.get('error');
  const signInPath = pathsConfig.auth.signIn;

  if (!error) {
    throw redirect(pathsConfig.auth.signIn);
  }

  return {
    error,
    signInPath,
  };
};

export default function AuthCallbackErrorPage(props: Route.ComponentProps) {
  const { error, signInPath } = props.loaderData;

  return (
    <div className={'flex flex-col space-y-4 py-4'}>
      <div>
        <Alert variant={'destructive'}>
          <AlertTitle>
            <Trans i18nKey={'auth:authenticationErrorAlertHeading'} />
          </AlertTitle>

          <AlertDescription>
            <Trans i18nKey={error} />
          </AlertDescription>
        </Alert>
      </div>

      <Button className={'w-full'} asChild>
        <Link to={signInPath}>
          <Trans i18nKey={'auth:signIn'} />
        </Link>
      </Button>
    </div>
  );
}
