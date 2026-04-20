---
id: 260417-wpd
type: quick
status: complete
---

# Quick Task 260417-wpd — Summary

Visually merged Payroll Comp + Payroll Data into a single sidebar submodule controlled by a 3-way navbar toggle.

## Changes

- `app/lib/workspace/org-workspace-loader.server.ts` — `deriveNavigation` now skips `sub_module_slug === 'payroll_data'` rows so it's hidden from sidebar and navbar search. Route remains accessible via the toggle.
- `app/components/ag-grid/payroll-view-toggle.tsx` — rewritten as 3-way: Data (Database icon) → `/payroll_data`, By Dept (Users) → `/payroll_comp?view=by_task`, By Employee (User) → `/payroll_comp?view=by_employee`. Uses `useNavigate` + `useLocation` + `useParams`. Active state derived from pathname + `view` param. New `data-test="view-toggle-data"` added; existing selectors preserved.
- `app/routes/workspace/sub-module.tsx` — `<PayrollViewToggle />` mounted when `subModuleSlug === 'payroll_data'` so the toggle appears on that route too (already rendered on payroll_comp via the custom list view).

## Verification

- `pnpm typecheck` clean.
- Route `/payroll_data` still renders (via URL or toggle Data button) even though hidden from sidebar.
