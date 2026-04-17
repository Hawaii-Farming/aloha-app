import { useEffect, useRef, useState } from 'react';

import { Outlet, useLocation } from 'react-router';

import { z } from 'zod';

import { PageLayoutStyle } from '@aloha/ui/page';
import { SidebarProvider } from '@aloha/ui/shadcn-sidebar';

import { ActiveTableSearchProvider } from '~/components/active-table-search-context';
import { WorkspaceSidebar } from '~/components/sidebar/workspace-sidebar';
import { WorkspaceMobileDrawer } from '~/components/workspace-shell/workspace-mobile-drawer';
import { WorkspaceMobileHeader } from '~/components/workspace-shell/workspace-mobile-header';
import { WorkspaceNavbar } from '~/components/workspace-shell/workspace-navbar';
import { layoutStyleCookie, sidebarStateCookie } from '~/lib/cookies';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
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

export default function TeamWorkspaceLayout(props: Route.ComponentProps) {
  const { layoutState, workspace, accountSlug } = props.loaderData;

  const user = workspace.user;
  const userForShell = { email: user.email ?? null };

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
            account={accountSlug}
            user={user}
            orgName={workspace.currentOrg?.org_name ?? null}
            navigation={workspace.navigation}
            className="hidden md:flex"
          />
          <WorkspaceMobileHeader
            user={userForShell}
            onOpenDrawer={() => setDrawerOpen(true)}
            drawerOpen={drawerOpen}
            hamburgerRef={hamburgerRef}
          />

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="hidden md:block">
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

          <WorkspaceMobileDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            account={accountSlug}
            navigation={workspace.navigation}
            hamburgerRef={hamburgerRef}
          />
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
