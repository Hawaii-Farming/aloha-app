import { Outlet } from 'react-router';

import { z } from 'zod';

import { PageLayoutStyle } from '@aloha/ui/page';
import { SidebarProvider, SidebarTrigger } from '@aloha/ui/shadcn-sidebar';

import { WorkspaceSidebar } from '~/components/sidebar/workspace-sidebar';
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

  const accounts = workspace.userOrgs.map(({ org_id, org_name }) => ({
    label: org_name,
    value: org_id,
    image: null,
  }));

  const user = workspace.user;

  return (
    <SidebarProvider defaultOpen={layoutState.open}>
      <WorkspaceSidebar
        account={accountSlug}
        navigation={workspace.navigation}
        user={user}
        accounts={accounts}
        accessLevelId={workspace.currentOrg.access_level_id}
      />

      <main className="flex h-svh flex-1 flex-col overflow-hidden">
        {/* Mobile header: hamburger menu to open sidebar sheet */}
        <div className="flex h-12 shrink-0 items-center border-b bg-background px-3 md:hidden">
          <SidebarTrigger className="text-muted-foreground h-5 w-5" />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <Outlet />
        </div>
      </main>
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
