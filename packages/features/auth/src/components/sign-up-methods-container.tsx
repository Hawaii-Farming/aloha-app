'use client';

import type { Provider } from '@supabase/supabase-js';

import { isBrowser, isSafeRedirectPath } from '@aloha/shared/utils';
import { If } from '@aloha/ui/if';
import { Separator } from '@aloha/ui/separator';
import { Trans } from '@aloha/ui/trans';

import { MagicLinkAuthContainer } from './magic-link-auth-container';
import { OauthProviders } from './oauth-providers';
import { EmailPasswordSignUpContainer } from './password-sign-up-container';

export function SignUpMethodsContainer(props: {
  paths: {
    callback: string;
    appHome: string;
  };

  providers: {
    password: boolean;
    magicLink: boolean;
    oAuth: Provider[];
  };

  displayTermsCheckbox?: boolean;
}) {
  const redirectUrl = getCallbackUrl(props);

  return (
    <>
      <If condition={props.providers.password}>
        <EmailPasswordSignUpContainer
          displayTermsCheckbox={props.displayTermsCheckbox}
          emailRedirectTo={redirectUrl}
        />
      </If>

      <If condition={props.providers.magicLink}>
        <MagicLinkAuthContainer
          shouldCreateUser={true}
          redirectUrl={redirectUrl}
          displayTermsCheckbox={props.displayTermsCheckbox}
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
          shouldCreateUser={true}
          paths={{
            callback: props.paths.callback,
            returnPath: props.paths.appHome,
          }}
        />
      </If>
    </>
  );
}

function getCallbackUrl(props: {
  paths: {
    callback: string;
    appHome: string;
  };
}) {
  if (!isBrowser()) {
    return '';
  }

  const redirectPath = props.paths.callback;
  const origin = window.location.origin;
  const url = new URL(redirectPath, origin);

  const searchParams = new URLSearchParams(window.location.search);
  const next = searchParams.get('next');

  if (next && isSafeRedirectPath(next)) {
    url.searchParams.set('next', next);
  }

  return url.href;
}
