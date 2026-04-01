import { useCallback, useEffect } from 'react';

import { useFetcher } from 'react-router';

import { useCsrfToken } from '@aloha/csrf/client';
import { Alert, AlertDescription, AlertTitle } from '@aloha/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@aloha/ui/alert-dialog';
import { Button } from '@aloha/ui/button';
import { If } from '@aloha/ui/if';
import { Trans } from '@aloha/ui/trans';

export const RemoveMemberDialog: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teamAccountId: string;
  userId: string;
}> = ({ isOpen, setIsOpen, teamAccountId, userId }) => {
  const csrfToken = useCsrfToken();

  const fetcher = useFetcher<{
    success: boolean;
  }>();

  const pending = fetcher.state === 'submitting';
  const error = fetcher.data && !fetcher.data.success;

  useEffect(() => {
    if (fetcher.data?.success) {
      setIsOpen(false);
    }
  }, [fetcher.data, setIsOpen]);

  const onMemberRemoved = useCallback(() => {
    return fetcher.submit(
      {
        intent: 'remove-member',
        payload: {
          accountId: teamAccountId,
          userId,
          csrfToken,
        },
      },
      {
        method: 'POST',
        encType: 'application/json',
      },
    );
  }, [fetcher, teamAccountId, userId, csrfToken]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans i18nKey="teamS:removeMemberModalHeading" />
          </AlertDialogTitle>

          <AlertDialogDescription>
            <Trans i18nKey={'teams:removeMemberModalDescription'} />
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RemoveMemberForm
          onSubmit={onMemberRemoved}
          pending={pending}
          error={error}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
};

function RemoveMemberForm({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: () => void;
  pending: boolean;
  error: boolean | undefined;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className={'flex flex-col space-y-6'}>
        <p className={'text-muted-foreground text-sm'}>
          <Trans i18nKey={'common:modalConfirmationQuestion'} />
        </p>

        <If condition={error}>
          <RemoveMemberErrorAlert />
        </If>

        <AlertDialogFooter>
          <AlertDialogCancel>
            <Trans i18nKey={'common:cancel'} />
          </AlertDialogCancel>

          <Button
            data-test={'confirm-remove-member'}
            variant={'destructive'}
            disabled={pending}
          >
            <Trans i18nKey={'teams:removeMemberSubmitLabel'} />
          </Button>
        </AlertDialogFooter>
      </div>
    </form>
  );
}

function RemoveMemberErrorAlert() {
  return (
    <Alert variant={'destructive'}>
      <AlertTitle>
        <Trans i18nKey={'teams:removeMemberErrorHeading'} />
      </AlertTitle>

      <AlertDescription>
        <Trans i18nKey={'teams:removeMemberErrorMessage'} />
      </AlertDescription>
    </Alert>
  );
}
