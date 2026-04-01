'use client';

import { useFetcher } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCsrfToken } from '@aloha/csrf/client';
import { useUser } from '@aloha/supabase/hooks/use-user';
import { Alert, AlertDescription, AlertTitle } from '@aloha/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@aloha/ui/alert-dialog';
import { Button } from '@aloha/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@aloha/ui/form';
import { Input } from '@aloha/ui/input';
import { LoadingOverlay } from '@aloha/ui/loading-overlay';
import { Trans } from '@aloha/ui/trans';

export function TeamAccountDangerZone({
  account,
  primaryOwnerUserId,
  features,
}: React.PropsWithChildren<{
  account: {
    name: string;
    id: string;
  };

  features: {
    enableTeamDeletion: boolean;
  };

  primaryOwnerUserId: string;
}>) {
  const { data: user } = useUser();

  if (!user) {
    return <LoadingOverlay fullPage={false} />;
  }

  // Only the primary owner can delete the team account
  const userIsPrimaryOwner = user.id === primaryOwnerUserId;

  if (userIsPrimaryOwner) {
    if (features.enableTeamDeletion) {
      return <DeleteTeamContainer account={account} />;
    } else {
      return;
    }
  }

  // A primary owner can't leave the team account
  // but other members can
  return <LeaveTeamContainer account={account} />;
}

function DeleteTeamContainer(props: {
  account: {
    name: string;
    id: string;
  };
}) {
  return (
    <div className={'flex flex-col space-y-4'}>
      <div className={'flex flex-col space-y-1'}>
        <span className={'font-medium'}>
          <Trans i18nKey={'teams:deleteTeam'} />
        </span>

        <p className={'text-muted-foreground text-sm'}>
          <Trans
            i18nKey={'teams:deleteTeamDescription'}
            values={{
              teamName: props.account.name,
            }}
          />
        </p>
      </div>

      <div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              data-test={'delete-team-trigger'}
              type={'button'}
              variant={'destructive'}
            >
              <Trans i18nKey={'teams:deleteTeam'} />
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
            <AlertDialogHeader>
              <AlertDialogTitle>
                <Trans i18nKey={'teams:deletingTeam'} />
              </AlertDialogTitle>

              <AlertDialogDescription>
                <Trans
                  i18nKey={'teams:deletingTeamDescription'}
                  values={{
                    teamName: props.account.name,
                  }}
                />
              </AlertDialogDescription>
            </AlertDialogHeader>

            <DeleteTeamConfirmationForm
              name={props.account.name}
              id={props.account.id}
            />
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function DeleteTeamConfirmationForm({
  name,
  id,
}: {
  name: string;
  id: string;
}) {
  const csrfToken = useCsrfToken();

  const fetcher = useFetcher<{
    success: boolean;
  }>();

  const { data: user } = useUser();

  const form = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(
      z.object({
        otp: z.string().min(6).max(6),
        csrfToken: z.string().min(1),
      }),
    ),
    defaultValues: {
      otp: '',
      csrfToken,
    },
  });

  const pending = fetcher.state === 'submitting';

  if (!user?.email) {
    return <LoadingOverlay fullPage={false} />;
  }

  return (
    <Form {...form}>
      <form
        data-test={'delete-team-form'}
        className={'flex flex-col space-y-4'}
        onSubmit={form.handleSubmit((payload) => {
          return fetcher.submit(
            {
              intent: 'delete-team-account',
              payload: {
                accountId: id,
                csrfToken: payload.csrfToken,
                otp: payload.otp,
              },
            },
            {
              method: 'POST',
              encType: 'application/json',
            },
          );
        })}
      >
        <div className={'flex flex-col space-y-2'}>
          <div
            className={
              'border-2 border-red-500 p-4 text-sm text-red-500' +
              ' my-4 flex flex-col space-y-2'
            }
          >
            <div>
              <Trans
                i18nKey={'teams:deleteTeamDisclaimer'}
                values={{
                  teamName: name,
                }}
              />
            </div>

            <div className={'text-sm'}>
              <Trans i18nKey={'common:modalConfirmationQuestion'} />
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>
            <Trans i18nKey={'common:cancel'} />
          </AlertDialogCancel>

          <DeleteTeamSubmitButton pending={pending} />
        </AlertDialogFooter>
      </form>
    </Form>
  );
}

function DeleteTeamSubmitButton(props: { pending: boolean }) {
  return (
    <Button
      data-test={'delete-team-form-confirm-button'}
      disabled={props.pending}
      variant={'destructive'}
    >
      <Trans i18nKey={'teams:deleteTeam'} />
    </Button>
  );
}

function LeaveTeamContainer(props: {
  account: {
    name: string;
    id: string;
  };
}) {
  const csrfToken = useCsrfToken();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        confirmation: z.string().refine((value) => value === 'LEAVE', {
          message: 'Confirmation required to leave team',
          path: ['confirmation'],
        }),
        accountId: z.string().refine((value) => value === props.account.id, {
          message: 'Account ID does not match',
          path: ['accountId'],
        }),
        csrfToken: z.string(),
      }),
    ),
    defaultValues: {
      confirmation: '' as 'LEAVE',
      accountId: props.account.id,
      csrfToken,
    },
  });

  const fetcher = useFetcher();
  const pending = fetcher.state === 'submitting';

  return (
    <div className={'flex flex-col space-y-4'}>
      <p className={'text-muted-foreground text-sm'}>
        <Trans
          i18nKey={'teams:leaveTeamDescription'}
          values={{
            teamName: props.account.name,
          }}
        />
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <div>
            <Button
              data-test={'leave-team-button'}
              type={'button'}
              variant={'destructive'}
            >
              <Trans i18nKey={'teams:leaveTeam'} />
            </Button>
          </div>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans i18nKey={'teams:leavingTeamModalHeading'} />
            </AlertDialogTitle>

            <AlertDialogDescription>
              <Trans i18nKey={'teams:leavingTeamModalDescription'} />
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...form}>
            <form
              className={'flex flex-col space-y-4'}
              onSubmit={form.handleSubmit((payload) => {
                return fetcher.submit(
                  {
                    intent: 'leave-team',
                    payload,
                  },
                  {
                    method: 'POST',
                    encType: 'application/json',
                  },
                );
              })}
            >
              <FormField
                name={'confirmation'}
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>
                        <Trans i18nKey={'teams:leaveTeamInputLabel'} />
                      </FormLabel>

                      <FormControl>
                        <Input
                          data-test="leave-team-input-field"
                          type="text"
                          className="w-full"
                          autoComplete={'off'}
                          placeholder=""
                          pattern="LEAVE"
                          required
                          {...field}
                        />
                      </FormControl>

                      <FormDescription>
                        <Trans i18nKey={'teams:leaveTeamInputDescription'} />
                      </FormDescription>

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Trans i18nKey={'common:cancel'} />
                </AlertDialogCancel>

                <LeaveTeamSubmitButton pending={pending} />
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LeaveTeamSubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button
      data-test={'confirm-leave-organization-button'}
      disabled={pending}
      variant={'destructive'}
    >
      <Trans i18nKey={'teams:leaveTeam'} />
    </Button>
  );
}

function _LeaveTeamErrorAlert() {
  return (
    <>
      <Alert variant={'destructive'}>
        <AlertTitle>
          <Trans i18nKey={'teams:leaveTeamErrorHeading'} />
        </AlertTitle>

        <AlertDescription>
          <Trans i18nKey={'common:genericError'} />
        </AlertDescription>
      </Alert>

      <AlertDialogFooter>
        <AlertDialogCancel>
          <Trans i18nKey={'common:cancel'} />
        </AlertDialogCancel>
      </AlertDialogFooter>
    </>
  );
}

function _DeleteTeamErrorAlert() {
  return (
    <Alert variant={'destructive'}>
      <AlertTitle>
        <Trans i18nKey={'teams:deleteTeamErrorHeading'} />
      </AlertTitle>

      <AlertDescription>
        <Trans i18nKey={'common:genericError'} />
      </AlertDescription>
    </Alert>
  );
}
