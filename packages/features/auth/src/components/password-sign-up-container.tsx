'use client';

import { useCallback, useState } from 'react';

import { CheckCircledIcon } from '@radix-ui/react-icons';

import { useAppEvents } from '@aloha/shared/events';
import { useSignUpWithEmailAndPassword } from '@aloha/supabase/hooks/use-sign-up-with-email-password';
import { Alert, AlertDescription, AlertTitle } from '@aloha/ui/alert';
import { If } from '@aloha/ui/if';
import { Trans } from '@aloha/ui/trans';

import { AuthErrorAlert } from './auth-error-alert';
import { PasswordSignUpForm } from './password-sign-up-form';

interface EmailPasswordSignUpContainerProps {
  onSignUp?: (userId?: string) => unknown;
  displayTermsCheckbox?: boolean;
  emailRedirectTo: string;
}

export function EmailPasswordSignUpContainer({
  onSignUp,
  emailRedirectTo,
  displayTermsCheckbox,
}: EmailPasswordSignUpContainerProps) {
  const signUpMutation = useSignUpWithEmailAndPassword();
  const [{ showVerifyEmailAlert, redirecting }, setState] = useState({
    showVerifyEmailAlert: false,
    redirecting: false,
  });
  const loading = signUpMutation.isPending || redirecting;
  const appEvents = useAppEvents();

  const onSignupRequested = useCallback(
    async (credentials: { email: string; password: string }) => {
      if (loading) {
        return;
      }

      try {
        const data = await signUpMutation.mutateAsync({
          ...credentials,
          emailRedirectTo,
        });

        appEvents.emit({
          type: 'user.signedUp',
          payload: {
            method: 'password',
          },
        });

        setState((prev) => ({ ...prev, showVerifyEmailAlert: true }));

        if (onSignUp) {
          setState((prev) => ({ ...prev, redirecting: true }));
          onSignUp(data.user?.id);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [emailRedirectTo, loading, onSignUp, signUpMutation, appEvents],
  );

  return (
    <>
      <If condition={showVerifyEmailAlert}>
        <SuccessAlert />
      </If>

      <If condition={!showVerifyEmailAlert}>
        <AuthErrorAlert error={signUpMutation.error} />

        <div>
          <PasswordSignUpForm
            displayTermsCheckbox={displayTermsCheckbox}
            onSubmit={onSignupRequested}
            loading={loading}
          />
        </div>
      </If>
    </>
  );
}

function SuccessAlert() {
  return (
    <Alert variant={'success'}>
      <CheckCircledIcon className={'w-4'} />

      <AlertTitle>
        <Trans i18nKey={'auth:emailConfirmationAlertHeading'} />
      </AlertTitle>

      <AlertDescription data-test={'email-confirmation-alert'}>
        <Trans i18nKey={'auth:emailConfirmationAlertBody'} />
      </AlertDescription>
    </Alert>
  );
}
