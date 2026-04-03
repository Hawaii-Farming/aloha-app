import { Outlet } from 'react-router';

import { z } from 'zod';

import {
  Page,
  PageLayoutStyle,
  PageMobileNavigation,
  PageNavigation,
} from '@aloha/ui/page';
import { SidebarProvider } from '@aloha/ui/shadcn-sidebar';

import { AiChatButton } from '~/components/ai/ai-chat-button';
import { AiChatPanel } from '~/components/ai/ai-chat-panel';
import { AiChatProvider } from '~/components/ai/ai-chat-provider';
import { AppLogo } from '~/components/app-logo';
import { MobileNavigation } from '~/components/sidebar/mobile-navigation';
import { WorkspaceNavigationMenu } from '~/components/sidebar/navigation-menu';
import { WorkspaceSidebar } from '~/components/sidebar/workspace-sidebar';
import { WorkspaceNavbar } from '~/components/workspace-navbar';
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
  const { layoutState, workspace } = props.loaderData;

  return (
    <AiChatProvider orgName={workspace.currentOrg.org_name}>
      {layoutState.style === 'sidebar' ? (
        <SidebarLayout {...props}>
          <Outlet />
        </SidebarLayout>
      ) : (
        <HeaderLayout {...props}>
          <Outlet />
        </HeaderLayout>
      )}
      <AiChatPanel />
      <AiChatButton />
    </AiChatProvider>
  );
}

function SidebarLayout(props: React.PropsWithChildren<Route.ComponentProps>) {
  const { workspace, layoutState, accountSlug } = props.loaderData;

  const accounts = workspace.userOrgs.map(({ org_id, org_name }) => ({
    label: org_name,
    value: org_id,
    image: null,
  }));

  const user = workspace.user;

  return (
    <SidebarProvider defaultOpen={layoutState.open}>
      <WorkspaceNavbar
        account={accountSlug}
        accountId={workspace.currentOrg.org_id}
        accounts={accounts}
        user={user}
        accessLevelId={workspace.currentOrg.access_level_id}
      />

      <div className="mt-12 flex w-full [&_.peer>div:first-child]:h-[calc(100svh-3rem)] [&_.peer>div:nth-child(2)]:top-12 [&_.peer>div:nth-child(2)]:h-[calc(100svh-3rem)]">
        <WorkspaceSidebar
          account={accountSlug}
          navigation={workspace.navigation}
        />

        <main className="flex-1 overflow-y-auto">
          {props.children}
        </main>
      </div>
    </SidebarProvider>
  );
}

function HeaderLayout(props: React.PropsWithChildren<Route.ComponentProps>) {
  const { workspace, accountSlug } = props.loaderData;

  const accounts = workspace.userOrgs.map(({ org_id, org_name }) => ({
    label: org_name,
    value: org_id,
    image: null,
  }));

  return (
    <Page style={'header'}>
      <PageNavigation>
        <WorkspaceNavigationMenu workspace={workspace} accounts={accounts} />
      </PageNavigation>

      <PageMobileNavigation className={'flex items-center justify-between'}>
        <AppLogo />

        <div className={'group-data-[mobile:hidden]'}>
          <MobileNavigation
            userId={workspace.user.id}
            accounts={accounts}
            account={accountSlug}
          />
        </div>
      </PageMobileNavigation>

      {props.children}
    </Page>
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
