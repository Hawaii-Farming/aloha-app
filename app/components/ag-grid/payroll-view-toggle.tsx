import { useEffect, useState } from 'react';

import { createPortal } from 'react-dom';

import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import { Database, User, Users } from 'lucide-react';

import { cn } from '@aloha/ui/utils';

type PayrollView = 'data' | 'by_task' | 'by_employee';

function useNavbarFilterSlot(): HTMLElement | null {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot portal target lookup on mount
    setEl(document.getElementById('workspace-navbar-filter-slot'));
  }, []);
  return el;
}

export function PayrollViewToggle() {
  const slot = useNavbarFilterSlot();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const account = params.account ?? '';
  const activeView: PayrollView = location.pathname.endsWith('/payroll_data')
    ? 'data'
    : searchParams.get('view') === 'by_employee'
      ? 'by_employee'
      : 'by_task';

  const go = (view: PayrollView) => {
    if (view === 'data') {
      navigate(`/home/${account}/human_resources/payroll_data`);
    } else {
      navigate(`/home/${account}/human_resources/payroll_comp?view=${view}`, {
        preventScrollReset: true,
      });
    }
  };

  if (!slot) return null;

  const segmentClass = (active: boolean) =>
    cn(
      'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    );

  return createPortal(
    <div
      className="border-border bg-background inline-flex h-10 items-center rounded-full border p-0.5"
      data-test="payroll-view-toggle"
      role="group"
      aria-label="Payroll view"
    >
      <button
        type="button"
        onClick={() => go('data')}
        className={segmentClass(activeView === 'data')}
        data-test="view-toggle-data"
        aria-label="Data"
        title="Data"
      >
        <Database className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => go('by_task')}
        className={segmentClass(activeView === 'by_task')}
        data-test="view-toggle-by-task"
        aria-label="By Department"
        title="By Department"
      >
        <Users className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => go('by_employee')}
        className={segmentClass(activeView === 'by_employee')}
        data-test="view-toggle-by-employee"
        aria-label="By Employee"
        title="By Employee"
      >
        <User className="h-4 w-4" />
      </button>
    </div>,
    slot,
  );
}
