import { useEffect, useState } from 'react';

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

export function SchedulerNavbarTools({
  weekLabel,
  onPrev,
  onNext,
  onToday,
  onHistoryOpen,
}: SchedulerNavbarToolsProps) {
  const slot = useNavbarFilterSlot();
  if (!slot) return null;

  return createPortal(
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
    </div>,
    slot,
  );
}
