import { Suspense, useMemo } from 'react';

import { ThemeProvider } from 'next-themes';

import { ClientOnly } from '@aloha/ui/client-only';
import { GlobalLoader } from '@aloha/ui/global-loader';
import { Toaster } from '@aloha/ui/sonner';

import { AuthProvider } from '~/components/auth-provider';
import { I18nProvider } from '~/lib/i18n/i18n-provider';
import { i18nResolver } from '~/lib/i18n/i18n.resolver';
import { getI18nSettings } from '~/lib/i18n/i18n.settings';

import { ReactQueryProvider } from './react-query-provider';

type Theme = 'light' | 'dark' | 'system';

export function RootProviders(
  props: React.PropsWithChildren<{
    theme?: Theme;
    language?: string;
  }>,
) {
  const settings = useMemo(
    () => getI18nSettings(props.language),
    [props.language],
  );

  return (
    <Suspense>
      <I18nProvider settings={settings} resolver={i18nResolver}>
        <Toaster richColors={true} theme={props.theme} position="top-center" />

        <ClientOnly>
          <GlobalLoader displaySpinner={false} />
        </ClientOnly>

        <ReactQueryProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              enableSystem
              disableTransitionOnChange
              defaultTheme={props.theme}
              enableColorScheme={false}
            >
              {props.children}
            </ThemeProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </I18nProvider>
    </Suspense>
  );
}
