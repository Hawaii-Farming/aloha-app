---
status: awaiting_human_verify
trigger: "registry-icon-flicker: Employee pictures/icons flicker on any event in AG Grid"
created: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Focus

hypothesis: Inline `postSortRows` function in AgGridInner creates new reference on every render, causing AG Grid to re-sort and refresh cells (unmounting/remounting img elements)
test: Memoize postSortRows with useCallback, verify images stop flickering
expecting: Images remain stable on checkbox clicks and other interactions
next_action: Apply fix -- wrap postSortRows in useCallback

## Symptoms

expected: Employee pictures/icons in the AG Grid should remain stable and not flicker during interactions
actual: Images disappear and reappear (flash blank) on any event — checkbox clicks, button clicks, sorting, filtering
errors: No error messages — purely visual flicker
reproduction: Open registry submodule, click any checkbox, click any button, sort a column — images will flicker
started: Likely since AG Grid was introduced

## Eliminated

## Evidence

- timestamp: 2026-04-08
  checked: ag-grid-wrapper.tsx postSortRows prop
  found: Inline arrow function on line 149 creates new reference on every render of AgGridInner
  implication: AG Grid detects changed postSortRows prop -> re-sorts rows -> cell renderers unmount/remount -> images reload and flicker

- timestamp: 2026-04-08
  checked: ag-grid-wrapper.tsx modules and paginationPageSizeSelector props
  found: Both `modules={[AllCommunityModule]}` and `paginationPageSizeSelector={[10, 25, 50, 100]}` create new array refs each render
  implication: Additional unstable references that could trigger AG Grid internal updates

- timestamp: 2026-04-08
  checked: AVATAR_COL and CHECKBOX_COL definitions in ag-grid-list-view.tsx
  found: Both are module-level constants with AvatarRenderer as a stable component reference
  implication: Column definitions are stable -- not the cause

- timestamp: 2026-04-08
  checked: allColDefs memoization in ag-grid-list-view.tsx
  found: Properly memoized with useMemo, deps are stable between renders
  implication: Column defs not the cause

- timestamp: 2026-04-08
  checked: rowData from useDetailRow
  found: Memoized with useMemo on sourceData reference, which is stable between re-renders (comes from loaderData)
  implication: Row data not the cause

## Resolution

root_cause: Inline `postSortRows` arrow function in AgGridInner created a new function reference on every React re-render. AG Grid's React wrapper detects changed grid option props via shallow comparison. Each new `postSortRows` reference triggered AG Grid to re-process row sorting, which caused cell renderers (including avatar image cells) to unmount and remount -- making images disappear briefly while reloading. Additionally, `modules` and `paginationPageSizeSelector` inline arrays created unstable references.
fix: (1) Wrapped postSortRows in useCallback with empty deps (pure function, no closures). (2) Extracted modules array and page size selector to module-level constants (AG_GRID_MODULES, PAGE_SIZE_SELECTOR) so they maintain stable references across renders.
verification: TypeScript typecheck passes. Needs manual verification that images no longer flicker on checkbox clicks, button clicks, sorting, and filtering.
files_changed: [app/components/ag-grid/ag-grid-wrapper.tsx]
