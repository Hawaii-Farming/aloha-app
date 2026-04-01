import { useEffect, useRef, useState } from 'react';

import { Link, redirect } from 'react-router';

import type { Provider } from '@supabase/supabase-js';

import { AuthLayoutShell } from '@aloha/auth/shared';
import { getSafeRedirectPath } from '@aloha/shared/utils';
import { useUser } from '@aloha/supabase/hooks/use-user';
import { useUserIdentities } from '@aloha/supabase/hooks/use-user-identities';
import { requireUser } from '@aloha/supabase/require-user';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@aloha/ui/alert-dialog';
import { Button } from '@aloha/ui/button';
import { Heading } from '@aloha/ui/heading';
import { Trans } from '@aloha/ui/trans';

import { AppLogo } from '~/components/app-logo';
import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import type { Route } from '~/types/app/routes/+types/identities';

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: data?.title,
    },
  ];
};

/**
 * @name loader
 * @description Loader for the /identities route.
 * Validates that user is authenticated, and provides available auth methods.
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const client = getSupabaseServerClient(request);
  const auth = await requireUser(client);

  // If not authenticated, redirect to sign in
  if (!auth.data) {
    throw redirect(pathsConfig.auth.signIn);
  }

  // Get the next path from URL params (where to redirect after setup)
  const searchParams = new URL(request.url).searchParams;
  const nextPath = getSafeRedirectPath(
    searchParams.get('next'),
    pathsConfig.app.home,
  );

  // Available auth methods to add
  const showPasswordOption = authConfig.providers.password;
  const oAuthProviders = authConfig.providers.oAuth;

  // Show email option if password, magic link, or OTP is enabled
  const showEmailOption =
    authConfig.providers.password || authConfig.providers.magicLink;

  const enableIdentityLinking = authConfig.enableIdentityLinking;

  // Only require confirmation if password or oauth providers are enabled
  const requiresConfirmation = showPasswordOption || oAuthProviders.length > 0;

  const i18n = await createI18nServerInstance(request);
  const title = i18n.t('auth:setupAccount');

  return {
    title,
    nextPath,
    showPasswordOption,
    showEmailOption,
    oAuthProviders,
    enableIdentityLinking,
    requiresConfirmation,
  };
};

/**
 * @name IdentitiesPage
 * @description Displays linked accounts and available authentication methods.
 */
export default function IdentitiesPage(props: Route.ComponentProps) {
  const {
    nextPath,
    showPasswordOption,
    oAuthProviders,
    showEmailOption,
    enableIdentityLinking,
    requiresConfirmation,
  } = props.loaderData;

  return (
    <AuthLayoutShell
      Logo={AppLogo}
      contentClassName="max-w-md overflow-y-hidden"
    >
      <div className="flex max-h-[70vh] w-full flex-col items-center space-y-6 overflow-y-auto">
        <div className={'flex flex-col items-center space-y-2'}>
          <Heading level={4}>
            <Trans i18nKey={'auth:linkAccountToSignIn'} />
          </Heading>

          <Heading
            level={6}
            className={'text-muted-foreground text-center text-sm'}
          >
            <Trans i18nKey={'auth:linkAccountToSignInDescription'} />
          </Heading>
        </div>

        <IdentitiesStep
          nextPath={nextPath}
          showPasswordOption={showPasswordOption}
          showEmailOption={showEmailOption}
          oAuthProviders={oAuthProviders}
          enableIdentityLinking={enableIdentityLinking}
          requiresConfirmation={requiresConfirmation}
        />
      </div>
    </AuthLayoutShell>
  );
}

interface IdentitiesStepProps {
  nextPath: string;
  showPasswordOption: boolean;
  showEmailOption: boolean;
  enableIdentityLinking: boolean;
  oAuthProviders: Provider[];
  requiresConfirmation: boolean;
}

export function IdentitiesStep(props: IdentitiesStepProps) {
  const user = useUser();
  const { identities } = useUserIdentities();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasSetPassword, _setHasSetPassword] = useState(false);
  const [hasLinkedProvider, _setHasLinkedProvider] = useState(false);

  const initialCountRef = useRef<number | null>(null);
  const initialHasPasswordRef = useRef<boolean | null>(null);

  // Capture initial state once when data becomes available
  // Using refs to avoid re-renders and useEffect to avoid accessing refs during render
  useEffect(() => {
    if (initialCountRef.current === null && identities.length > 0) {
      const nonEmailIdentities = identities.filter(
        (identity) => identity.provider !== 'email',
      );

      initialCountRef.current = nonEmailIdentities.length;
    }
  }, [identities]);

  useEffect(() => {
    if (initialHasPasswordRef.current === null && user.data) {
      const amr = user.data.amr || [];

      const hasPassword = amr.some((item) => {
        if (typeof item === 'string') {
          return item === 'password';
        }

        return item.method === 'password';
      });

      initialHasPasswordRef.current = hasPassword;
    }
  }, [user.data]);

  const handleContinueClick = (e: React.MouseEvent) => {
    // Only show confirmation if password or oauth is enabled (requiresConfirmation)
    if (!props.requiresConfirmation) {
      return;
    }

    const currentNonEmailIdentities = identities.filter(
      (identity) => identity.provider !== 'email',
    );

    const hasAddedNewIdentity =
      currentNonEmailIdentities.length > (initialCountRef.current ?? 0);

    // Check if password was added
    const amr = user.data?.amr || [];

    const currentHasPassword = amr.some((item) => {
      if (typeof item === 'string') {
        return item === 'password';
      }

      return item.method === 'password';
    });

    const hasAddedPassword =
      currentHasPassword && !initialHasPasswordRef.current;

    // If no new identity was added AND no password was set AND no provider linked, show confirmation dialog
    if (
      !hasAddedNewIdentity &&
      !hasAddedPassword &&
      !hasSetPassword &&
      !hasLinkedProvider
    ) {
      e.preventDefault();
      setShowConfirmDialog(true);
    }
  };

  return (
    <>
      <div
        className={
          'animate-in fade-in slide-in-from-bottom-4 mx-auto flex w-full max-w-md flex-col space-y-4 duration-500'
        }
        data-test="join-step-two"
      >
        {/* TODO: Re-implement identity linking UI (was @aloha/accounts/personal-account-settings) */}
        <div className="text-muted-foreground text-center text-sm">
          <Trans i18nKey={'auth:linkAccountToSignInDescription'} />
        </div>

        <Button asChild data-test="continue-button">
          <Link to={props.nextPath} onClick={handleContinueClick}>
            <Trans i18nKey={'common:continueKey'} />
          </Link>
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent data-test="no-auth-method-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle data-test="no-auth-dialog-title">
              <Trans i18nKey={'auth:noIdentityLinkedTitle'} />
            </AlertDialogTitle>

            <AlertDialogDescription data-test="no-auth-dialog-description">
              <Trans i18nKey={'auth:noIdentityLinkedDescription'} />
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel data-test="no-auth-dialog-cancel">
              <Trans i18nKey={'common:cancel'} />
            </AlertDialogCancel>

            <AlertDialogAction asChild data-test="no-auth-dialog-continue">
              <Link to={props.nextPath}>
                <Trans i18nKey={'common:continueKey'} />
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
