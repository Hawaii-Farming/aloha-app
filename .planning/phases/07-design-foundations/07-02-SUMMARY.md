---
phase: 07-design-foundations
plan: 02
subsystem: design-tokens
tags: [design-system, tailwind-theme, fonts, shadows, dependencies]
requires:
  - 07-01
provides:
  - tailwind-inter-font-binding
  - tailwind-aloha-shadow-scale
  - tailwind-gradient-primary-utility
  - inter-variable-font-loaded
affects:
  - Tailwind utility generation (font-sans, font-heading, shadow-*, bg-gradient-primary)
  - Every route that renders body text (now Inter)
  - Phase 8 (primitive restyle) — consumes shadow-* utilities, --gradient-primary
tech-stack:
  added:
    - "@fontsource-variable/inter@5.2.8 (MIT, self-hosted woff2)"
  removed:
    - "@fontsource-variable/geist (replaced by Inter)"
  patterns:
    - "@theme block as single source for Tailwind token generation"
    - "Font strings match shadcn-ui.css byte-for-byte (Pitfall 1)"
    - "Shadow scale lives in @theme (theme.css), not forced-none in @layer base"
key-files:
  created: []
  modified:
    - app/styles/theme.css
    - app/styles/global.css
    - package.json
    - pnpm-lock.yaml
decisions:
  - "D-02 honored: @theme block remains single source for Tailwind --color-*/--font-*/--shadow-* generation"
  - "D-07 honored: Inter Variable via @fontsource-variable/inter replaces Geist for --font-sans/--font-heading"
  - "D-08 honored: Geist Mono retained for --font-mono"
  - "D-09 honored: Geist sans import removed from global.css, Inter added"
  - "D-11 honored: --shadow*: none lockout removed from both :root and .dark in @layer base"
  - "Pitfall 1 honored: font strings in theme.css match shadcn-ui.css byte-for-byte"
  - "Deferred --radius-radius cleanup untouched (Phase 10 scope per 07-RESEARCH §Open Questions #3)"
metrics:
  duration: ~2min
  tasks_completed: 3
  files_changed: 4
  completed: 2026-04-10
---

# Phase 7 Plan 02: Tailwind @theme + Font + Shadow Wiring Summary

## One-liner

Tailwind 4 `@theme` block wired to Inter Variable fonts, Aloha slate-alpha shadow scale, and `--color-gradient-primary` mapping; `global.css` imports Inter (not Geist) and no longer force-locks shadows to none; `package.json` swaps `@fontsource-variable/geist@5.2.8` for `@fontsource-variable/inter@5.2.8` with Geist Mono retained.

## What shipped

### Task 1 — theme.css @theme block (commit `ef43c91`)

In `app/styles/theme.css` inside the existing `@theme { ... }` block:

1. **Font strings swapped** to match `shadcn-ui.css` (Plan 01 output) byte-for-byte:
   - `--font-sans: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;`
   - `--font-heading: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;`
   - `--font-mono: 'Geist Mono Variable', 'Source Code Pro', Menlo, monospace;` (unchanged)

2. **Supabase-era orphans deleted** (their CSS vars were already removed by Plan 01):
   - Removed `--color-glass-surface: var(--glass-surface);`
   - Removed `--color-slate-alpha-wash: var(--slate-alpha-wash);`

3. **Gradient mapping added** so Tailwind generates `bg-gradient-primary`:
   - `--color-gradient-primary: var(--gradient-primary);`

4. **Aloha shadow scale added** inside `@theme` (values verbatim from 07-RESEARCH §Shadow Scale Recommendation):

```css
--shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.05);
--shadow: 0 1px 3px 0 rgb(15 23 42 / 0.10), 0 1px 2px -1px rgb(15 23 42 / 0.10);
--shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.10), 0 2px 4px -2px rgb(15 23 42 / 0.10);
--shadow-lg: 0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.10);
--shadow-xl: 0 20px 25px -5px rgb(15 23 42 / 0.10), 0 8px 10px -6px rgb(15 23 42 / 0.10);
--shadow-2xl: 0 25px 50px -12px rgb(15 23 42 / 0.25);
```

Prettier normalized `0.10` → `0.1` (numerically identical) and wrapped long lines across multiple lines on commit — acceptance criteria unaffected.

5. **Deferred untouched:** `--radius-radius: var(--radius);` left in place per 07-RESEARCH §Open Questions (RESOLVED) #3.

6. **All other entries unchanged:** `--color-*`, `--radius-sm/md/lg`, `--animate-*`, `@keyframes`, sidebar/chart/semantic mappings.

### Task 2 — global.css font import + shadow unlock (commit `7e9589e`)

In `app/styles/global.css`:

1. Replaced `@import '@fontsource-variable/geist/wght.css';` with `@import '@fontsource-variable/inter/wght.css';`
2. Retained `@import '@fontsource-variable/geist-mono/wght.css';`
3. Deleted the entire `:root { --shadow*: none; ... }` and `.dark { --shadow*: none; ... }` blocks from `@layer base`. Shadow values now flow from theme.css @theme.
4. Preserved `body { @apply bg-background text-foreground; ... }`, the universal border-color rule, and the placeholder-color rule.
5. Tailwind import, theme chain (`theme.css`, `theme.utilities.css`, `shadcn-ui.css`, `kit.css`, `tw-animate-css`), `@source` globs, `@variant dark`, and `@layer utilities .tech-label` untouched.

### Task 3 — package.json dependency swap (commit `5bd3065`)

Ran via pnpm (never hand-edited package.json — lockfile must be resolved by pnpm):

```
pnpm add -w @fontsource-variable/inter@5.2.8
pnpm remove -w @fontsource-variable/geist
```

**Lockfile delta summary:**
- Added: `@fontsource-variable/inter@5.2.8` (self-hosted woff2 under fontsource org, MIT, same pattern as Geist Mono).
- Removed: `@fontsource-variable/geist@5.2.8`.
- Retained: `@fontsource-variable/geist-mono@^5.2.7` (D-08).
- Net package count: ±0 (1 added, 1 removed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Tooling] `pnpm add @fontsource-variable/inter@5.2.8` rejected with `ERR_PNPM_ADDING_TO_ROOT`**
- **Found during:** Task 3 initial pnpm add invocation.
- **Issue:** This is a workspace monorepo (pnpm-workspace.yaml present), and pnpm refuses to add to the workspace root without an explicit `-w` flag.
- **Fix:** Retried with `pnpm add -w @fontsource-variable/inter@5.2.8` and `pnpm remove -w @fontsource-variable/geist`. This is the correct workspace-root operation matching the pattern used by the pre-existing `@fontsource-variable/geist-mono` entry (also in root `dependencies`).
- **Files modified:** package.json, pnpm-lock.yaml.
- **Commit:** `5bd3065`.

### No other deviations

All plan tasks executed exactly as written. Font strings in theme.css match shadcn-ui.css byte-for-byte (prettier's line-wrapping does not break Tailwind's string parsing — CSS whitespace/newlines inside a property value are collapsed).

## Informational: latent shadow-* utility hits

Per plan §Safety note (Pitfall 3), unlocking shadows may reveal latent `shadow-{sm,md,lg,xl,2xl}` utility usage on v1.0 components that previously rendered as `none`. `grep -rn "shadow-(sm|md|lg|xl|2xl)" app/ packages/` surfaced ~20 occurrences across 18 files, including:

- `packages/ui/src/shadcn/select.tsx`, `switch.tsx`, `dropdown-menu.tsx`, `navigation-menu.tsx`, `sonner.tsx`, `popover.tsx`, `sidebar.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`
- `packages/ui/src/kit/page.tsx`, `bordered-navigation-menu.tsx`, `card-button.tsx`, `cookie-banner.tsx`, `marketing/cta-button.tsx`
- `app/components/sidebar/workspace-sidebar.tsx`
- `app/components/ag-grid/payroll-comparison-list-view.tsx`, `payroll-comp-manager-list-view.tsx`

These components will now render with the Aloha slate-alpha shadow scale. Visual smoke check is deferred to Plan 07-03 (home + register submodule, light + dark) per plan text. Per D-15, any unintended visual regression is a Phase 8/9 concern, not a blocker for Phase 7.

## Verification

- **Task 1 grep acceptance:** all positive and negative patterns pass on theme.css.
- **Task 2 grep acceptance:** all positive and negative patterns pass on global.css. No `--shadow*: none` remains in `@layer base`.
- **Task 3 grep acceptance:** all positive and negative patterns pass on package.json. `pnpm-lock.yaml` updated.
- `pnpm typecheck`: PASS (0 errors, no TS/TSX touched).
- `pnpm lint`: 0 errors. 4 pre-existing warnings in `packages/ui/src/{kit,shadcn}/data-table.tsx` (TanStack Table React Compiler incompatibility — out of scope per SCOPE BOUNDARY, not introduced by this plan).
- Visual smoke verification (Inter rendering on every route, shadows appearing on hoverable surfaces, light+dark contrast) is deferred to Plan 07-03 per plan text.

## Known Stubs

None. Every token has a concrete value; no placeholder strings, no TODOs, no empty arrays feeding UI.

## Self-Check: PASSED

- FOUND: app/styles/theme.css (modified — Inter fonts, shadow scale, gradient mapping)
- FOUND: app/styles/global.css (modified — Inter import, shadow lockout removed)
- FOUND: package.json (modified — inter added, geist removed)
- FOUND: pnpm-lock.yaml (modified)
- FOUND: commit ef43c91 (theme.css)
- FOUND: commit 7e9589e (global.css)
- FOUND: commit 5bd3065 (package.json + lockfile)
