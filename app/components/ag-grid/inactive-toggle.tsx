import { useCallback } from 'react';

import { createPortal } from 'react-dom';

import { useSearchParams } from 'react-router';

import { UserCheck, UserX } from 'lucide-react';

import { Button } from '@aloha/ui/button';

function getSlot(id: string): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.getElementById(id);
}

export function InactiveToggle() {
  const [searchParams, setSearchParams] = useSearchParams();
  const desktopSlot = getSlot('workspace-navbar-filter-slot');
  const mobileSlot = getSlot('workspace-mobile-header-filter-slot');

  const showingInactive = searchParams.get('inactive') === '1';

  const handleToggle = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (showingInactive) {
      next.delete('inactive');
    } else {
      next.set('inactive', '1');
    }
    next.delete('page');
    setSearchParams(next, { preventScrollReset: true });
  }, [searchParams, setSearchParams, showingInactive]);

  const content = (
    <Button
      variant={showingInactive ? 'default' : 'outline'}
      onClick={handleToggle}
      data-test="inactive-toggle"
      aria-pressed={showingInactive}
      title={
        showingInactive
          ? 'Showing inactive employees'
          : 'Show inactive employees'
      }
      className="h-9 shrink-0 gap-2 rounded-full px-3"
    >
      {showingInactive ? (
        <UserX className="h-4 w-4" />
      ) : (
        <UserCheck className="h-4 w-4" />
      )}
      <span className="hidden text-xs lg:inline">
        {showingInactive ? 'Inactive' : 'Active'}
      </span>
    </Button>
  );

  return (
    <>
      {desktopSlot ? createPortal(content, desktopSlot) : null}
      {mobileSlot ? createPortal(content, mobileSlot) : null}
    </>
  );
}
