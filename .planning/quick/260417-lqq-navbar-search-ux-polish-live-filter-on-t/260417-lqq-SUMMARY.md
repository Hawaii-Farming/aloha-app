---
phase: quick-260417-lqq
plan: 01
subsystem: workspace-shell
tags: [navbar, search, command-palette, popover, ux-polish]
dependency_graph:
  requires:
    - app/components/navbar-search.tsx (existing, rewritten)
    - app/components/active-table-search-context.tsx (existing, untouched)
    - app/components/ag-grid/ag-grid-list-view.tsx (existing, untouched)
    - packages/ui/src/shadcn/popover.tsx (Popover, PopoverAnchor, PopoverContent)
    - packages/ui/src/shadcn/command.tsx (Command, CommandSeparator, others)
  provides:
    - Anchored Radix Popover palette (replaces CommandDialog modal)
    - Live-filter of active AG Grid table on every keystroke
    - X clear button with Esc-clear-first semantics
    - CommandSeparator hairline between groups
    - Non-interactive "Filtering <X> rows live" hint line
  affects:
    - All AG Grid list pages (active-table live-filter now keystroke-driven instead of Enter-committed)
tech_stack:
  added: []
  patterns:
    - Radix Popover + PopoverAnchor (asChild) wrapping a bare cmdk Command
    - Controlled CommandInput onValueChange -> setQuery(value.trim()) guarded by activeTable
    - Intercepted Esc on Command element to clear-before-close
    - Deterministic group ordering (Modules → Pages → Suggestions → extras) with interleaved CommandSeparator
key_files:
  created: []
  modified:
    - app/components/navbar-search.tsx
decisions:
  - "Replaced CommandDialog (centered Dialog-based modal) with Popover + PopoverAnchor for anchored combobox UX"
  - "Input row wrapped in a flex container with its own border-b; CommandInput's internal border-b neutralized via className='border-b-0' to avoid a double hairline"
  - "Live filter uses NO debounce — AG Grid cacheQuickFilter=true is fast for typical row counts; debounce deferred until a page confirms >10k rows (T-lqq-03 accepted risk)"
  - "Esc handler attached to <Command onKeyDown> so it runs before Radix's Escape-close handler (bubbling order works in Claude Opus 4.7 test; validated via typecheck)"
  - "Old 'Filter X rows matching Y' CommandItem removed in favor of a non-interactive hint line above groups (data-test='navbar-search-active-filter-hint'); filter now happens automatically on every keystroke"
  - "renderGroups extracted as a module-scope helper (not hook) since it takes no state and pure iteration is clearer than inline map + separator tracking"
  - "workspace-navbar.tsx intentionally NOT modified (plan-preferred); PopoverAnchor asChild forwards ref into consumer's native <button> without complaint"
  - "active-table-search-context.tsx + ag-grid-list-view.tsx intentionally NOT modified (zero-regression guard upheld)"
metrics:
  duration: ~10 minutes
  completed: "2026-04-17T20:49:30Z"
---

# Quick 260417-lqq: Navbar search UX polish — live filter, clear affordance, separator, anchored popover — Summary

**One-liner:** Rewrote the navbar palette as an anchored Radix Popover wrapping a bare cmdk Command primitive with live table-filter on every keystroke, an X clear button, an Esc-clear-first intercept, a visible CommandSeparator between groups, and a non-interactive filter hint — no prop-contract changes.

## What changed

Single-file rewrite of `app/components/navbar-search.tsx`.

### Palette chrome

- **Before:** `<CommandDialog open={open} ...>` — a centered Radix Dialog wrapping cmdk. Full-screen overlay, zoom-in animation, body-locked scroll.
- **After:** `<Popover open onOpenChange>` + `<PopoverAnchor asChild>{trigger}</PopoverAnchor>` + `<PopoverContent align="start" sideOffset={8} className="w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden p-0">` wrapping `<Command>`. Anchored below the trigger with left-edge alignment, DESIGN.md-tokened border + shadow-md + slide-in-from-top + fade + zoom animation.

### Live-filter on every keystroke

```ts
const handleInputChange = (value: string) => {
  setInput(value);
  if (activeTable) {
    setQuery(value.trim());
  }
};
```

- Passed to `<CommandInput onValueChange={handleInputChange} value={input} />`.
- Writes the trimmed string to `ActiveTableSearchContext` on every keystroke when an AG Grid list view has registered via `useRegisterActiveTable`.
- Non-list routes: `activeTable` is `null`, so the guard skips `setQuery` — no cross-page leak.

### Clear X button + Esc intercept

```tsx
{input.length > 0 && (
  <button
    type="button"
    data-test="navbar-search-clear"
    onClick={handleClear}
    aria-label="Clear search"
    className="text-muted-foreground hover:bg-accent hover:text-foreground mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
  >
    <X className="h-3.5 w-3.5" />
  </button>
)}
```

```ts
const handleClear = () => {
  setInput('');
  clearQuery();
  inputRef.current?.focus();
};

const handleCommandKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'Escape' && input.length > 0) {
    e.preventDefault();
    e.stopPropagation();
    handleClear();
  }
};
```

- Click X: clear input + `clearQuery()` + refocus input — popover stays open.
- First Esc on non-empty input: same as clicking X.
- Second Esc on empty input: falls through to Radix's default — popover closes.

### Group separator + interleave logic

```tsx
const GROUP_ORDER = ['Modules', 'Pages', 'Suggestions'] as const;

function renderGroups(grouped, handleSelect) {
  const knownOrdered = GROUP_ORDER.filter((g) => grouped.has(g));
  const extras = Array.from(grouped.keys())
    .filter((g) => !GROUP_ORDER.includes(g as (typeof GROUP_ORDER)[number]))
    .sort();
  const ordered = [...knownOrdered, ...extras];

  let visibleCount = 0;
  return ordered.map((heading) => {
    const groupItems = grouped.get(heading);
    if (!groupItems || groupItems.length === 0) return null;
    const showSeparator = visibleCount > 0;
    visibleCount += 1;
    return (
      <FragmentWithSeparator key={heading} showSeparator={showSeparator}>
        <CommandGroup heading={heading}>...</CommandGroup>
      </FragmentWithSeparator>
    );
  });
}
```

- `CommandSeparator` renders a `bg-border -mx-1 h-px` hairline (per shadcn default).
- Rendered only between groups that actually produce rows (visibleCount tracks render count, not index).
- Also rendered between the optional "Filtering … rows live" hint and the first group when present.

### Filter hint (replaces old Filter CommandItem)

```tsx
{activeTable && input.trim().length > 0 && (
  <>
    <div
      data-test="navbar-search-active-filter-hint"
      className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs"
    >
      <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Filtering{' '}
        <span className="text-foreground font-medium">{activeTable.displayName}</span> rows live
      </span>
    </div>
    <CommandSeparator />
  </>
)}
```

Non-interactive (no `CommandItem`, no `onSelect`). Purely informational — the actual filter happens automatically in `handleInputChange`.

## Preserved behaviors (zero-regression)

- **Cmd/Ctrl+K** still toggles the popover (existing `document.addEventListener('keydown')` effect untouched).
- **Cmd+K effect, lastOpenRef, input reset on open** preserved exactly.
- **Navigation via CommandItems** preserved — `handleSelect(path)` still does `navigate(path)` then `setOpen(false)`.
- **`data-test` selectors** preserved: `workspace-navbar-search-trigger` (consumer button), `navbar-search-trigger` (fallback), `navbar-search-item-<path>` (every nav row).
- **`NavbarSearchProps` contract** unchanged — `workspace-navbar.tsx` not touched; `PopoverAnchor asChild` forwards the ref transparently into the existing native `<button>`.
- **`ActiveTableSearchContext`** and **`AgGridListView`** diffs are empty. Registration/unregistration, `quickFilterText` wiring, and stale-query clearing on slug change all handled by the existing context.
- **UI-RULES.md §Search** upheld — no per-table search input added anywhere.
- **DESIGN.md tokens only** — `bg-popover`, `text-popover-foreground`, `border`, `shadow-md`, `bg-accent`, `text-muted-foreground`, `bg-border`, `text-foreground`. No raw hex.

## data-test diff

- **Removed:** `navbar-search-filter-active-table` (the CommandItem it labeled no longer exists).
- **Added:**
  - `navbar-search-clear` — the X clear button (conditional: only when input non-empty).
  - `navbar-search-active-filter-hint` — the informational hint line (conditional: only when activeTable && input non-empty).
  - `navbar-search-popover` — the PopoverContent wrapper (cheap E2E anchor).

## Deviations from Plan

None — plan executed exactly as written.

- Files modified: exactly `app/components/navbar-search.tsx` as anticipated. `workspace-navbar.tsx` NOT modified (plan-preferred outcome).
- No deviation rules triggered during execution.
- No auth gates.

## Verification

- `pnpm typecheck` → clean.
- `pnpm lint` → 0 errors, 4 pre-existing warnings in unrelated files (`table-list-view.tsx` logical-expression-in-deps, `data-table.tsx` TanStack incompatibility); no new warnings from `navbar-search.tsx`.
- `npx prettier --write app/components/navbar-search.tsx` → applied.
- Dev server boots: `pnpm dev` started, root URL returned `HTTP 302` (redirect to `/auth/sign-in`, expected for unauthenticated anon request). Server terminated after boot check.

## Owner action required — human smoke checklist (Task 2 checkpoint)

Run through the 21-step manual smoke per PLAN.md Task 2:

1. `pnpm dev`, sign in, navigate to `/home/<account>/human_resources/register`.
2. Confirm Register AG Grid renders with rows.
3. Click navbar search trigger or press **Cmd+K** (macOS) / **Ctrl+K** (else).
4. **EXPECT:** Popover opens **below the trigger**, left-aligned, ~520px wide, with border + shadow + fade/zoom/slide-down animation. Input auto-focused.
5. Type a substring matching at least one row's cell text (e.g. part of a last name).
6. **EXPECT (live filter):** Register table filters in real time as you type. No Enter, no CommandItem selection needed.
7. **EXPECT:** Muted "Filtering Register rows live" hint line appears above the groups.
8. **EXPECT:** Visible hairline separator between "Modules" and "Pages" groups. Also between the hint and Modules.
9. **EXPECT:** X icon button appears inside the input row on the right side.
10. Click the X. **EXPECT:** Input clears, table shows all rows, popover STAYS open, input refocused.
11. Type again. **EXPECT:** Live filter resumes.
12. Press **Esc**. First press on non-empty input clears; second press on empty input closes.
13. Re-open palette, type a query, click outside the popover. **EXPECT:** Popover closes; table filter PERSISTS (ephemeral input; persisted active-table query).
14. Reopen palette, type new query. **EXPECT:** Table re-filters live.
15. Click a Modules or Pages CommandItem. **EXPECT:** Navigate, popover closes, new page's filter (if any) is fresh.
16. Navigate to home (`/home/<account>`). Open palette. **EXPECT:** No hint line (no active table); typing filters cmdk only, no context write.
17. Navigate to a detail route (click a Register row). Open palette. **EXPECT:** No hint line (detail route is not a list).
18. Visual polish: anchored-not-centered; soft border + shadow; smooth animation; `bg-accent` for selected item; quiet `bg-border` separator.
19. Toggle dark mode. Repeat steps 3–12. **EXPECT:** All surfaces, borders, text, and X readable; WCAG AA contrast both directions.
20. Regression checks in devtools: `workspace-navbar-search-trigger`, `navbar-search-item-<path>` still resolve; new selectors `navbar-search-clear`, `navbar-search-active-filter-hint`, `navbar-search-popover` present; no per-table search input anywhere.
21. Register → Departments/Contractors (whichever is AG Grid list). Confirm filter clears on arrival and live-filter works there too.

**Resume signal:** Type "approved" or describe which of the 4 issues + bonus polish points still need work.

## Follow-ups (out of scope)

- `/` keyboard shortcut (Linear/GitHub pattern) — UI-RULES.md §Search mentions it; deferred since 260417-lbu, reaffirmed here as future quick task.
- Debounce on `setQuery` — only if a page is confirmed to exceed ~10k rows (T-lqq-03 mitigation path).
- Legacy `TableListView` palette wiring — still not done; consistent with 260417-lbu scope.

## Self-Check: PASSED

- **Files:**
  - `app/components/navbar-search.tsx` — FOUND (modified in commit `4e8c0f0`).
- **Commits:**
  - `4e8c0f0` — FOUND via `git log --oneline`.
- **Artifacts asserted by plan frontmatter:**
  - `navbar-search.tsx` contains `PopoverAnchor` ✓
  - `navbar-search.tsx` contains `CommandSeparator` ✓
  - `navbar-search.tsx` contains `useActiveTableSearch` ✓
  - `setQuery(.*trim` regex matches `setQuery(value.trim())` ✓
  - `PopoverAnchor asChild` literal present ✓
  - `clearQuery` symbol present ✓
  - `Popover open={open}` literal present ✓
