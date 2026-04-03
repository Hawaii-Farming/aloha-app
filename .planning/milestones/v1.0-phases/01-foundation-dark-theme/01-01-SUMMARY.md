---
phase: 01-foundation-dark-theme
plan: 01
subsystem: ui
tags: [css, tailwind, shadcn, geist, fonts, dark-theme, oklch, design-tokens]

# Dependency graph
requires: []
provides:
  - Geist and Geist Mono variable fonts installed and wired through all CSS layers
  - Supabase dark palette oklch token overrides in .dark block
  - Green accent tokens (--supabase-green, --supabase-green-link, --supabase-green-border) in :root
  - Supabase neutral scale (10 --sb-* tokens) in :root
  - --font-mono CSS variable mapped through theme.css @theme
affects:
  - 01-02-PLAN.md (light theme palette — will build on same CSS architecture)
  - Any future plan touching shadcn-ui.css or theme.css

# Tech tracking
tech-stack:
  added:
    - "@fontsource-variable/geist ^5.2.8"
    - "@fontsource-variable/geist-mono ^5.2.7"
  patterns:
    - "CSS token layers: brand primitives and neutral scale in :root, semantics in :root/.dark, @theme uses only var() references"
    - "oklch for all direct color values; var(--color-*) only for Tailwind-managed tokens (destructive, charts)"
    - "Font imports before @import 'tailwindcss' in global.css"

key-files:
  created: []
  modified:
    - "app/styles/global.css — font imports before Tailwind CSS import"
    - "app/styles/shadcn-ui.css — font variables, Supabase brand tokens, neutral scale, full .dark palette override"
    - "app/styles/theme.css — --font-mono @theme mapping, removed -apple-system prefix"
    - "package.json — @fontsource-variable/geist and geist-mono workspace deps"

key-decisions:
  - "Use @fontsource-variable/geist (NOT geist npm package) — Vite compatible variable font package"
  - "--primary stays neutral off-white in dark mode (D-08) — not green; keeps Shadcn component hierarchy intact"
  - "--sidebar-primary uses Supabase green (D-09) — primary accent in navigation"
  - "--destructive keeps var(--color-red-700) (D-03) — Tailwind-managed, not converted to oklch"
  - "--sidebar-foreground set to oklch(60%) mid-gray for muted inactive nav text"
  - "oklch color format for all custom token values per D-01 — native to modern browsers, no HSL wrapper needed"

patterns-established:
  - "Pattern 1: All Supabase-specific tokens namespaced as --supabase-* (brand) or --sb-* (neutral scale)"
  - "Pattern 2: .dark block uses only oklch() or var(--color-*) for Tailwind-managed exceptions"
  - "Pattern 3: Font @imports precede all other imports in global.css"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-08]

# Metrics
duration: 15min
completed: 2026-04-02
---

# Phase 1 Plan 1: Install Geist Fonts + Supabase Dark Palette Tokens Summary

**Geist/Geist Mono fonts installed via @fontsource-variable, wired through three CSS layers, with full Supabase oklch dark palette replacing Tailwind neutral-* tokens and green accent/neutral scale tokens defined in :root**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-02T19:30:00Z
- **Completed:** 2026-04-02T19:45:00Z
- **Tasks:** 2
- **Files modified:** 4 (global.css, shadcn-ui.css, theme.css, package.json/pnpm-lock.yaml)

## Accomplishments
- Geist Variable and Geist Mono Variable fonts installed as @fontsource-variable packages and imported in global.css before Tailwind
- Font variables (--font-sans, --font-mono, --font-heading) declared in shadcn-ui.css :root and mapped through theme.css @theme
- Full .dark block replaced: 100% Supabase oklch values, no legacy var(--color-neutral-*) references (except charts/destructive per D-03)
- Supabase brand tokens (3) and neutral scale (10) defined as :root custom properties for use across the system

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Geist fonts and wire font variables** - `3482ea3` (feat)
2. **Task 2: Override dark palette tokens, define green accents and neutral scale** - `c164c50` (feat)

**Plan metadata:** (to be added after state update commit)

## Files Created/Modified
- `app/styles/global.css` — Added @fontsource-variable/geist and geist-mono imports before Tailwind
- `app/styles/shadcn-ui.css` — Replaced --font-sans, added --font-mono, added Supabase brand/neutral tokens to :root, full .dark block override
- `app/styles/theme.css` — Removed -apple-system prefix from --font-sans, added --font-mono: var(--font-mono) mapping
- `package.json` — Added @fontsource-variable/geist and @fontsource-variable/geist-mono workspace dependencies

## Decisions Made
- `@fontsource-variable/geist` used (NOT `geist` npm package) — the `geist` package has Vite ESM compatibility issues; `@fontsource-variable` is the correct distribution
- `--primary` in .dark stays neutral off-white per D-08 — keeps Shadcn button/form hierarchy correct (green is an accent, not primary)
- `--sidebar-primary` gets Supabase green per D-09 — this is where the brand color appears in navigation active states
- `--destructive` and `--destructive-foreground` keep `var(--color-red-700)` / `var(--color-white)` per D-03 — Tailwind-managed
- `--sidebar-foreground` set to oklch(60% 0 none) mid-gray — muted inactive nav links, matching Supabase sidebar style
- Font packages installed at workspace root with `-w` flag — correct for monorepo setup where fonts are consumed by the root app

## Deviations from Plan

None - plan executed exactly as written.

The only minor adaptation: `pnpm add` required `-w` flag to install at workspace root (the package.json at the root level is the monorepo workspace root). This is expected behavior in a pnpm workspaces monorepo and not a plan deviation.

## Issues Encountered

- `pnpm add @fontsource-variable/geist` initially failed with ERR_PNPM_ADDING_TO_ROOT — resolved by adding the `-w` (workspace root) flag. Standard pnpm monorepo behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CSS token foundation complete — dark mode now renders with full Supabase palette
- Green accent tokens available as `--supabase-green`, `--supabase-green-link`, `--supabase-green-border`
- Neutral scale available as `--sb-near-black` through `--sb-near-white`
- `pnpm typecheck` passes — no TypeScript errors
- Plan 01-02 (light theme / component overrides) can proceed — will build on the same CSS token architecture

---
*Phase: 01-foundation-dark-theme*
*Completed: 2026-04-02*

## Self-Check: PASSED

Files verified:
- app/styles/global.css: FOUND (font imports before tailwindcss)
- app/styles/shadcn-ui.css: FOUND (--supabase-green, --sb-dark, Supabase .dark block)
- app/styles/theme.css: FOUND (--font-mono mapping, no -apple-system)

Commits verified:
- 3482ea3: FOUND (Task 1: Geist fonts)
- c164c50: FOUND (Task 2: dark palette tokens)
