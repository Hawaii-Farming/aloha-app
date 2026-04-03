'use client';

import { isRouteErrorResponse, useRouteError } from 'react-router';

import { Button } from '../shadcn/button';
import { Trans } from './trans';

export function PageErrorBoundary() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);

  const status = isRouteError ? error.status : 500;
  const statusText = isRouteError ? error.statusText : 'Internal Server Error';

  const getContent = () => {
    if (isRouteError && status === 403) {
      return {
        title: statusText,
        message: (
          <Trans i18nKey="common:forbidden">
            You don&apos;t have access to this page
          </Trans>
        ),
      };
    }

    if (isRouteError && status === 404) {
      return {
        title: statusText,
        message: <Trans i18nKey="common:notFound">Page not found</Trans>,
      };
    }

    return {
      title: statusText,
      message: (
        <Trans i18nKey="common:unexpectedError">Something went wrong</Trans>
      ),
    };
  };

  const content = getContent();

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 p-8"
      data-test="page-error-boundary"
    >
      <h1 className="text-4xl font-bold">{status}</h1>
      <p className="text-muted-foreground text-lg">{content.title}</p>
      <p className="text-muted-foreground">{content.message}</p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.history.back()}>
          <Trans i18nKey="common:goBack">Go back</Trans>
        </Button>
        <Button onClick={() => window.location.reload()}>
          <Trans i18nKey="common:tryAgain">Try again</Trans>
        </Button>
      </div>
    </div>
  );
}
