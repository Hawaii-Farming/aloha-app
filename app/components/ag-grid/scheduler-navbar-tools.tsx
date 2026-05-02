import { createPortal } from 'react-dom';

import { ChevronLeft, ChevronRight, History } from 'lucide-react';

import { Button } from '@aloha/ui/button';

interface SchedulerNavbarToolsProps {
  weekLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onHistoryOpen: () => void;
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
  onHistoryOpen,
}: SchedulerNavbarToolsProps) {
  const desktopSlot = getSlot('workspace-navbar-filter-slot');
  const mobileSlot = getSlot('workspace-mobile-header-filter-slot');

  const content = (
    <div className="flex items-center gap-2">
      {/* History button — FIRST (leftmost) */}
      <Button
        variant="outline"
        onClick={onHistoryOpen}
        data-test="history-toggle"
        aria-label="History"
        className="h-9 w-9 rounded-full p-0"
      >
        <History className="h-4 w-4" />
      </Button>

      {/* Week navigator pill — SECOND */}
      <div
        className="border-border bg-background inline-flex items-center overflow-hidden rounded-full border"
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
          className="text-foreground hover:bg-muted border-border border-x px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
          data-test="week-nav-today"
        >
          {weekLabel}
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
    </div>
  );

  return (
    <>
      {desktopSlot ? createPortal(content, desktopSlot) : null}
      {mobileSlot ? createPortal(content, mobileSlot) : null}
    </>
  );
}
