---
phase: quick-260417-v9t
plan: 01
subsystem: ui-scheduler
tags:
  - ui
  - refactor
  - ag-grid
  - scheduler
  - ui-rules-parity
requires: []
provides:
  - Scheduler floating Create button (UI-RULES §Floating Create parity)
affects:
  - app/components/ag-grid/scheduler-list-view.tsx
tech_stack:
  added: []
  patterns:
    - UI-RULES §Floating Create (`fixed right-10 bottom-10 z-30 h-14 w-14 rounded-full`, `variant="brand"`, `Plus h-6 w-6`)
    - Gate Create affordance on `(config?.formFields?.length ?? 0) > 0`
key_files:
  created: []
  modified:
    - app/components/ag-grid/scheduler-list-view.tsx
decisions:
  - Mirrored canonical `ag-grid-list-view.tsx` lines 255-265 exactly (no style drift)
  - Preserved toolbar's `<div className="ml-auto flex items-center gap-2">` wrapper with a single child (History) to minimize diff surface, per plan instruction
  - Placed floating button between `</Sheet>` and `<CreatePanel>` inside the React fragment, mirroring canonical ordering
metrics:
  duration: ~1min
  tasks: 1
  files: 1
  completed: 2026-04-18
commits:
  - 04126a2
---

# Quick 260417-v9t: Replace scheduler toolbar "+" with floating bottom-right Create Summary

Moved scheduler's Create icon button out of the top-right toolbar and into the standard UI-RULES §Floating Create bottom-right "+" position, bringing scheduler into visual parity with every other list view in the app (time-off, employees, departments, housing, register — all via `AgGridListView`). Scheduler uses a custom list view (`scheduler-list-view.tsx`) because of its week navigator + History drawer + full-width schedule-history detail rows, so the floating-button pattern was ported into that custom view rather than switching to `AgGridListView`.

## What Changed

Single atomic edit to `app/components/ag-grid/scheduler-list-view.tsx`:

### Region 1 — Toolbar (lines ~557-567): Create button removed

Before — toolbar right-side cluster had both History and Create:

```tsx
<div className="ml-auto flex items-center gap-2">
  <Button ... data-test="history-toggle" className="h-9 w-9 rounded-full p-0">
    <History className="h-4 w-4" />
  </Button>

  <Button
    variant="brand"
    onClick={() => setCreateOpen(true)}
    data-test="sub-module-create-button"
    aria-label="Create"
    className="h-9 w-9 rounded-full p-0"
  >
    <Plus className="h-4 w-4" />
  </Button>
</div>
```

After — only History remains in the toolbar (wrapper kept as-is with `ml-auto flex items-center gap-2` for minimal diff surface):

```tsx
<div className="ml-auto flex items-center gap-2">
  <Button ... data-test="history-toggle" className="h-9 w-9 rounded-full p-0">
    <History className="h-4 w-4" />
  </Button>
</div>
```

### Region 2 — Fragment root (between `</Sheet>` and `<CreatePanel>`): Floating Create added

```tsx
{(config?.formFields?.length ?? 0) > 0 && (
  <Button
    variant="brand"
    onClick={() => setCreateOpen(true)}
    data-test="sub-module-create-button"
    aria-label="Create"
    className="fixed right-10 bottom-10 z-30 h-14 w-14 rounded-full p-0 shadow-lg"
  >
    <Plus className="h-6 w-6" />
  </Button>
)}
```

This mirrors `ag-grid-list-view.tsx` lines 255-265 byte-for-byte, including the `config?.formFields` gate.

## What Was NOT Touched

- `const [createOpen, setCreateOpen] = useState(false)` — unchanged
- `<CreatePanel open={createOpen} onOpenChange={setCreateOpen} ... />` — unchanged
- Imports (`Button`, `Plus`, `History`, `Sheet`, `CreatePanel` — all already present, all still used)
- Week navigator (prev/next/today buttons, `formatWeekLabel`)
- History drawer (`<Sheet open={historyOpen} ...>`, `historyColDefs`, `historyData`, `historyLoading`)
- Full-width schedule-history detail rows (`isFullWidthRow`, `fullWidthCellRenderer`, `getRowHeight`)
- AG Grid column state (`handleColumnMoved`, `handleColumnResized`, `handleSortChanged`, `handleColumnVisible`)
- `otWarningRowClassRules`, `getRowId`, and any grid config
- Outer `<div className="flex min-h-0 flex-1 flex-col" data-test="scheduler-list-view">` wrapper

## Verification

| Check | Expected | Actual |
|-------|----------|--------|
| `grep -c 'data-test="sub-module-create-button"'` | 1 | 1 |
| `grep -c 'data-test="history-toggle"'` | 1 | 1 |
| `grep 'fixed right-10 bottom-10 z-30 h-14 w-14'` | 1 hit | 1 hit |
| `grep 'h-9 w-9 rounded-full p-0'` | 1 hit (History only) | 1 hit |
| `pnpm typecheck` | zero errors | zero errors |
| `pnpm format:fix` | cache hit, no changes | cache hit |
| `pnpm lint:fix` | no new warnings in edited file | no new warnings (4 pre-existing warnings in `packages/ui/src/shadcn/data-table.tsx` are unrelated/out-of-scope) |

## Decisions Made

1. **Exact byte-for-byte mirror of canonical.** Copied the floating-button JSX from `ag-grid-list-view.tsx` lines 255-265 without modification to prevent visual drift between scheduler and the canonical list view.

2. **Kept the `ml-auto flex items-center gap-2` wrapper with one child (History).** Plan explicitly instructed this to minimize diff surface — `ml-auto` still right-aligns, and `gap-2` is a no-op with a single child.

3. **Placed floating button as a sibling inside the fragment, between `</Sheet>` and `<CreatePanel>`.** Mirrors canonical ordering. `fixed` positioning detaches it from flex layout, so JSX-tree location is style-neutral — this position is chosen for readability/consistency, not layout reasons.

4. **Added the `(config?.formFields?.length ?? 0) > 0` gate.** Scheduler's config does have form fields today (otherwise Create wouldn't be wired), so in practice the button always renders — but the gate matches canonical behavior exactly and future-proofs against config changes.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: `app/components/ag-grid/scheduler-list-view.tsx` (modified, 12 insertions / 10 deletions)
- FOUND commit: `04126a2` — `refactor(quick-260417-v9t): move scheduler Create button to floating bottom-right per UI-RULES`
- Grep invariants: all 4 pass (counts match expected)
- Typecheck: zero errors
