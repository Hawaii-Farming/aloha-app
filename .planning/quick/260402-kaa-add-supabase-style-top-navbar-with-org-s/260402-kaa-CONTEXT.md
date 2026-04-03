# Quick Task 260402-kaa: Supabase-style Top Navbar - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Task Boundary

Add a full Supabase-style top navbar with: org selector on left, breadcrumbs in center, notifications bell + profile avatar dropdown on right. Move profile dropdown from sidebar footer to navbar. Remove sidebar footer entirely.

</domain>

<decisions>
## Implementation Decisions

### Navbar vs Sidebar Boundary
- Sidebar keeps: module navigation + static nav items (Settings, Members)
- Sidebar loses: profile dropdown (moves to navbar), org selector (moves to navbar)
- Sidebar footer is removed entirely
- Sidebar collapse trigger moves to navbar left edge (far left)

### Breadcrumbs Behavior
- Route-derived, clickable breadcrumbs
- Auto-derive from URL pattern: Org > Module > Submodule > Record
- Each segment is a clickable link except the current (last) page
- Examples:
  - `/home/acme-farms/human_resources/employees` -> Acme Farms / Human Resources / Employees
  - `/home/acme-farms/human_resources/employees/123` -> Acme Farms / Human Resources / Employees / #123
  - `/home/acme-farms/settings` -> Acme Farms / Settings
- Display names should be human-readable (convert slugs: `human_resources` -> `Human Resources`)

### Notifications Bell
- Placeholder icon only (Bell icon from Lucide)
- No functionality, no badge — future feature hook
- Positioned between breadcrumbs and profile avatar

### Claude's Discretion
- Navbar height and styling to match Supabase aesthetic (border-b, dark bg, ~h-12/h-14)
- Breadcrumb separator character (/ or chevron)
- Avatar styling consistent with existing UserProfileDropdown

</decisions>

<specifics>
## Specific Ideas

- Layout: navbar spans full width above sidebar+content area
- Supabase reference: dark background, border-bottom, compact height
- Org selector uses existing OrgSelector component (already built)
- Profile uses existing UserProfileDropdown component (already built)
- Breadcrumbs need a new component that reads route params

</specifics>
