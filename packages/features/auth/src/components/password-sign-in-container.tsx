'use client';

import { useCallback } from 'react';

import type { z } from 'zod';

import { useSignInWithEmailPassword } from '@aloha/supabase/hooks/use-sign-in-with-email-password';

import type { PasswordSignInSchema } from '../schemas/password-sign-in.schema';
import { AuthErrorAlert } from './auth-error-alert';
import { PasswordSignInForm } from './password-sign-in-form';

export const PasswordSignInContainer: React.FC<{
  onSignIn?: (userId?: string) => unknown;
}> = ({ onSignIn }) => {
  const signInMutation = useSignInWithEmailPassword();
  const isLoading = signInMutation.isPending;
  const isRedirecting = signInMutation.isSuccess;

  const onSubmit = useCallback(
    async (credentials: z.infer<typeof PasswordSignInSchema>) => {
      try {
        const data = await signInMutation.mutateAsync(credentials);

        if (onSignIn) {
          const userId = data?.user?.id;

          onSignIn(userId);
        }
      } catch {
        // wrong credentials, do nothing
      }
    },
    [onSignIn, signInMutation],
  );

  return (
    <>
      <AuthErrorAlert error={signInMutation.error} />

      <div>
        <PasswordSignInForm
          onSubmit={onSubmit}
          loading={isLoading}
          redirecting={isRedirecting}
        />
      </div>
    </>
  );
};
