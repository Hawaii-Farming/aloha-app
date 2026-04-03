'use client';

import { useContext } from 'react';

import { useNavigate } from 'react-router';

import { Building2 } from 'lucide-react';

import { SidebarContext } from '@aloha/ui/shadcn-sidebar';

import pathsConfig from '~/config/paths.config';
import { setLastOrg } from '~/lib/org-storage';

export function OrgSelector(params: {
  selectedAccount: string;
  userId: string;
  variant?: 'default' | 'pill';

  accounts: Array<{
    label: string | null;
    value: string | null;
    image: string | null;
  }>;
}) {
  const navigate = useNavigate();
  const ctx = useContext(SidebarContext);
  const collapsed = !ctx?.open;
  const isPill = params.variant === 'pill';

  const selectedLabel =
    params.accounts.find((a) => a.value === params.selectedAccount)?.label ??
    params.selectedAccount;

  const handleChange = (value: string) => {
    if (value) {
      setLastOrg(value);
    }

    const path = value
      ? pathsConfig.app.accountHome.replace('[account]', value)
      : pathsConfig.app.home;

    navigate(path, { replace: true });
  };

  if (isPill) {
    return (
      <span className="-mr-1 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <select
          value={params.selectedAccount}
          onChange={(e) => handleChange(e.target.value)}
          className="-mr-2 cursor-pointer appearance-none bg-transparent p-0 text-sm font-medium text-inherit focus:outline-none"
        >
          {params.accounts.map((account) => (
            <option key={account.value} value={account.value ?? ''}>
              {account.label ?? account.value}
            </option>
          ))}
        </select>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={params.selectedAccount}
        onChange={(e) => handleChange(e.target.value)}
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
