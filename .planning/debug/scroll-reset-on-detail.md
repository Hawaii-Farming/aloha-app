---
status: awaiting_human_verify
trigger: "scroll-reset-on-detail: expanding AG Grid inline detail rows causes scroll reset to top"
created: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two causes: (1) No getRowId passed so AG Grid treats rowData changes as full replacement, (2) Changing rowData array length with pagination triggers scroll/page reset
test: Traced code path through detail-row-wrapper -> ag-grid-list-view -> ag-grid-wrapper
expecting: Fix by using AG Grid API transactions instead of rowData replacement, or by saving/restoring scroll position
next_action: Implement fix using grid API to save/restore scroll position and pass getRowId

## Symptoms

expected: Scroll position stays stable when expanding/collapsing inline detail rows
actual: Scroll jumps to top on row expand/collapse
errors: None - UX behavior issue
reproduction: HR register submodule > scroll down > click row to expand inline details
started: Recent - multiple fix attempts in commits 90f54da, 4f466a4, 147ae78, 9d03cff

## Eliminated

## Evidence

- timestamp: 2026-04-08T00:00:00Z
  checked: detail-row-wrapper.tsx useDetailRow hook
  found: Hook returns getRowId but ag-grid-list-view.tsx never destructures or passes it to AgGridWrapper
  implication: Without getRowId, AG Grid treats every rowData change as a full data replacement, resetting scroll/pagination

- timestamp: 2026-04-08T00:01:00Z
  checked: AG Grid docs on rowData updates with getRowId
  found: When getRowId is provided, AG Grid creates Transaction Updates under the hood -- diffs old vs new data, only adds/removes/updates changed rows. This preserves scroll position, selection, and other grid state.
  implication: Simply passing getRowId will fix the scroll reset because AG Grid will use transactions instead of full replacement

- timestamp: 2026-04-08T00:02:00Z
  checked: Git history of fix attempts (commits 9d03cff, 4f466a4, 90f54da, dac8758)
  found: getRowId was removed in 9d03cff to fix detail rows appearing on wrong pagination page. Scroll save/restore was added in 90f54da but removed in dac8758 as it didn't work with the 99999 pageSize hack.
  implication: The getRowId was removed for a different reason (pagination page placement), but postSortRows now handles that. Re-adding getRowId should be safe.

- timestamp: 2026-04-08T00:03:00Z
  checked: getRowId implementation in detail-row-wrapper.tsx
  found: Uses pkColumn field -- regular rows get "123", detail rows get "123_detail" (unique IDs for both)
  implication: Row IDs are unique and stable, which is what AG Grid needs for transaction diffing

## Resolution

root_cause: useDetailRow hook returns getRowId but ag-grid-list-view.tsx never passes it to AgGridWrapper. Without getRowId, AG Grid treats every rowData change (from expand/collapse) as a complete data replacement, which resets scroll position and pagination state. With getRowId, AG Grid uses internal Transaction Updates that diff old vs new data and preserve all grid state.
fix: Destructure getRowId from useDetailRow and pass it to AgGridWrapper. Two-line change in ag-grid-list-view.tsx.
verification: typecheck passes, all 66 AG Grid tests pass
files_changed: [app/components/ag-grid/ag-grid-list-view.tsx]
