import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import {
  Outlet,
  type ShouldRevalidateFunctionArgs,
  useLocation,
} from 'react-router';

import { z } from 'zod';

import { PageLayoutStyle } from '@aloha/ui/page';
import { SidebarProvider } from '@aloha/ui/shadcn-sidebar';

import { ActiveTableSearchProvider } from '~/components/active-table-search-context';
import { WorkspaceSidebar } from '~/components/sidebar/workspace-sidebar';
import { WorkspaceMobileHeader } from '~/components/workspace-shell/workspace-mobile-header';
import { WorkspaceNavbar } from '~/components/workspace-shell/workspace-navbar';

// Lazy-load the mobile drawer — it pulls in framer-motion (~150 KB) and
// only renders when the user opens the hamburger menu on mobile. Keeps
// the initial layout chunk lean for desktop visitors.
const WorkspaceMobileDrawer = lazy(() =>
  import('~/components/workspace-shell/workspace-mobile-drawer').then((m) => ({
    default: m.WorkspaceMobileDrawer,
  })),
);
import { layoutStyleCookie, sidebarStateCookie } from '~/lib/cookies';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { buildNavbarSearchItems } from '~/lib/workspace/build-search-items';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';
import type { Route } from '~/types/app/routes/workspace/+types/layout';

export const loader = async (args: Route.LoaderArgs) => {
  const accountSlug = args.params.account as string;

  const client = getSupabaseServerClient(args.request);
  const layoutState = await getLayoutState(args.request);

  const workspace = await loadOrgWorkspace({
    orgSlug: accountSlug,
    client,
    request: args.request,
  });

  return {
    workspace,
    layoutState,
    accountSlug,
  };
};

// Layout loader fetches workspace nav + employee context — both depend only
// on `accountSlug` and the session. Skip re-running it on every GET nav
// within the same account; revalidate on account switch and after any
// mutation (which may have changed permissions or org membership).
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  if (args.currentParams.account !== args.nextParams.account) return true;
  if (args.formMethod && args.formMethod.toUpperCase() !== 'GET') return true;
  return false;
}

export default function TeamWorkspaceLayout(props: Route.ComponentProps) {
  const { layoutState, workspace, accountSlug } = props.loaderData;

  const user = workspace.user;

  const searchItems = buildNavbarSearchItems({
    account: accountSlug,
    modules: workspace.navigation.modules,
    subModules: workspace.navigation.subModules,
  });

  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);

  // Auto-close drawer on route change — justified useEffect per CLAUDE.md
  // (no event fires for internal React Router navigation; observing
  // useLocation is the canonical pattern). Guarded with a ref so the
  // setState only fires on an actual pathname change, avoiding the
  // React Compiler "cascading render" warning for unconditional sets.
  const lastPathRef = useRef(location.pathname);
  useEffect(() => {
    if (lastPathRef.current !== location.pathname) {
      lastPathRef.current = location.pathname;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- route-change side effect; no event fires for internal React Router navigation
      setDrawerOpen(false);
    }
  }, [location.pathname]);

  return (
    <SidebarProvider defaultOpen={layoutState.open}>
      <ActiveTableSearchProvider>
        <div className="flex h-svh w-full flex-col">
          <WorkspaceNavbar
            user={user}
            orgName={workspace.currentOrg?.org_name ?? null}
            searchItems={searchItems}
            className="hidden lg:flex"
          />
          <WorkspaceMobileHeader
            user={user}
            orgName={workspace.currentOrg?.org_name ?? null}
            searchItems={searchItems}
            onOpenDrawer={() => setDrawerOpen(true)}
            drawerOpen={drawerOpen}
            hamburgerRef={hamburgerRef}
          />

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="hidden lg:block">
              <WorkspaceSidebar
                account={accountSlug}
                navigation={workspace.navigation}
                orgName={workspace.currentOrg?.org_name ?? null}
                userEmail={user.email ?? null}
              />
            </div>

            <main className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <Outlet />
              </div>
            </main>
          </div>

          {drawerOpen && (
            <Suspense fallback={null}>
              <WorkspaceMobileDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                account={accountSlug}
                navigation={workspace.navigation}
                hamburgerRef={hamburgerRef}
              />
            </Suspense>
          )}
        </div>
      </ActiveTableSearchProvider>
    </SidebarProvider>
  );
}

async function getLayoutState(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const sidebarOpenCookie = await sidebarStateCookie.parse(cookieHeader);
  const layoutCookie = await layoutStyleCookie.parse(cookieHeader);
  const layoutStyle = layoutCookie as PageLayoutStyle;

  const sidebarOpenCookieValue = sidebarOpenCookie
    ? sidebarOpenCookie !== 'false'
    : true;

  const parsed = z.enum(['header', 'sidebar', 'custom']).safeParse(layoutStyle);

  const style = parsed.success ? parsed.data : 'sidebar';

  return { open: sidebarOpenCookieValue, style };
}
