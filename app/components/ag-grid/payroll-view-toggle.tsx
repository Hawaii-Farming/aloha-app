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

function useNavbarFilterSlots(): {
  desktop: HTMLElement | null;
  mobile: HTMLElement | null;
} {
  const [slots, setSlots] = useState<{
    desktop: HTMLElement | null;
    mobile: HTMLElement | null;
  }>({ desktop: null, mobile: null });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot portal target lookup on mount
    setSlots({
      desktop: document.getElementById('workspace-navbar-filter-slot'),
      mobile: document.getElementById('workspace-mobile-header-filter-slot'),
    });
  }, []);
  return slots;
}

export function PayrollViewToggle() {
  const { desktop: desktopSlot, mobile: mobileSlot } = useNavbarFilterSlots();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const account = params.account ?? '';
  const decodedPath = decodeURIComponent(location.pathname);
  const activeView: PayrollView = decodedPath.endsWith('/Payroll Data')
    ? 'data'
    : searchParams.get('view') === 'by_employee'
      ? 'by_employee'
      : 'by_task';

  const go = (view: PayrollView) => {
    if (view === 'data') {
      navigate(
        `/home/${account}/${encodeURIComponent('Human Resources')}/${encodeURIComponent('Payroll Data')}`,
      );
    } else {
      navigate(
        `/home/${account}/${encodeURIComponent('Human Resources')}/${encodeURIComponent('Payroll Comp')}?view=${view}`,
        {
          preventScrollReset: true,
        },
      );
    }
  };

  const segmentClass = (active: boolean) =>
    cn(
      'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    );

  const content = (
    <div
      className="border-border bg-background inline-flex h-10 shrink-0 items-center rounded-full border p-0.5"
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
    </div>
  );

  return (
    <>
      {desktopSlot ? createPortal(content, desktopSlot) : null}
      {mobileSlot ? createPortal(content, mobileSlot) : null}
    </>
  );
}
