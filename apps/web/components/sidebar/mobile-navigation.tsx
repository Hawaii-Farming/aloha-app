import { Link, useNavigate } from 'react-router';

import { Home, LogOut, Menu } from 'lucide-react';

import { useSignOut } from '@aloha/supabase/hooks/use-sign-out';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@aloha/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@aloha/ui/dropdown-menu';
import { Trans } from '@aloha/ui/trans';

import pathsConfig from '~/config/paths.config';
import { getWorkspaceSidebarConfig } from '~/config/workspace-navigation.config';

type Accounts = Array<{
  label: string | null;
  value: string | null;
  image: string | null;
}>;

export const MobileNavigation = (
  props: React.PropsWithChildren<{
    userId: string;
    account: string;
    accounts: Accounts;
  }>,
) => {
  const signOut = useSignOut();

  const Links = getWorkspaceSidebarConfig(props.account).routes.map(
    (item, index) => {
      if ('children' in item) {
        return item.children.map((child) => {
          return (
            <DropdownLink
              key={child.path}
              Icon={child.Icon}
              path={child.path}
              label={child.label}
            />
          );
        });
      }

      if ('divider' in item) {
        return <DropdownMenuSeparator key={index} />;
      }
    },
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Menu className={'h-9'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={10} className={'w-screen rounded-none'}>
        <TeamAccountsModal
          userId={props.userId}
          accounts={props.accounts}
          account={props.account}
        />

        {Links}

        <DropdownMenuSeparator />

        <SignOutDropdownItem onSignOut={() => signOut.mutateAsync()} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function DropdownLink(
  props: React.PropsWithChildren<{
    path: string;
    label: string;
    Icon: React.ReactNode;
  }>,
) {
  return (
    <DropdownMenuItem asChild>
      <Link
        to={props.path}
        className={'flex h-12 w-full items-center space-x-2 px-3'}
      >
        {props.Icon}

        <span>
          <Trans i18nKey={props.label} defaults={props.label} />
        </span>
      </Link>
    </DropdownMenuItem>
  );
}

function SignOutDropdownItem(
  props: React.PropsWithChildren<{
    onSignOut: () => unknown;
  }>,
) {
  return (
    <DropdownMenuItem
      className={'flex h-12 w-full items-center space-x-2'}
      onClick={props.onSignOut}
    >
      <LogOut className={'h-4'} />

      <span>
        <Trans i18nKey={'common:signOut'} />
      </span>
    </DropdownMenuItem>
  );
}

function TeamAccountsModal(props: {
  accounts: Accounts;
  userId: string;
  account: string;
}) {
  const navigate = useNavigate();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem
          className={'flex h-12 w-full items-center space-x-2'}
          onSelect={(e) => e.preventDefault()}
        >
          <Home className={'h-4'} />

          <span>
            <Trans i18nKey={'common:yourAccounts'} />
          </span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey={'common:yourAccounts'} />
          </DialogTitle>
        </DialogHeader>

        <div className={'flex flex-col gap-2 py-4'}>
          {props.accounts.map((account) => (
            <button
              key={account.value}
              className={`rounded-md border px-4 py-3 text-left text-sm ${
                account.value === props.account
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted'
              }`}
              onClick={() => {
                const path = account.value
                  ? pathsConfig.app.accountHome.replace(
                      '[account]',
                      account.value,
                    )
                  : pathsConfig.app.home;

                navigate(path, { replace: true });
              }}
            >
              {account.label ?? account.value}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
