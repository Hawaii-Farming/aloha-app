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
      <div className="relative inline-flex items-center">
        <Building2 className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-white" />
        <select
          value={params.selectedAccount}
          onChange={(e) => handleChange(e.target.value)}
          className="cursor-pointer appearance-none rounded-full bg-emerald-600 py-1 pr-3 pl-8 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          {params.accounts.map((account) => (
            <option key={account.value} value={account.value ?? ''}>
              {account.label ?? account.value}
            </option>
          ))}
        </select>
      </div>
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
