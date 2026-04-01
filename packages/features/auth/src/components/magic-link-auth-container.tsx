'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAppEvents } from '@aloha/shared/events';
import { useSignInWithOtp } from '@aloha/supabase/hooks/use-sign-in-with-otp';
import { Alert, AlertDescription, AlertTitle } from '@aloha/ui/alert';
import { Button } from '@aloha/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@aloha/ui/form';
import { If } from '@aloha/ui/if';
import { Trans } from '@aloha/ui/trans';

import { EmailInput } from './email-input';
import { TermsAndConditionsFormField } from './terms-and-conditions-form-field';

export function MagicLinkAuthContainer({
  displayTermsCheckbox,
  redirectUrl,
  shouldCreateUser,
}: {
  displayTermsCheckbox?: boolean;
  shouldCreateUser: boolean;
  redirectUrl: string;
}) {
  const { t } = useTranslation();
  const signInWithOtpMutation = useSignInWithOtp();
  const appEvents = useAppEvents();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email(),
      }),
    ),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = ({ email }: { email: string }) => {
    const url = new URL(redirectUrl);

    const emailRedirectTo = url.href;

    const promise = async () => {
      await signInWithOtpMutation.mutateAsync({
        email,
        options: {
          emailRedirectTo,
          shouldCreateUser,
        },
      });

      if (shouldCreateUser) {
        appEvents.emit({
          type: 'user.signedUp',
          payload: {
            method: 'magiclink',
          },
        });
      }
    };

    toast.promise(promise, {
      loading: t('auth:sendingEmailLink'),
      success: t(`auth:sendLinkSuccessToast`),
      error: t(`auth:errors.link`),
    });
  };

  if (signInWithOtpMutation.data) {
    return <SuccessAlert />;
  }

  return (
    <Form {...form}>
      <form className={'w-full'} onSubmit={form.handleSubmit(onSubmit)}>
        <If condition={signInWithOtpMutation.error}>
          <ErrorAlert />
        </If>

        <div className={'flex flex-col space-y-4'}>
          <FormField
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <EmailInput {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
            name={'email'}
          />

          <If condition={displayTermsCheckbox}>
            <TermsAndConditionsFormField />
          </If>

          <Button disabled={signInWithOtpMutation.isPending}>
            <If condition={signInWithOtpMutation.isPending}>
              <Trans i18nKey={'auth:sendingEmailLink'} />
            </If>

            <If condition={!signInWithOtpMutation.isPending}>
              <Trans i18nKey={'auth:sendEmailLink'} />
            </If>
          </Button>
        </div>
      </form>
    </Form>
  );
}

function SuccessAlert() {
  return (
    <Alert variant={'success'}>
      <CheckIcon className={'h-4'} />

      <AlertTitle>
        <Trans i18nKey={'auth:sendLinkSuccess'} />
      </AlertTitle>

      <AlertDescription>
        <Trans i18nKey={'auth:sendLinkSuccessDescription'} />
      </AlertDescription>
    </Alert>
  );
}

function ErrorAlert() {
  return (
    <Alert variant={'destructive'}>
      <ExclamationTriangleIcon className={'h-4'} />

      <AlertTitle>
        <Trans i18nKey={'auth:errors.generic'} />
      </AlertTitle>

      <AlertDescription>
        <Trans i18nKey={'auth:errors.link'} />
      </AlertDescription>
    </Alert>
  );
}
