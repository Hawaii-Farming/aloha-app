---
id: 260417-wti
type: quick
status: complete
---

# Quick Task 260417-wti

## Objective

Rename the "Payroll Comp" sidebar entry to just "Payroll". The hosted Supabase `app_sub_module` display_name can't be edited from Claude's side, so override the label in `deriveNavigation` at the loader.

## Change

File: `app/lib/workspace/org-workspace-loader.server.ts`

Inside the row loop, when `row.sub_module_slug === 'payroll_comp'`, override `display_name` to `'Payroll'` before pushing to `subModules`. All consumers (sidebar, navbar search palette, breadcrumb) read from this list so they pick up the new label.

## Verification

`pnpm typecheck` clean. Sidebar reads "Payroll" where it read "Payroll Comp".
