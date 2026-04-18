---
id: 260417-wpd
type: quick
status: complete
---

# Quick Task 260417-wpd

## Objective

Visually merge Payroll Comp + Payroll Data into a single sidebar submodule. Add "Data" as a third option in the navbar toggle alongside By Department and By Employee.

## UX Outcome

- Sidebar shows only "Payroll Comp" (Payroll Data entry hidden).
- Navbar toggle becomes 3-way: [🗄️ Data] [👥 By Dept] [👤 By Employee].
- Selecting Data navigates to `/payroll_data`; selecting Dept/Employee navigates to `/payroll_comp?view=by_task|by_employee`.
- Toggle is visible on both routes with correct active state.

## Changes

### 1. `app/lib/workspace/org-workspace-loader.server.ts`

Skip `payroll_data` rows when deriving subModules — removes it from sidebar + navbar search palette. Route stays reachable via the toggle.

### 2. `app/components/ag-grid/payroll-view-toggle.tsx`

Rewrite as 3-way toggle using `useNavigate` + `useLocation` + `useParams`:

- `Database` icon → Data → navigates to `/home/:account/human_resources/payroll_data`
- `Users` icon → By Dept → `/payroll_comp?view=by_task`
- `User` icon → By Employee → `/payroll_comp?view=by_employee`

Active state derived from pathname + `view` search param.

### 3. `app/routes/workspace/sub-module.tsx`

Import `PayrollViewToggle` and render it when `subModuleSlug === 'payroll_data'` so the toggle shows up on that route too (already renders on payroll_comp via the custom list view).

## Verification

- `pnpm typecheck` clean.
- Sidebar lists Payroll Comp (not Payroll Data).
- Toggle on both `/payroll_comp` and `/payroll_data` pages with correct active pill.
