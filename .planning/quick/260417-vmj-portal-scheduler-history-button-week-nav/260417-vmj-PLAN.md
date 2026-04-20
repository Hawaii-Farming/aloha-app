---
phase: quick-260417-vmj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/ag-grid/scheduler-navbar-tools.tsx
  - app/components/ag-grid/scheduler-list-view.tsx
autonomous: true
requirements:
  - QUICK-260417-vmj
must_haves:
  truths:
    - "Scheduler page navbar filter slot renders History button first, then Week navigator pill (left-to-right)"
    - "Clicking History in the navbar opens the Historical Data Sheet drawer (same behavior as before)"
    - "Clicking `<` / `>` / date label in the navbar navigates previous week / next week / current week (same behavior as before)"
    - "The scheduler body starts flush at the top — no local toolbar row remains above the AG Grid"
    - "data-test selectors `week-navigator`, `week-nav-prev`, `week-nav-today`, `week-nav-next`, `history-toggle` still resolve to the visible buttons (now in the navbar)"
    - "`pnpm typecheck` passes"
  artifacts:
    - path: "app/components/ag-grid/scheduler-navbar-tools.tsx"
      provides: "Portal component that renders History button + week navigator into #workspace-navbar-filter-slot"
      exports: ["SchedulerNavbarTools"]
    - path: "app/components/ag-grid/scheduler-list-view.tsx"
      provides: "Scheduler list view wired to SchedulerNavbarTools; old inline toolbar div removed"
      contains: "SchedulerNavbarTools"
  key_links:
    - from: "app/components/ag-grid/scheduler-navbar-tools.tsx"
      to: "#workspace-navbar-filter-slot"
      via: "createPortal(..., document.getElementById('workspace-navbar-filter-slot'))"
      pattern: "createPortal\\([\\s\\S]*workspace-navbar-filter-slot"
    - from: "app/components/ag-grid/scheduler-list-view.tsx"
      to: "SchedulerNavbarTools"
      via: "JSX render with props { currentWeek, onPrev, onNext, onToday, onHistoryOpen }"
      pattern: "<SchedulerNavbarTools"
---

<objective>
Move scheduler's History button and week navigator out of the scheduler body toolbar and portal them into the workspace navbar filter slot (`#workspace-navbar-filter-slot`), matching the pattern used by `NavbarFilterButton` for payroll_data/payroll_comp filters. History renders first (leftmost), then the week navigator pill.

Purpose: Visual parity with payroll filter placement — navbar is the single home for page-level chrome controls per the navbar/filter pattern established in `navbar-filter-button.tsx`. Scheduler body becomes flush with the AG Grid, matching the stripped-chrome table convention from UI-RULES.md.

Output: New `SchedulerNavbarTools` portal component + refactored `scheduler-list-view.tsx` with the local toolbar removed and the portal mounted next to `<Sheet>`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@UI-RULES.md

@app/components/navbar-filter-button.tsx
@app/components/workspace-shell/workspace-navbar.tsx
@app/components/ag-grid/scheduler-list-view.tsx

<interfaces>
<!-- Key contracts the executor needs. Copy these verbatim where applicable. -->

Portal slot (from workspace-navbar.tsx:100-104):
```tsx
<div
  id="workspace-navbar-filter-slot"
  data-test="workspace-navbar-filter-slot"
  className="flex shrink-0 items-center gap-2"
/>
```

Canonical portal hook (from navbar-filter-button.tsx:46-53 — reuse verbatim):
```tsx
function useNavbarFilterSlot(): HTMLElement | null {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot portal target lookup on mount
    setEl(document.getElementById('workspace-navbar-filter-slot'));
  }, []);
  return el;
}
```

State that must stay in scheduler-list-view (do NOT move):
- `const [historyOpen, setHistoryOpen] = useState(false);`          // line 289
- `const currentWeek = searchParams.get('week') ?? getCurrentWeekStart();`  // line 294
- `const handlePrev = useCallback(() => navigateWeek('prev'), [navigateWeek]);`   // line 316
- `const handleNext = useCallback(() => navigateWeek('next'), [navigateWeek]);`   // line 317
- `const handleToday = useCallback(() => navigateWeek('today'), [navigateWeek]);` // line 318
- `<Sheet open={historyOpen} onOpenChange={setHistoryOpen}>` drawer // line 593

Toolbar to remove (scheduler-list-view.tsx lines 521-568):
- Outer `<div className="flex shrink-0 flex-wrap items-center gap-2 pb-4">` containing week navigator pill + History button.

Required data-test attributes (preserve exactly):
- `week-navigator` (on the pill container)
- `week-nav-prev` (prev button)
- `week-nav-today` (center date button, jumps to today)
- `week-nav-next` (next button)
- `history-toggle` (history button)

Button styling to match navbar density (consistent with NavbarFilterButton `h-9 rounded-full`):
- History button: `variant="outline"`, `h-9 w-9 rounded-full p-0` (unchanged from current toolbar)
- Week pill: `h-9` on prev/next icon buttons (unchanged), center button keeps `px-3 py-1.5 text-xs`
- Container flex row: `gap-2` between History and week pill
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create SchedulerNavbarTools portal component</name>
  <files>app/components/ag-grid/scheduler-navbar-tools.tsx</files>
  <action>
Create a new component file `app/components/ag-grid/scheduler-navbar-tools.tsx` that portals History + week navigator into the workspace navbar filter slot.

Shape:
```tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';

import { Button } from '@aloha/ui/button';

interface SchedulerNavbarToolsProps {
  currentWeek: string;
  weekLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onHistoryOpen: () => void;
}

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
```

Notes:
- Pass `weekLabel` (the already-formatted string) as a prop rather than importing/re-running `formatWeekLabel` — keeps formatting owned by `scheduler-list-view.tsx`.
- `currentWeek` is kept in the props contract (even though `weekLabel` is the visible value) for future hooks/tests that may want the raw ISO string. If unused by TS/ESLint after write, drop it from the interface to avoid `no-unused-vars` — destructure only what is used.
- DRY note: the `useNavbarFilterSlot` hook is duplicated from `navbar-filter-button.tsx` on purpose (two small copies) to avoid cross-coupling; a shared helper can be extracted in a later pass if a third caller appears.
- Do NOT move `historyOpen` / `currentWeek` state here — those stay in scheduler-list-view per constraints.
- Use existing `@aloha/ui/button` — do not introduce new UI primitives.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
  </verify>
  <done>
File `app/components/ag-grid/scheduler-navbar-tools.tsx` exists, exports `SchedulerNavbarTools`, uses `createPortal` targeting `#workspace-navbar-filter-slot`, History button renders before week navigator, all five data-test attributes present, `pnpm typecheck` passes with no new errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire SchedulerNavbarTools into scheduler-list-view and remove inline toolbar</name>
  <files>app/components/ag-grid/scheduler-list-view.tsx</files>
  <action>
Refactor `app/components/ag-grid/scheduler-list-view.tsx` to mount the new portal component and remove the inline toolbar.

Changes:

1. **Imports (line 23)** — remove `ChevronLeft`, `ChevronRight`, `History` from the `lucide-react` import (they are now only used inside `SchedulerNavbarTools`). Keep `Plus` (still used by the floating create FAB on line 619).

   Before:
   ```tsx
   import { ChevronLeft, ChevronRight, History, Plus } from 'lucide-react';
   ```
   After:
   ```tsx
   import { Plus } from 'lucide-react';
   ```

2. **Add import** for the new component (group with other `~/components/ag-grid/*` imports):
   ```tsx
   import { SchedulerNavbarTools } from '~/components/ag-grid/scheduler-navbar-tools';
   ```

3. **Remove the entire toolbar div** (current lines 521-568 — the `{/* Toolbar — wraps on narrow viewports */}` block and its wrapper div). The outer `<div className="flex min-h-0 flex-1 flex-col" data-test="scheduler-list-view">` now contains only the `{/* Weekly Schedule — full width */}` block (current lines 570-590).

4. **Mount `<SchedulerNavbarTools>`** just before the `<Sheet>` drawer (current line 592) — as a sibling inside the top-level fragment, so it portals regardless of the scheduler body layout. Wire the existing callbacks:
   ```tsx
   <SchedulerNavbarTools
     currentWeek={currentWeek}
     weekLabel={formatWeekLabel(currentWeek)}
     onPrev={handlePrev}
     onNext={handleNext}
     onToday={handleToday}
     onHistoryOpen={() => setHistoryOpen(true)}
   />

   {/* Historical Data drawer */}
   <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
     ...
   ```

5. Do NOT touch: `historyOpen` state, `currentWeek` derivation, `navigateWeek`/`handlePrev`/`handleNext`/`handleToday` callbacks, the `<Sheet>` drawer, the floating create `Button`, `CreatePanel`, AG Grid setup.

6. If `formatWeekLabel` is now only referenced at the new mount site, leave it defined at file-scope (line 62) — it remains used.

Expected removals: ~48 lines of JSX (toolbar block). Expected additions: ~8 lines (one import + one JSX mount).
  </action>
  <verify>
    <automated>pnpm typecheck && pnpm lint:fix app/components/ag-grid/scheduler-list-view.tsx app/components/ag-grid/scheduler-navbar-tools.tsx</automated>
  </verify>
  <done>
- Inline toolbar div (old lines 521-568) removed from scheduler-list-view.tsx.
- `<SchedulerNavbarTools>` mounted with all 6 props wired.
- Unused `ChevronLeft`, `ChevronRight`, `History` imports removed; `Plus` retained.
- `pnpm typecheck` passes.
- `pnpm lint:fix` passes (no errors after autofix).
- Visual spot-check (manual, not required for automated verify): navigate to scheduler page, confirm History + week nav render in the top navbar filter slot, scheduler body AG Grid is flush under the navbar, History click still opens the drawer, `<` / `>` / date click still navigate weeks.
  </done>
</task>

</tasks>

<verification>
After both tasks:

1. `pnpm typecheck` — no new errors.
2. `pnpm lint:fix` — clean.
3. Grep check:
   ```
   Grep "week-navigator|week-nav-prev|week-nav-today|week-nav-next|history-toggle" app/components/ag-grid/scheduler-navbar-tools.tsx
   ```
   All five selectors present in the new file.
4. Grep check:
   ```
   Grep "ChevronLeft|ChevronRight|\\bHistory\\b" app/components/ag-grid/scheduler-list-view.tsx
   ```
   No matches (these icons are no longer used in scheduler-list-view).
5. Grep check:
   ```
   Grep "<SchedulerNavbarTools" app/components/ag-grid/scheduler-list-view.tsx
   ```
   Exactly one match, positioned before `<Sheet`.
</verification>

<success_criteria>
- Scheduler page renders History button + week navigator in the workspace navbar filter slot (left-to-right: History, then week pill).
- Scheduler body starts flush with the AG Grid — no remnant toolbar row.
- All existing scheduler e2e data-test selectors continue to resolve the same visible elements (now in the navbar).
- Behavior preserved: History click opens Sheet, `<`/`>`/date navigate weeks via existing `navigateWeek` logic.
- State (`historyOpen`, `currentWeek`, `setCreateOpen`, Sheet, CreatePanel) remains owned by `scheduler-list-view.tsx` — only the visual controls were portaled.
- `pnpm typecheck` and `pnpm lint:fix` pass.
- Atomic commit covering both files.
</success_criteria>

<output>
After completion, create `.planning/quick/260417-vmj-portal-scheduler-history-button-week-nav/260417-vmj-SUMMARY.md` capturing:
- Files touched (2: new `scheduler-navbar-tools.tsx`, modified `scheduler-list-view.tsx`).
- Lines added/removed.
- Verification commands run and their results.
- Any deviations from the plan (there should be none).
</output>
