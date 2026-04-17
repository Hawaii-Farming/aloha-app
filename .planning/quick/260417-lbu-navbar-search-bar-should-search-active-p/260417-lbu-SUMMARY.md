---
phase: quick-260417-lbu
plan: 01
subsystem: workspace-shell
tags: [navbar, search, ag-grid, command-palette, context]
dependency_graph:
  requires:
    - app/components/navbar-search.tsx (existing)
    - app/components/ag-grid/ag-grid-list-view.tsx (existing)
    - app/components/ag-grid/ag-grid-wrapper.tsx (quickFilterText prop already supported)
    - app/routes/workspace/layout.tsx (existing SidebarProvider tree)
  provides:
    - ActiveTableSearchProvider + useActiveTableSearch + useRegisterActiveTable (new context)
    - "Filter <active page>" command row inside navbar palette
  affects:
    - Any AG Grid list view rendered via AgGridListView now participates in the unified palette search
tech_stack:
  added: []
  patterns:
    - React 19 `use(Context)` pattern (mirrors ai-chat-provider)
    - Controlled cmdk CommandInput with ref-guarded open-transition reset
key_files:
  created:
    - app/components/active-table-search-context.tsx
  modified:
    - app/components/navbar-search.tsx
    - app/components/ag-grid/ag-grid-list-view.tsx
    - app/routes/workspace/layout.tsx
decisions:
  - "Registration keyed by subModule slug; unregister is a no-op unless the current slug matches — guards fast route-change races"
  - "Active-table query clears on unmount AND on registration-to-different-slug — filter never leaks across pages"
  - "`open→true` transition is ref-guarded so the controlled-input reset does not trip `react-hooks/set-state-in-effect`"
  - "Active Page group rendered ABOVE Modules/Pages so the primary affordance is visually prominent while typing"
  - "No `/` shortcut added (UI-RULES.md mentions it, but plan scoped it out — deferred)"
  - "workspace-navbar.tsx intentionally NOT modified (plan frontmatter listed it defensively; no tweak needed since NavbarSearch reads context internally)"
metrics:
  duration: ~8 minutes
  completed: "2026-04-17T15:30:05Z"
---

# Quick Task 260417-lbu: Navbar Search Filters Active Page Rows — Summary

Unified the navbar command palette so typing + selecting a new "Filter &lt;page&gt;" row applies AG Grid's client-side `quickFilterText` to the visible table — zero new per-table search inputs, UI-RULES.md §Search upheld.

## Files Actually Changed

| File | Status | Commit |
| --- | --- | --- |
| `app/components/active-table-search-context.tsx` | created | `226d6a8` |
| `app/routes/workspace/layout.tsx` | modified (provider mount) | `226d6a8` |
| `app/components/ag-grid/ag-grid-list-view.tsx` | modified (consume + register) | `226d6a8` |
| `app/components/navbar-search.tsx` | modified (controlled input + Active Page row) | `7d8af43` |
| `app/components/workspace-shell/workspace-navbar.tsx` | **NOT modified** (plan frontmatter listed it defensively; no change needed) | — |

## New Context Hook Call Site Inside AgGridListView

```tsx
const subModuleSlug = params.subModule ?? config?.tableName ?? 'unknown';
const pkColumn = config?.pkColumn ?? 'id';

const { query } = useActiveTableSearch();
useRegisterActiveTable(subModuleSlug, subModuleDisplayName ?? subModuleSlug);
```

And the forwarded prop (one-line addition to the existing `<AgGridWrapper>` block):

```tsx
<AgGridWrapper
  gridRef={gridRef}
  colDefs={allColDefs}
  rowData={tableData.data as RowData[]}
  quickFilterText={query}        // ← new
  onRowClicked={handleRowClicked}
  ...
/>
```

## New CommandItem Render Block in NavbarSearch

```tsx
{activeTable && input.trim().length > 0 && (
  <CommandGroup heading="Active Page">
    <CommandItem
      value={`filter-active-table ${input}`}
      keywords={[input, activeTable.displayName, 'filter', 'rows']}
      onSelect={handleFilterActiveTable}
      data-test="navbar-search-filter-active-table"
    >
      <Filter className="mr-2 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Filter {activeTable.displayName} rows matching &quot;{input.trim()}&quot;
      </span>
    </CommandItem>
  </CommandGroup>
)}
```

Handler:

```tsx
const handleFilterActiveTable = () => {
  const trimmed = input.trim();
  if (!trimmed || !activeTable) return;
  setQuery(trimmed);
  setOpen(false);
};
```

## Commits

| # | Commit | Message |
| - | ------ | ------- |
| 1 | `226d6a8` | `feat(quick-260417-lbu): add ActiveTableSearchContext + wire AgGridListView` |
| 2 | `7d8af43` | `feat(quick-260417-lbu): add "Filter <active page>" row to navbar palette` |

## Verification

**Automated (completed):**

- `pnpm typecheck` — clean after Task 1 and Task 2.
- `pnpm build` — production build succeeds (all routes compile, no new warnings tied to these files).
- ESLint + Prettier — `lint-staged` ran on each commit. One deviation: initial Task 2 commit failed on `react-hooks/set-state-in-effect` for the `setInput('')` call; resolved by guarding the reset with `lastOpenRef` + targeted eslint-disable-next-line with justification comment (same pattern used in `app/routes/workspace/layout.tsx` for the drawer-close effect).

**Manual smoke (Task 3) — NOT EXECUTED BY AGENT:**

The 12-step Task 3 smoke test requires an authenticated session on a real org account with populated AG Grid pages (Register + an alternate AG Grid list + a detail route + the home route) and cross-theme visual confirmation. The executor agent **started the dev server (confirmed reachable on `http://localhost:5173/` returning HTTP 302 to auth)** but did not attempt to drive the browser through the 12-step checklist — that is a human verification step by design.

**Owner action required — please run the following against commit `7d8af43` on branch `design`:**

1. `pnpm dev` and sign in.
2. Navigate to `/home/<account>/human_resources/register`. Confirm the table renders.
3. Press `Cmd+K` (or `Ctrl+K`). Type a substring that matches at least one visible row's cell text (e.g. part of an employee's last name).
4. EXPECT: The palette shows the existing "Modules"/"Pages" groups AND a new top group "Active Page" with one item: `Filter Register rows matching "<query>"`. Existing nav items still fuzzy-filter by your query.
5. Select that "Filter ..." item (Enter or click). The palette closes. The Register table is now filtered to rows whose cells contain `<query>` (case-insensitive). Row count drops.
6. Re-open the palette (`Cmd+K`). Input should be empty. Table filter is still applied. Close again with Escape — no change.
7. Re-open palette, type a new query, select "Filter ..." again. Table re-filters to the new query.
8. Navigate to a different sub-module's list page (another AG Grid list). EXPECT: table is unfiltered (previous filter cleared on unmount).
9. Navigate to the home page (`/home/<account>`). Open the palette. EXPECT: no "Active Page" group appears no matter what you type.
10. Navigate to a detail route (click a row on Register). Open palette. EXPECT: no "Active Page" group (detail route does not register).
11. Confirm no per-table search input was added anywhere (UI-RULES.md §Search upheld).
12. Toggle dark mode — palette + filter command row readable in both themes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] ESLint `react-hooks/set-state-in-effect` blocked Task 2 commit**

- **Found during:** Task 2, on `git commit` (pre-commit ESLint hook)
- **Issue:** The plan specified a 2-line `useEffect(() => { if (open) setInput(''); }, [open]);` reset. ESLint correctly flagged the synchronous `setInput` inside an effect body as a "cascading render" risk — the rule did not exist when this pattern was common and is now enforced project-wide.
- **Fix:** Guarded the reset with a `lastOpenRef` so setState only runs on the false→true transition (exact pattern used in `app/routes/workspace/layout.tsx` for drawer-close). Added a targeted `eslint-disable-next-line` with justification ("transition guarded by ref; runs only on closed→open"). Added `useRef` to the React import list. Behavior identical to plan intent.
- **Files modified:** `app/components/navbar-search.tsx` (only)
- **Commit:** `7d8af43`

### Frontmatter-vs-reality reconciliation

**Plan frontmatter listed `app/components/workspace-shell/workspace-navbar.tsx` in `files_modified`.** The plan body explicitly marked this as a defensive-listing safety net ("If the mod is not actually needed at execution time, leave the file untouched and update the SUMMARY to reflect actual files changed."). No change was needed — `NavbarSearch` consumes `useActiveTableSearch()` internally; the navbar's `<NavbarSearch items={searchItems} .../>` call site is unchanged. File left untouched as the plan authorized.

### Out-of-scope items deliberately not wired

- **`TableListView` (legacy TanStack table path):** Some non-AG-Grid sub-module configs still render via the legacy list. Those pages do NOT call `useRegisterActiveTable` and therefore don't get the "Active Page" row. This matches the plan's explicit scope note and is acceptable for this atomic task.
- **`/` keyboard shortcut:** UI-RULES.md §Search mentions `/` as a secondary palette-open shortcut. Plan scoped this out; only Cmd/Ctrl+K continues to open the palette.
- **Server-paged flows:** AG Grid `quickFilterText` only filters rows currently loaded on the client. For any list view that opts into server-side pagination, filtering applies to the current page only. This is the known AG Grid quick-filter semantic and matches the user's brief ("search rows within the active page's table").

## Self-Check: PASSED

**Files:**

- `app/components/active-table-search-context.tsx` — FOUND (129 lines, committed in `226d6a8`)
- `app/routes/workspace/layout.tsx` — MODIFIED (provider mounted between SidebarProvider and inner div)
- `app/components/ag-grid/ag-grid-list-view.tsx` — MODIFIED (imports + hook call + quickFilterText)
- `app/components/navbar-search.tsx` — MODIFIED (controlled input + Active Page group + handler)
- `app/components/workspace-shell/workspace-navbar.tsx` — INTENTIONALLY UNCHANGED

**Commits:**

- `226d6a8` — FOUND in `git log`
- `7d8af43` — FOUND in `git log`

**Verification:**

- `pnpm typecheck` — PASSED
- `pnpm build` — PASSED
- ESLint (via lint-staged on commit) — PASSED on both commits after Rule 3 fix
- Manual 12-step smoke — OWNER ACTION REQUIRED (see above)
