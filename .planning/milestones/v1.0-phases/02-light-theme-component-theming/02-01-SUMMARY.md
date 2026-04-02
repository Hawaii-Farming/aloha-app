---
phase: 02-light-theme-component-theming
plan: "01"
subsystem: css-theming
tags: [light-theme, css-tokens, oklch, sidebar, sonner, shadcn]
dependency_graph:
  requires: [01-foundation-dark-theme]
  provides: [light-palette-spec, light-root-tokens, shadow-nullification-light, sidebar-font-weight, sonner-verified]
  affects: [app/styles/shadcn-ui.css, app/styles/global.css, packages/ui/src/shadcn/sidebar.tsx, DESIGN.md]
tech_stack:
  added: []
  patterns:
    - "oklch :root token overrides for Supabase light palette"
    - "Per-theme green accent split: darker oklch(47% 0.165 160) in :root, brighter oklch(71.2% 0.184 160) in .dark"
    - "Border-depth system extended to light theme via :root shadow nullification"
key_files:
  created: []
  modified:
    - DESIGN.md
    - app/styles/shadcn-ui.css
    - app/styles/global.css
    - packages/ui/src/shadcn/sidebar.tsx
decisions:
  - "D-04 split green: :root uses oklch(47% 0.165 160) for contrast on white; .dark overrides restore oklch(71.2% 0.184 160) bright green"
  - "COMP-02 form input theming delivered via token inheritance (:root --input/--ring/--border) — no component file changes needed"
  - "Sonner toast verified using only semantic tokens — no changes needed"
  - "Removed redundant data-[active=true]:font-medium from SidebarMenuButton after adding font-medium to base class"
metrics:
  duration_seconds: 143
  completed_date: "2026-04-02"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 4
---

# Phase 02 Plan 01: Light Theme Foundation — Palette + Tokens + Components Summary

**One-liner:** Supabase light palette as complete oklch :root token set with per-theme green split, shadow nullification, and sidebar/sonner component alignment.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add complete light palette spec to DESIGN.md | 99b435b | DESIGN.md |
| 2 | Override :root tokens with Supabase light palette + shadow nullification | 1c1137d | app/styles/shadcn-ui.css, app/styles/global.css |
| 3 | Verify sonner toast theming + apply sidebar nav weight-500 | 8b23a15 | packages/ui/src/shadcn/sidebar.tsx |

## What Was Built

### Task 1 — DESIGN.md Light Mode Palette Spec
Added a complete "### Light Mode Palette" section to DESIGN.md inside "Section 2. Color Palette & Roles":
- Full semantic token table (19 tokens) with oklch values, hex approximations, and notes
- Light sidebar token table (8 tokens) per D-02 light sidebar requirement
- D-04 green accent note explaining the per-theme intensity split
- COMP-07 link color hierarchy sub-section with 4 light-mode link tiers
- Shadow nullification note tying light theme to the border-depth system
- Section status marked "Complete"

### Task 2 — CSS Token Implementation
**app/styles/shadcn-ui.css :root block:**
- Replaced all stock Shadcn `var(--color-*)` semantic token values with oklch Supabase light palette
- Near-white backgrounds (`oklch(99% 0 none)`), near-black text (`oklch(12% 0 none)`)
- Light gray scale for secondary/muted/accent surfaces (`oklch(96% 0 none)`)
- Supabase-style borders: `--border: oklch(89% 0 none)`, `--input: oklch(85% 0 none)`
- Green focus ring: `--ring: oklch(47% 0.165 160)` (darker green for WCAG contrast on white)
- Light sidebar: near-white background, dark-gray nav text, darker green active/accent tokens
- Green link tokens: `--supabase-green-link` and `--supabase-green-border` overridden to darker green for light mode (COMP-07)

**app/styles/shadcn-ui.css .dark block:**
- Added `--supabase-green-link: oklch(71.2% 0.184 160)` to restore bright green for dark mode
- Added `--supabase-green-border: oklch(73.5% 0.158 162 / 0.3)` to restore bright green border for dark mode
- All existing dark block tokens unchanged from Phase 1

**app/styles/global.css:**
- Added `:root` shadow nullification block inside `@layer base` (matching existing `.dark` block)
- Border-depth system now applies to both themes consistently

### Task 3 — Component Updates
**packages/ui/src/shadcn/sidebar.tsx:**
- Added `font-medium` to `sidebarMenuButtonVariants` base class string
- Removed redundant `data-[active=true]:font-medium` (base class covers all items now)
- All sidebar nav links now render at weight-500 in both themes (COMP-01)

**packages/ui/src/shadcn/sonner.tsx:**
- Verified: all classNames use semantic token classes only (bg-background, text-foreground, border-border, text-muted-foreground, bg-primary, bg-muted)
- Verified: zero hardcoded color classes
- Verified: shadow-lg preserved (intentional toast elevation)
- No changes needed — already correctly themed (COMP-08)

## Requirements Delivered

| Requirement | Delivery |
|-------------|----------|
| FOUND-04 | Light palette spec complete in DESIGN.md |
| FOUND-05 | :root token overrides implemented in oklch |
| COMP-01 | Sidebar nav links all use font-medium (weight 500) |
| COMP-02 | Form inputs themed via --input/--ring/--border token inheritance |
| COMP-07 | Green link tokens have per-theme contrast values |
| COMP-08 | Sonner toast verified using semantic palette tokens |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all tokens are concrete oklch values, no placeholder or TODO values.

## Threat Flags

None — purely static CSS token overrides with no new network endpoints, auth paths, or file access patterns.

## Self-Check: PASSED

- DESIGN.md exists: FOUND
- app/styles/shadcn-ui.css exists: FOUND
- app/styles/global.css exists: FOUND  
- packages/ui/src/shadcn/sidebar.tsx exists: FOUND
- Commit 99b435b: FOUND (DESIGN.md task)
- Commit 1c1137d: FOUND (CSS tokens task)
- Commit 8b23a15: FOUND (component task)
