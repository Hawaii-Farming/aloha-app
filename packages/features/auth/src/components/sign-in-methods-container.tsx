import { useNavigate } from 'react-router';

import type { Provider } from '@supabase/supabase-js';

import { isBrowser } from '@aloha/shared/utils';
import { If } from '@aloha/ui/if';
import { Separator } from '@aloha/ui/separator';
import { Trans } from '@aloha/ui/trans';

import { MagicLinkAuthContainer } from './magic-link-auth-container';
import { OauthProviders } from './oauth-providers';
import { PasswordSignInContainer } from './password-sign-in-container';

export function SignInMethodsContainer(props: {
  paths: {
    callback: string;
    returnPath: string;
  };

  providers: {
    password: boolean;
    magicLink: boolean;
    oAuth: Provider[];
  };
}) {
  const navigate = useNavigate();

  const redirectUrl = isBrowser()
    ? new URL(props.paths.callback, window?.location.origin).toString()
    : '';

  const onSignIn = () => {
    return navigate(props.paths.returnPath, { replace: true });
  };

  return (
    <>
      <If condition={props.providers.password}>
        <PasswordSignInContainer onSignIn={onSignIn} />
      </If>

      <If condition={props.providers.magicLink}>
        <MagicLinkAuthContainer
          shouldCreateUser={false}
          redirectUrl={redirectUrl}
        />
      </If>

      <If condition={props.providers.oAuth.length}>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-2">
              <Trans i18nKey="auth:orContinueWith" />
            </span>
          </div>
        </div>

        <OauthProviders
          enabledProviders={props.providers.oAuth}
          shouldCreateUser={false}
          paths={props.paths}
        />
      </If>
    </>
  );
}
