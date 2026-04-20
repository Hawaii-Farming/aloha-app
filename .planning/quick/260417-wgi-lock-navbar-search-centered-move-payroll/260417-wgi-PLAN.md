---
id: 260417-wgi
type: quick
status: complete
---

# Quick Task 260417-wgi

## Objective

Fix the workspace navbar so the search bar stays LOCKED in the horizontal center regardless of how wide the Filters button grows (active chip summary pushes it). Move the Payroll Comparison icon toggle back to the LEFT, BEFORE the Filters button.

## Tasks

### Task 1 — Absolute-center the search bar in navbar

File: `app/components/workspace-shell/workspace-navbar.tsx`

- Wrap the main navbar row in `relative` positioning.
- Extract `<NavbarSearch>` into an absolutely-positioned overlay centered via `absolute inset-x-0 flex justify-center`, with an inner `max-w-md w-full` wrapper.
- Apply `pointer-events-none` to the overlay container and `pointer-events-auto` to the inner wrapper so filter-slot and profile menu remain clickable.
- Keep `#workspace-navbar-filter-slot` on the left and profile menu right-aligned via `ml-auto`.
- Remove the experimental `#workspace-navbar-action-slot` (added in quick-260417-wd1) — no longer needed now that the toggle lives in the filter slot again.

### Task 2 — Move PayrollViewToggle back to filter slot

File: `app/components/ag-grid/payroll-view-toggle.tsx`

- Change portal target from `#workspace-navbar-action-slot` → `#workspace-navbar-filter-slot`.
- Rename internal `useNavbarActionSlot` → `useNavbarFilterSlot`.
- Keep icon-only pill (Users + User lucide icons).
- Render order in `payroll-comparison-list-view.tsx` stays `<PayrollViewToggle />` BEFORE `<NavbarFilterButton />`, so in the filter slot DOM order: [icon toggle] → [Filters button].

## Verification

- `pnpm typecheck` clean.
- Visual: Filters active with date range chip → search bar stays centered; toggle + Filters cluster on left; profile menu on right.
