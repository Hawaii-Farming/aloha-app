# Quick Task 260402-jnh: Sidebar items dark grey when not selected

## Task 1: Add text-muted-foreground to non-active sidebar items

- **Files:** `app/components/sidebar/module-sidebar-navigation.tsx`
- **Action:** Add `cn()` utility and conditionally apply `text-muted-foreground` to 4 sites: collapsed module button, collapsed dropdown submodule links, expanded module collapsible trigger, expanded submodule menu buttons. Only applied when `!isActive` / `!isModuleActive`.
- **Verify:** `pnpm typecheck` passes
- **Done:** Non-selected items appear dark grey; selected items retain accent colors
