import type { JwtPayload } from '@supabase/supabase-js';

import {
  BorderedNavigationMenu,
  BorderedNavigationMenuItem,
} from '@aloha/ui/bordered-navigation-menu';

import { AppLogo } from '~/components/app-logo';
import { OrgSelector } from '~/components/sidebar/org-selector';
import { UserProfileDropdown } from '~/components/user-profile-dropdown';
import pathsConfig from '~/config/paths.config';
import { getWorkspaceSidebarConfig } from '~/config/workspace-navigation.config';

type AccountModel = {
  label: string | null;
  value: string | null;
  image: string | null;
};

export function WorkspaceNavigationMenu(props: {
  workspace: {
    currentOrg: { org_id: string; org_name: string };
    user: JwtPayload;
  };
  accounts: AccountModel[];
}) {
  const { currentOrg, user } = props.workspace;

  const routes = getWorkspaceSidebarConfig(currentOrg.org_id).routes.reduce<
    Array<{
      path: string;
      label: string;
      Icon?: React.ReactNode;
      end?: boolean | ((path: string) => boolean);
    }>
  >((acc, item) => {
    if ('children' in item) {
      return [...acc, ...item.children];
    }

    if ('divider' in item) {
      return acc;
    }

    return [...acc, item];
  }, []);

  return (
    <div className={'flex w-full flex-1 justify-between'}>
      <div className={'flex items-center space-x-8'}>
        <AppLogo href={pathsConfig.app.home} />

        <BorderedNavigationMenu>
          {routes.map((route) => (
            <BorderedNavigationMenuItem {...route} key={route.path} />
          ))}
        </BorderedNavigationMenu>
      </div>

      <div className={'flex justify-end space-x-2.5'}>
        <OrgSelector
          userId={user.id}
          selectedAccount={currentOrg.org_id}
          accounts={props.accounts}
        />

        <UserProfileDropdown user={user} />
      </div>
    </div>
  );
}
