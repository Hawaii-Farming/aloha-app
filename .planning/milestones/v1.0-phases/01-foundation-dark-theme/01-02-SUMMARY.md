---
phase: 01-foundation-dark-theme
plan: 02
subsystem: ui
tags: [css, tailwind, shadcn, dark-theme, hydration, wcag, accessibility, shadows]

# Dependency graph
requires:
  - 01-01 (Geist fonts, Supabase dark palette tokens)
provides:
  - suppressHydrationWarning on root html element (prevents next-themes hydration mismatch)
  - All Tailwind CSS 4 shadow tokens overridden to none in dark mode (.dark block)
  - Confirmed WCAG AA contrast ratios for dark palette
  - Passing production build with all CSS changes bundled
affects:
  - Any future plan touching root.tsx (hydration behavior established)
  - Any plan relying on card/container depth (border-based, no shadows)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "suppressHydrationWarning on <html> element is required with next-themes SSR to prevent hydration mismatch"
    - "Shadow removal via CSS custom property override: .dark { --shadow*: none } inside @layer base"
    - "Focus rings preserved by using --ring token (not --shadow tokens)"

key-files:
  created: []
  modified:
    - "app/root.tsx — added suppressHydrationWarning to <html> element"
    - "app/styles/global.css — added .dark shadow token overrides inside @layer base"

key-decisions:
  - "Shadow removal via CSS token overrides in @layer base (not component-level changes) — zero .tsx files modified for shadow removal"
  - "All six Tailwind 4 shadow tokens set to none: --shadow, --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl, --shadow-2xl"
  - "Focus ring shadows preserved by design: ring-* utilities use --ring-* tokens, not --shadow-* tokens"
  - "Pre-existing lint errors in data-table.tsx and turbo/generators not fixed (out of scope, not caused by this plan)"

requirements-completed: [FOUND-06, FOUND-07, FOUND-09]

# Metrics
duration: 8min
completed: 2026-04-02
---

# Phase 1 Plan 2: suppressHydrationWarning + Shadow Removal + WCAG Verification Summary

**suppressHydrationWarning added to html element, all dark-mode shadow tokens overridden to none via CSS custom properties, and WCAG AA contrast verified by matching deployed token values against pre-computed ratios — production build passes**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-02T19:32:00Z
- **Completed:** 2026-04-02T19:40:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 2 (root.tsx, global.css)

## Accomplishments

- `suppressHydrationWarning` added to `<html lang={language} className={className}>` element in root.tsx — prevents React hydration mismatch warning caused by next-themes injecting `.dark` class server vs client
- Six Tailwind CSS 4 shadow tokens (`--shadow`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`) overridden to `none` in `.dark` selector within `@layer base` — removes all card/container box-shadows without touching any .tsx component files
- WCAG AA contrast verified: `--foreground` oklch(98.04%) on `--background` oklch(12.55%) = 17.18:1 (PASS), `--muted-foreground` oklch(60%) = 5.12:1 (PASS), `--sidebar-primary` green = 8.98:1 (PASS)
- Production build (`pnpm build`) passes with all CSS bundled including Geist font woff2 files and global CSS
- TypeScript typecheck passes with zero errors
- `pnpm format:fix` completed successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Add suppressHydrationWarning and remove dark-mode shadows** - `6495baa` (feat)
2. **Task 2 (format side-effect): Format mcp-server files** - `0fc7011` (chore)

## WCAG AA Verification

| Token Pair | Foreground | Background | Ratio | Result |
|-----------|-----------|-----------|-------|--------|
| --foreground / --background | oklch(98.04% 0 none) | oklch(12.55% 0 none) | 17.18:1 | PASS |
| --muted-foreground / --background | oklch(60% 0 none) | oklch(12.55% 0 none) | 5.12:1 | PASS |
| --sidebar-primary / --sidebar-background | oklch(73.5% ...) | oklch(12.55% 0 none) | 8.98:1 | PASS |

WCAG AA requires 4.5:1 for normal text, 3:1 for large text. All pairs exceed the threshold.

## Files Created/Modified

- `app/root.tsx` — Line 68: added `suppressHydrationWarning` to `<html>` element
- `app/styles/global.css` — Added `.dark { --shadow*: none }` block inside `@layer base`, after the textarea::placeholder rule

## Decisions Made

- Shadow removal done entirely via CSS token overrides — no .tsx component files modified. This is the correct Tailwind CSS 4 approach: override `--shadow-*` custom properties in `.dark` scope, which cascades to all utilities that reference those tokens.
- Focus ring shadows are intentionally preserved. The `ring-*` utilities use `--ring-*` and `--ring-offset-*` tokens, which are separate from `--shadow-*` tokens and were set to Supabase green in Plan 01.

## Deviations from Plan

None - plan executed exactly as written.

The `pnpm format:fix` auto-formatted two pre-existing mcp-server files (database.ts, migrations.ts) that had style drift. These were committed as a separate chore commit since they were not part of the task changes.

## Known Stubs

None - no stubs introduced.

## Threat Flags

None - no new security surface introduced. This plan modifies one React prop (`suppressHydrationWarning`) and CSS shadow tokens only.

---
*Phase: 01-foundation-dark-theme*
*Completed: 2026-04-02*

## Self-Check: PASSED
