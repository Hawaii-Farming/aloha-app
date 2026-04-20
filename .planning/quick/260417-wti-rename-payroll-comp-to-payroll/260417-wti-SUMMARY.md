---
id: 260417-wti
type: quick
status: complete
---

# Quick Task 260417-wti — Summary

Overrode sub-module display name `Payroll Comp` → `Payroll` in `deriveNavigation` at `app/lib/workspace/org-workspace-loader.server.ts`. Sidebar, navbar search palette, and any other consumer that reads from the `subModules` list now show "Payroll".

DB `app_sub_module.sub_module_display_name` remains "Payroll Comp" (hosted Supabase, not modified).
