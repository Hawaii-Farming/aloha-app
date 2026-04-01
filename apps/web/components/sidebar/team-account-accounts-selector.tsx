'use client';

import { useContext } from 'react';

import { useNavigate } from 'react-router';

import { SidebarContext } from '@aloha/ui/shadcn-sidebar';

import pathsConfig from '~/config/paths.config';
import { setLastOrg } from '~/lib/org-storage';

export function TeamAccountAccountsSelector(params: {
  selectedAccount: string;
  userId: string;

  accounts: Array<{
    label: string | null;
    value: string | null;
    image: string | null;
  }>;
}) {
  const navigate = useNavigate();
  const ctx = useContext(SidebarContext);
  const collapsed = !ctx?.open;

  const selectedLabel =
    params.accounts.find((a) => a.value === params.selectedAccount)?.label ??
    params.selectedAccount;

  return (
    <div className="flex items-center gap-2">
      <select
        value={params.selectedAccount}
        onChange={(e) => {
          const value = e.target.value;

          if (value) {
            setLastOrg(value);
          }

          const path = value
            ? pathsConfig.app.accountHome.replace('[account]', value)
            : pathsConfig.app.home;

          navigate(path, { replace: true });
        }}
        className={
          collapsed
            ? 'hidden'
            : 'bg-background text-foreground border-input rounded-md border px-2 py-1 text-sm'
        }
      >
        {params.accounts.map((account) => (
          <option key={account.value} value={account.value ?? ''}>
            {account.label ?? account.value}
          </option>
        ))}
      </select>

      {collapsed ? (
        <span className="text-xs font-medium">{selectedLabel?.charAt(0)}</span>
      ) : null}
    </div>
  );
}
