---
id: 260417-wgi
type: quick
status: complete
---

# Quick Task 260417-wgi — Summary

## What Changed

- `app/components/workspace-shell/workspace-navbar.tsx` — search bar now in an `absolute inset-x-0 flex justify-center` overlay with `pointer-events-none` wrapper + `pointer-events-auto` inner `max-w-md w-full` container. Search is pinned to horizontal center no matter how wide the filter slot grows. Removed the `#workspace-navbar-action-slot` (added in quick-260417-wd1). Profile menu stays right-aligned via `ml-auto`.
- `app/components/ag-grid/payroll-view-toggle.tsx` — portal target switched from `#workspace-navbar-action-slot` → `#workspace-navbar-filter-slot`. Hook renamed from `useNavbarActionSlot` → `useNavbarFilterSlot`. Icon-only pill (Users + User) preserved.

## Why

Previous iteration moved the icon toggle to a right-side action slot to avoid pushing search. Problem: Filters button with active chip summary still consumed left-side space and pushed the normal-flow search rightward. Fix: take search out of the flow entirely via absolute centering — any width on the left/right clusters is irrelevant.

## Layout Result

```
[ filter-slot: toggle → Filters ] … [ search centered overlay ] … [ profile menu ]
```

## Verification

- `pnpm typecheck` clean.
- Render order preserved: toggle before Filters; both portal into filter-slot in JSX order.
