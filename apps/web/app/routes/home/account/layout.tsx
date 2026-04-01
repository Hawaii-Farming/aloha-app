import { Outlet } from 'react-router';

import { z } from 'zod';

import { AiChatButton } from '@aloha/ai/ai-chat-button';
import { AiChatPanel } from '@aloha/ai/ai-chat-panel';
import { AiChatProvider } from '@aloha/ai/ai-chat-provider';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import {
  Page,
  PageLayoutStyle,
  PageMobileNavigation,
  PageNavigation,
} from '@aloha/ui/page';
import { SidebarProvider } from '@aloha/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { TeamAccountLayoutMobileNavigation } from '~/components/sidebar/team-account-layout-mobile-navigation';
import { TeamAccountLayoutSidebar } from '~/components/sidebar/team-account-layout-sidebar';
import { TeamAccountNavigationMenu } from '~/components/sidebar/team-account-navigation-menu';
import { layoutStyleCookie, sidebarStateCookie } from '~/lib/cookies';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';
import type { Route } from '~/types/app/routes/home/account/+types/layout';

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
      <Page style={'sidebar'}>
        <PageNavigation>
          <TeamAccountLayoutSidebar
            account={accountSlug}
            accountId={workspace.currentOrg.org_id}
            accounts={accounts}
            user={user}
            navigation={workspace.navigation}
          />
        </PageNavigation>

        <PageMobileNavigation className={'flex items-center justify-between'}>
          <AppLogo />

          <div className={'flex space-x-4'}>
            <TeamAccountLayoutMobileNavigation
              userId={user.id}
              accounts={accounts}
              account={accountSlug}
            />
          </div>
        </PageMobileNavigation>

        {props.children}
      </Page>
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
        <TeamAccountNavigationMenu workspace={workspace} accounts={accounts} />
      </PageNavigation>

      <PageMobileNavigation className={'flex items-center justify-between'}>
        <AppLogo />

        <div className={'group-data-[mobile:hidden]'}>
          <TeamAccountLayoutMobileNavigation
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
