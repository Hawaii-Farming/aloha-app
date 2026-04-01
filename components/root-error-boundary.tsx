import {
  Link,
  Links,
  Meta,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@aloha/ui/button';
import { Heading } from '@aloha/ui/heading';
import { Trans } from '@aloha/ui/trans';

import { RootHead } from '~/components/root-head';
import { RootProviders } from '~/components/root-providers';

export function RootErrorBoundary() {
  const routeError = useRouteError();

  const error =
    routeError instanceof Error
      ? routeError
      : new Error(`Unknown error: ${JSON.stringify(routeError)}"`);

  const status = isRouteErrorResponse(error) ? error.status : 500;

  if (status !== 404) {
    console.error(error);
  }

  return (
    <RootProviders>
      <html lang={'en'}>
        <head>
          <RootHead />
          <Meta />
          <Links />
        </head>

        <body data-test={'root-error-boundary'}>
          <div className={'flex h-screen flex-1 flex-col'}>
            <div
              className={
                'container m-auto flex w-full flex-1 flex-col items-center justify-center'
              }
            >
              <div className={'flex flex-col items-center space-y-16'}>
                <div>
                  <h1 className={'font-heading text-9xl font-extrabold'}>
                    {status === 404 ? (
                      <Trans i18nKey={'common:pageNotFoundHeading'} />
                    ) : (
                      <Trans i18nKey={'common:errorPageHeading'} />
                    )}
                  </h1>
                </div>

                <div className={'flex flex-col items-center space-y-8'}>
                  <div className={'flex flex-col items-center space-y-2.5'}>
                    <div>
                      <Heading level={1}>
                        {status === 404 ? (
                          <Trans i18nKey={'common:pageNotFound'} />
                        ) : (
                          <Trans i18nKey={'common:genericError'} />
                        )}
                      </Heading>
                    </div>

                    <p className={'text-muted-foreground'}>
                      {status === 404 ? (
                        <Trans i18nKey={'common:pageNotFoundSubHeading'} />
                      ) : (
                        <Trans i18nKey={'common:genericErrorSubHeading'} />
                      )}
                    </p>
                  </div>

                  <div>
                    <Button variant={'outline'} asChild>
                      <Link to={'/'}>
                        <ArrowLeft className={'mr-2 h-4'} />

                        <Trans i18nKey={'common:goBack'} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    </RootProviders>
  );
}
