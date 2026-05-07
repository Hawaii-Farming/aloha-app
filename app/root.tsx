import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
} from 'react-router';

import { z } from 'zod';

import { cn } from '@aloha/ui/utils';

import { RootErrorBoundary } from '~/components/root-error-boundary';
import { RootHead } from '~/components/root-head';
import { RootProviders } from '~/components/root-providers';
import appConfig from '~/config/app.config';
import { themeCookie } from '~/lib/cookies';
import { CsrfTokenMeta } from '~/lib/csrf/client';
import { createCsrfProtect } from '~/lib/csrf/server';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import type { Route } from '~/types/app/+types/root';

import styles from './styles/global.css?url';

// error boundary
export const ErrorBoundary = RootErrorBoundary;

const csrfProtect = createCsrfProtect();

// Preconnect to the Supabase API origin so the browser starts DNS + TCP
// + TLS handshake during HTML parse, in parallel with critical CSS.
// Auth state, loader data, and any client-side React Query call goes to
// this origin, so the handshake savings (~50–150ms on cold connections)
// apply on essentially every page load.
const supabaseOrigin = (() => {
  const raw = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  try {
    return raw ? new URL(raw).origin : null;
  } catch {
    return null;
  }
})();

export const links = () => {
  const out: Array<Record<string, string>> = [
    { rel: 'stylesheet', href: styles },
  ];
  if (supabaseOrigin) {
    out.push({
      rel: 'preconnect',
      href: supabaseOrigin,
      crossOrigin: 'anonymous',
    });
    out.push({ rel: 'dns-prefetch', href: supabaseOrigin });
  }
  return out;
};

export const meta = () => {
  return [
    {
      title: appConfig.title,
    },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [i18n, theme, csrfToken] = await Promise.all([
    createI18nServerInstance(request),
    getTheme(request),
    csrfProtect(request),
  ]);

  const { language } = i18n;
  const className = getClassName(theme);

  return data(
    {
      language,
      className,
      theme,
      csrfToken,
    },
    {
      headers: request.headers,
    },
  );
}

export default function App(props: Route.ComponentProps) {
  const { language, className, theme, csrfToken } = props.loaderData ?? {};

  return (
    <html lang={language} className={className} suppressHydrationWarning>
      <head>
        <RootHead />
        <Meta />
        <Links />
        <CsrfTokenMeta csrf={csrfToken} />
      </head>

      <body>
        <RootProviders theme={theme} language={language}>
          <Outlet />
        </RootProviders>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function getClassName(theme?: string) {
  const dark = theme === 'dark';
  const light = !dark;

  return cn('bg-background min-h-screen font-sans antialiased', {
    dark,
    light,
  });
}

async function getTheme(request: Request) {
  const cookie = request.headers.get('Cookie');
  const theme = await themeCookie.parse(cookie);

  if (Object.keys(theme ?? {}).length === 0) {
    return appConfig.theme;
  }

  const parsed = z.enum(['light', 'dark', 'system']).safeParse(theme);

  if (parsed.success) {
    return parsed.data;
  }

  return appConfig.theme;
}
