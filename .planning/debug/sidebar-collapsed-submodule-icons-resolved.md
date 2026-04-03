---
status: awaiting_human_verify
trigger: "Sidebar submodules do not render well when sidebar is collapsed. Submodules should show icons but currently show truncated/hidden text labels."
created: 2026-04-02T00:00:00Z
updated: 2026-04-02T01:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — When sidebar collapses to icon mode, the SidebarGroupLabel (module header) disappears via group-data-[collapsible=icon]:opacity-0 and submodule items inside CollapsibleContent are hidden. There is no flyout or DropdownMenu to access submodules in icon mode. The previous fix added icons to submodules in expanded mode only — it did not address icon mode access.
test: N/A — root cause confirmed through code inspection
expecting: N/A
next_action: Use useSidebar() in ModuleSidebarNavigation. When sidebar open===false (icon mode), render a DropdownMenu per module showing submodule items. When open===true (expanded), render existing Collapsible accordion pattern unchanged.

## Symptoms

expected: When sidebar is collapsed, submodules should display icons (similar to how top-level modules show icons in collapsed state)
actual: Submodule text labels get truncated or hidden when sidebar collapses — no icons shown
errors: No errors — visual/UX issue
reproduction: Collapse the sidebar and look at the submodule items
started: Never worked — feature gap, not a regression

## Eliminated

## Evidence

- timestamp: 2026-04-02T00:00:00Z
  checked: module-sidebar-navigation.tsx submodule rendering
  found: SidebarMenuButton wraps <a href={subModulePath}>{sm.display_name}</a> — no icon, no tooltip prop
  implication: When sidebar collapses to icon size, SidebarMenuButton shrinks to 8×8px (group-data-[collapsible=icon]:size-8!) and overflow-hidden clips the text. No icon survives the collapse.

- timestamp: 2026-04-02T00:00:00Z
  checked: workspace-sidebar.tsx StaticNavigationItems
  found: Each item renders <item.Icon className="h-4 w-4" /><span>{item.label}</span> inside the button — icon survives collapse because SVG is first child; span gets truncated/hidden
  implication: The pattern for collapsed icon visibility is: SVG icon first child of button content, plus tooltip prop on SidebarMenuButton for label

- timestamp: 2026-04-02T00:00:00Z
  checked: SidebarMenuButton implementation in sidebar.tsx line 534–607
  found: Supports tooltip prop — if provided, wraps button in Tooltip that shows on right side when sidebar is collapsed (hidden={isMobile || open})
  implication: Adding tooltip={sm.display_name} to SidebarMenuButton enables label display on hover when collapsed

- timestamp: 2026-04-02T00:00:00Z
  checked: module-icons.config.ts
  found: Only module-level icons defined (human_resources, inventory, operations, growing, food_safety)
  implication: Need to add a getSubModuleIcon function covering all sub_module_slug values from seed data

- timestamp: 2026-04-02T00:00:00Z
  checked: seed/dev.sql — all sub_module slugs
  found: employees, departments, time_off, payroll, products, warehouses, stock_counts, task_tracking, checklists, seed_batches, harvests, inspections, incidents
  implication: Need icon mappings for all 13 sub-module slugs

## Resolution

root_cause: When the sidebar collapses to icon mode (open===false), the SidebarGroupLabel (module header trigger) is hidden via group-data-[collapsible=icon]:opacity-0 and CollapsibleContent hides all submodule items. The previous fix added icons to submodules in expanded accordion mode only. In icon mode, there was no path to access submodules — no flyout, no dropdown.

fix: |
  1. Added getSubModuleIcon() to app/config/module-icons.config.ts (previous fix, already in place).
  2. Updated app/components/sidebar/module-sidebar-navigation.tsx:
     - Import useSidebar from @aloha/ui/shadcn-sidebar
     - Import DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger from @aloha/ui/dropdown-menu
     - Use useSidebar() to get open (sidebar expanded/collapsed)
     - When open===false (icon mode): render a SidebarMenuButton wrapped in DropdownMenuTrigger per module; DropdownMenuContent shows all submodule links with icons
     - When open===true (expanded): render the existing Collapsible accordion pattern unchanged (preserves the previous fix)

verification: typecheck passes (no errors), format passes, lint errors are all pre-existing unrelated issues in other files

files_changed:
  - app/config/module-icons.config.ts
  - app/components/sidebar/module-sidebar-navigation.tsx
