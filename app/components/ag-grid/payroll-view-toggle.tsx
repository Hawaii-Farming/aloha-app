import { useEffect, useState } from 'react';

import { createPortal } from 'react-dom';

import { useSearchParams } from 'react-router';

import { cn } from '@aloha/ui/utils';

// Resolve the navbar slot once on mount. The slot is rendered by
// WorkspaceNavbar and is stable for the lifetime of the shell.
function useNavbarFilterSlot(): HTMLElement | null {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot portal target lookup on mount
    setEl(document.getElementById('workspace-navbar-filter-slot'));
  }, []);
  return el;
}

export function PayrollViewToggle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') ?? 'by_task';
  const slot = useNavbarFilterSlot();

  const handleToggle = (view: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('view', view);
    setSearchParams(next, { preventScrollReset: true });
  };

  if (!slot) return null;

  const segmentClass = (active: boolean) =>
    cn(
      'h-8 rounded-full px-4 text-sm font-medium transition-colors',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    );

  return createPortal(
    <div
      className="border-border bg-background inline-flex h-9 items-center rounded-full border p-0.5"
      data-test="payroll-view-toggle"
      role="group"
      aria-label="View"
    >
      <button
        type="button"
        onClick={() => handleToggle('by_task')}
        className={segmentClass(currentView === 'by_task')}
        data-test="view-toggle-by-task"
      >
        By Department
      </button>
      <button
        type="button"
        onClick={() => handleToggle('by_employee')}
        className={segmentClass(currentView === 'by_employee')}
        data-test="view-toggle-by-employee"
      >
        By Employee
      </button>
    </div>,
    slot,
  );
}
