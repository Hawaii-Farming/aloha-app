# Quick Task 260402-k1p: Summary

**Task:** Move OrgSelector from sidebar header to profile dropdown
**Commit:** 2770ba3
**Date:** 2026-04-03

## What Changed

**workspace-sidebar.tsx:**
- Removed SidebarHeader containing OrgSelector
- Removed OrgSelector import
- Adjusted SidebarContent height calc
- Passes accounts + userId props to UserProfileDropdown

**user-profile-dropdown.tsx:**
- Added accounts/userId props
- Replaced plain "Organisation" link with embedded OrgSelector component
- OrgSelector renders under "Organisation" label in dropdown
- Still admin/owner gated
