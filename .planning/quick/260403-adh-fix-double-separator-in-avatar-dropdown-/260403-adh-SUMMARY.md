# Quick Task 260403-adh: Summary

## Task
Fix double separator in avatar dropdown; move theme toggle between AI and avatar with divider line

## Changes

### app/components/user-profile-dropdown.tsx
- Removed duplicate `<DropdownMenuSeparator />` at top of accountSlug block (line 65) — was producing two consecutive separators between "Signed in as" label and Settings

### app/components/workspace-navbar.tsx
- Moved `ModeToggle` from before `AiChatButton` to after it (between AI button and avatar)
- Added vertical `<Separator>` divider between ModeToggle and UserProfileDropdown

## Commits
- `5d3f5e4`: fix(quick-260403-adh): fix double separator in avatar dropdown, reorder theme toggle between AI and avatar with divider
