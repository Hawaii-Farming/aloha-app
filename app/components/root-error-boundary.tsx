import {
  Link,
  Links,
  Meta,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router';

import { ArrowLeft, Home, RefreshCw } from 'lucide-react';

import { Button } from '@aloha/ui/button';
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
  const isNotFound = status === 404;

  if (!isNotFound) {
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
          <div className="bg-background relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
            >
              <div
                className="absolute inset-0 opacity-40 dark:opacity-30"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgb(165 122 76 / 0.5) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  maskImage:
                    'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                }}
              />

              <div className="animate-error-orb-slow absolute top-1/2 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/50 blur-3xl dark:bg-amber-600/55" />
              <div className="animate-error-orb-fast absolute top-[8%] left-[8%] h-96 w-96 rounded-full bg-sky-400/40 blur-3xl dark:bg-rose-600/45" />
              <div className="animate-error-orb-medium absolute right-[8%] bottom-[5%] h-[28rem] w-[28rem] rounded-full bg-teal-400/45 blur-3xl dark:bg-orange-500/55" />
              <div className="absolute top-[15%] right-[25%] h-72 w-72 rounded-full bg-lime-300/40 blur-3xl dark:bg-yellow-600/40" />
              <div className="absolute bottom-[15%] left-[12%] h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl dark:bg-teal-700/45" />
            </div>

            <style>{`
              @keyframes error-drift-slow {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-46%, -54%) scale(1.08); }
              }
              @keyframes error-drift-medium {
                0%, 100% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(-30px, 20px) scale(1.1); }
              }
              @keyframes error-drift-fast {
                0%, 100% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(25px, -15px) scale(1.12); }
              }
              .animate-error-orb-slow { animation: error-drift-slow 14s ease-in-out infinite; }
              .animate-error-orb-medium { animation: error-drift-medium 11s ease-in-out infinite; }
              .animate-error-orb-fast { animation: error-drift-fast 8s ease-in-out infinite; }
              @media (prefers-reduced-motion: reduce) {
                .animate-error-orb-slow,
                .animate-error-orb-medium,
                .animate-error-orb-fast { animation: none; }
              }
            `}</style>

            <div className="relative flex w-full max-w-2xl flex-col items-center text-center">
              <h1 className="font-heading from-foreground via-foreground to-foreground/40 bg-gradient-to-br bg-clip-text px-4 text-[8rem] leading-none font-black tracking-tight text-transparent sm:text-[11rem]">
                {status}
              </h1>

              <p className="text-muted-foreground mt-6 max-w-md text-sm sm:text-base">
                {isNotFound ? (
                  <Trans i18nKey={'common:pageNotFoundSubHeading'} />
                ) : (
                  <Trans i18nKey={'common:genericErrorSubHeading'} />
                )}
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {!isNotFound && (
                  <Button
                    variant="default"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <Trans i18nKey={'common:tryAgain'} />
                  </Button>
                )}

                <Button variant={isNotFound ? 'default' : 'outline'} asChild>
                  <Link to={'/'}>
                    <Home className="mr-2 h-4 w-4" />
                    <Trans i18nKey={'common:backToHomePage'} />
                  </Link>
                </Button>

                <Button variant="ghost" asChild>
                  <Link to={'..'} relative="path">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <Trans i18nKey={'common:goBack'} />
                  </Link>
                </Button>
              </div>

              {import.meta.env.DEV && error.message && (
                <details className="mt-12 w-full max-w-lg text-left">
                  <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-mono text-xs tracking-wider uppercase select-none">
                    Error details (dev only)
                  </summary>
                  <pre className="border-border bg-muted/50 text-muted-foreground mt-3 overflow-x-auto rounded-md border p-4 text-xs">
                    {error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </body>
      </html>
    </RootProviders>
  );
}
