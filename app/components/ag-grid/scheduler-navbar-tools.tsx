import { createPortal } from 'react-dom';

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Printer,
  Trash2,
} from 'lucide-react';

import { Button } from '@aloha/ui/button';

interface SchedulerNavbarToolsProps {
  weekLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCopyFromPrev: () => void;
  copyPending: boolean;
  onDeleteWeek: () => void;
  deletePending: boolean;
  onPrint: () => void;
}

// Slots rendered by WorkspaceNavbar (desktop) and WorkspaceMobileHeader (mobile).
// Both exist in the DOM at all viewports — their parent headers toggle
// visibility via `hidden md:flex` / `md:hidden`. We portal into both so the
// tools follow whichever header is visible.
function getSlot(id: string): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.getElementById(id);
}

export function SchedulerNavbarTools({
  weekLabel,
  onPrev,
  onNext,
  onToday,
  onCopyFromPrev,
  copyPending,
  onDeleteWeek,
  deletePending,
  onPrint,
}: SchedulerNavbarToolsProps) {
  const desktopSlot = getSlot('workspace-navbar-filter-slot');
  const mobileSlot = getSlot('workspace-mobile-header-filter-slot');

  const content = (
    <div className="flex min-w-0 items-center gap-1.5 lg:gap-2">
      {/* Week navigator pill */}
      <div
        className="border-border bg-background inline-flex shrink-0 items-center overflow-hidden rounded-full border"
        data-test="week-navigator"
      >
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous week"
          className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-9 w-9 items-center justify-center transition-colors"
          data-test="week-nav-prev"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          title="Jump to current week"
          className="text-foreground hover:bg-muted border-border border-x px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors lg:px-3"
          data-test="week-nav-today"
        >
          <span className="lg:hidden">Today</span>
          <span className="hidden lg:inline">{weekLabel}</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next week"
          className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-9 w-9 items-center justify-center transition-colors"
          data-test="week-nav-next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Copy-from-prev-week button — THIRD */}
      <Button
        variant="outline"
        onClick={onCopyFromPrev}
        disabled={copyPending}
        data-test="copy-from-prev-week"
        aria-label="Copy previous week"
        title="Copy previous week (only when current week is empty)"
        className="h-9 w-9 shrink-0 rounded-full p-0"
      >
        {copyPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>

      {/* Delete-week button — FOURTH */}
      <Button
        variant="outline"
        onClick={onDeleteWeek}
        disabled={deletePending}
        data-test="delete-week"
        aria-label="Delete week"
        title="Delete all records for this week"
        className="h-9 w-9 shrink-0 rounded-full p-0"
      >
        {deletePending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>

      {/* Print button — FIFTH (rightmost) */}
      <Button
        variant="outline"
        onClick={onPrint}
        data-test="print-schedule"
        aria-label="Print schedule"
        title="Print schedule"
        className="h-9 w-9 shrink-0 rounded-full p-0"
      >
        <Printer className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <>
      {desktopSlot ? createPortal(content, desktopSlot) : null}
      {mobileSlot ? createPortal(content, mobileSlot) : null}
    </>
  );
}
