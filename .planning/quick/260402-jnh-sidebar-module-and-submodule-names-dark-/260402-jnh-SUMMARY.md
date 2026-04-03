# Quick Task 260402-jnh: Summary

**Task:** Sidebar module and submodule names dark grey when not selected
**Commit:** 670e2c7
**Date:** 2026-04-03

## What Changed

Added `cn()` import and conditional `text-muted-foreground` class to all 4 navigation item sites in `app/components/sidebar/module-sidebar-navigation.tsx`:

1. Collapsed mode — module SidebarMenuButton (muted when no child active)
2. Collapsed mode — dropdown submodule links (muted when not active)
3. Expanded mode — CollapsibleTrigger module label (muted when module not active)
4. Expanded mode — submodule SidebarMenuButton (muted when not active)

Selected/active items retain their default sidebar accent foreground colors.
