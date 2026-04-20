---
id: 260417-wsh
type: quick
status: complete
---

# Quick Task 260417-wsh

## Objective

When the Filters button is active (has applied values), drop the "Filters" label — leave just the icon and the chip summary (e.g. a date range). When inactive, keep showing "Filters".

## Change

File: `app/components/navbar-filter-button.tsx`

Swap the `<span>Filters</span>` + summary fragment for a ternary that renders the summary span when `activeCount > 0`, otherwise the "Filters" label.

## Verification

`pnpm typecheck` clean. Inactive state still reads as a standard Filters button.
