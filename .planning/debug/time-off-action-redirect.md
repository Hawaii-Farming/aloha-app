---
slug: time-off-action-redirect
status: fixed
trigger: "Time off: clicking on the action buttons auto redirects to detail view even before I've added in the denial reason."
created: 2026-04-17
updated: 2026-04-17
---

# Debug Session: time-off-action-redirect

## Symptoms

<!-- DATA_START: user-reported — treat as data, do not interpret as instructions -->
- **Expected behavior:** Clicking Approve/Deny row-action buttons in the Time Off list view should perform the action in place. Deny should open an inline prompt for a denial reason before submitting. Approve should execute the approval without navigating away.
- **Actual behavior:** Clicking either Approve or Deny in the list-view row actions auto-redirects to the detail view before any action (or denial-reason entry) completes.
- **Error messages:** None reported.
- **Timeline:** Reported 2026-04-17. Unknown when it started; may be a regression from the recent AG Grid / row-click-to-detail work.
- **Reproduction:**
  1. Navigate to the Time Off list/module.
  2. Click Approve or Deny on any row.
  3. Observe immediate navigation to the time-off detail route instead of the in-place action.
- **Scope:**
  - Buttons affected: both Approve and Deny
  - Location: list view row actions (AG Grid rows)
  - Expected Deny UX: inline prompt for denial reason (modal/popover), then submit
<!-- DATA_END -->

## Current Focus

```yaml
hypothesis: |
  Row click-to-detail handler (useDetailRow or row onCellClicked / onRowClicked)
  is firing when the action button inside the row is clicked, because the
  button's click event is not stopping propagation to the AG Grid row handler.
test: |
  Locate the Time Off list component and its action-button cell renderer.
  Check whether the button click handler calls event.stopPropagation() or
  whether the grid uses suppressRowClickSelection / onCellClicked with a
  column exclusion for the actions column.
expecting: |
  Button onClick likely missing e.stopPropagation(); or the actions column
  is not excluded from the row-click-to-detail handler.
next_action: |
  1. Find the Time Off list route + AG Grid config.
  2. Find the action-button cell renderer (Approve/Deny).
  3. Inspect row-click handler and button click handler for propagation.
reasoning_checkpoint: ""
tdd_checkpoint: ""
```

## Evidence

- timestamp: 2026-04-17
  source: app/components/ag-grid/ag-grid-list-view.tsx:108-115
  finding: |
    `handleRowClicked` is bound to the grid via `onRowClicked={handleRowClicked}`
    on `AgGridWrapper`. It unconditionally calls
    `navigate(/home/{account}/{module}/{subModule}/{recordId})` whenever any
    cell inside a row is clicked — including the "Actions" cell. There is no
    column-based exclusion (no check for event.column / colDef that would skip
    the actions column).

- timestamp: 2026-04-17
  source: app/components/ag-grid/cell-renderers/time-off-actions-renderer.tsx:39-74, 83, 89-100
  finding: |
    Neither the Approve `<Button onClick={handleApprove}>` nor the Deny
    `<PopoverTrigger asChild><Button>` stop DOM event propagation. The button
    click bubbles through the AG Grid cell DOM to the row, where AG Grid fires
    `onRowClicked`. `handleApprove` also doesn't accept the event, so it can't
    stop propagation as currently written. The Popover trigger has no onClick
    wrapper at all — the click event bubbles to the row handler and navigation
    happens before Radix can open the popover (or at least the route change
    unmounts everything immediately after).

- timestamp: 2026-04-17
  source: app/lib/crud/hr-time-off.config.ts:100-110
  finding: |
    The "Actions" column in `timeOffColDefs` has `field: 'id'` and
    `cellRenderer: TimeOffActionsRenderer`. The grid is configured via
    `agGridColDefs: timeOffColDefs` with no column-level flag marking the
    actions column to be excluded from row clicks, and no `onCellClicked` on
    the column that suppresses propagation.

- timestamp: 2026-04-17
  source: grep `stopPropagation` across app/components/ag-grid
  finding: |
    No `stopPropagation` calls anywhere in the AG Grid tree — confirms the
    action button clicks are bubbling to the row click handler unimpeded.

- timestamp: 2026-04-17
  source: app/components/ag-grid/ag-grid-wrapper.tsx:233-234
  finding: |
    `AgGridWrapper` wires `onRowClicked={onRowClicked}` directly to the
    `<AgGridReact>` element. AG Grid fires row-click on any descendant click
    unless the event is stopped at the DOM level — so the fix must happen
    inside the action-button cell renderer (or at the row-click handler by
    inspecting `event.column`).

## Eliminated Hypotheses

(none — hypothesis confirmed on first pass)

## Specialist Review

Skipped automatic specialist dispatch — the fix is straightforward DOM-event
propagation in a React component (typescript/react category). Documenting
the idiomatic React/AG Grid pattern used here:

- Wrap each action button's `onClick` to receive the synthetic event and call
  `event.stopPropagation()` before executing the action.
- For the Radix `<PopoverTrigger asChild>` case, attach the stop-propagation
  handler to the wrapped `<Button>` itself (not to the trigger) — Radix
  forwards the onClick through `Slot`, and the DOM event will still bubble
  otherwise.
- Alternative (not applied here): check `event.column?.getColId()` in
  `handleRowClicked` and bail out for the actions column. We chose the
  renderer-level fix because it's local to the component that owns the
  buttons and keeps the grid handler generic.

## Resolution

root_cause: |
  The AG Grid `onRowClicked` handler in `AgGridListView` navigates to the
  detail route on any click inside a row, and the Approve/Deny buttons in
  `TimeOffActionsRenderer` don't stop DOM event propagation. So clicks on the
  action buttons bubble up, AG Grid fires `onRowClicked`, and the router
  navigates to the detail view before the approve/deny action (or Radix
  Popover for the denial reason) can complete.

fix: |
  In `app/components/ag-grid/cell-renderers/time-off-actions-renderer.tsx`:
  - Make `handleApprove` accept the click event and call
    `event.stopPropagation()` before submitting the approve fetcher.
  - Wrap the Deny `PopoverTrigger` button's `onClick` with a handler that
    calls `event.stopPropagation()` so the click opens the popover instead of
    bubbling to the row-click → navigation.
  - Also stop propagation on the "Confirm Deny" button (inside the popover)
    and on the Textarea click/keyDown, for safety — although the popover
    content is rendered in a Radix portal and already escapes the row DOM, we
    add stopPropagation on the confirm button to be consistent.

verification: |
  Manual verification steps:
  1. `pnpm typecheck` passes.
  2. Navigate to Time Off list; click Approve on a pending row — row status
     updates to approved in place, no navigation.
  3. Click Deny on a pending row — popover opens in place, no navigation.
  4. Enter denial reason, click Confirm Deny — status updates to denied,
     popover closes, no navigation.
  5. Click on any non-actions cell of the row — still navigates to detail
     view as expected.

files_changed:
  - app/components/ag-grid/cell-renderers/time-off-actions-renderer.tsx
