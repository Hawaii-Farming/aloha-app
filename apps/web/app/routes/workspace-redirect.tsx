import { Trans } from '@aloha/ui/trans';

import pathsConfig from '~/config/paths.config';
import { getLastOrg, setLastOrg } from '~/lib/org-storage';
import { homeLoader } from '~/lib/workspace/home-loader.server';
import type { Route } from '~/types/app/routes/+types/workspace-redirect';

export async function loader({ request }: Route.LoaderArgs) {
  return homeLoader(request);
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const serverData = await serverLoader();

  if ('orgs' in serverData && serverData.orgs.length > 1) {
    const lastOrg = getLastOrg();
    const matchingOrg = lastOrg
      ? serverData.orgs.find((o) => o.org_id === lastOrg)
      : null;

    if (matchingOrg) {
      setLastOrg(matchingOrg.org_id);

      window.location.href = pathsConfig.app.accountHome.replace(
        '[account]',
        matchingOrg.org_id,
      );

      return { ...serverData, redirecting: true };
    }
  }

  return { ...serverData, redirecting: false };
}
clientLoader.hydrate = true as const;

export default function HomeRedirectPage({ loaderData }: Route.ComponentProps) {
  if ('redirecting' in loaderData && loaderData.redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          <Trans i18nKey="common:redirecting" defaults="Redirecting..." />
        </p>
      </div>
    );
  }

  const orgs = 'orgs' in loaderData ? loaderData.orgs : [];

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <Trans
              i18nKey="common:orgPicker.heading"
              defaults="Select Organization"
            />
          </h1>
          <p className="text-muted-foreground mt-2">
            <Trans
              i18nKey="common:orgPicker.description"
              defaults="Choose an organization to continue"
            />
          </p>
        </div>

        <div className="space-y-2">
          {orgs.map((org) => (
            <a
              key={org.org_id}
              href={pathsConfig.app.accountHome.replace(
                '[account]',
                org.org_id,
              )}
              onClick={() => setLastOrg(org.org_id)}
              className="hover:bg-accent block w-full rounded-lg border p-4 text-left transition-colors"
              data-test="org-picker-item"
            >
              <span className="font-medium">{org.org_name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
