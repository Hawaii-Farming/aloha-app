# Phase 3: Enhancement + Verification - Context

**Gathered:** 2026-04-02 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Supplementary token layers (translucent surfaces, semantic color scales, neutral gray extensions), typography refinements (weight restraint enforcement, negative letter-spacing, monospace utility), and end-to-end verification across both dark and light themes. No new components or business logic — CSS token and utility layer work only.

</domain>

<decisions>
## Implementation Decisions

### Translucent surface tokens (ENHN-01)
- **D-01:** Use oklch with alpha channel for all translucent surface tokens — consistent with existing oklch-native architecture from Phase 1 D-01 (not HSL as mentioned in DESIGN.md prose)
- **D-02:** Define translucent overlay tokens for modals, popovers, and dropdowns — these are the overlay components referenced in success criteria SC-1
- **D-03:** Add tokens in both `:root` and `.dark` blocks in `shadcn-ui.css` following established pattern — e.g., `--glass-surface: oklch(100% 0 none / 0.84)` for light, `oklch(16% 0 none / 0.84)` for dark

### Typography weight enforcement (ENHN-02, ENHN-03)
- **D-04:** Set `font-weight: 400` as base default in `@layer base` body rule — ensures all text defaults to regular weight
- **D-05:** Explicitly set weight 500 only on nav links and button labels — audit existing component files for any 700/bold usage and replace
- **D-06:** Apply -0.16px letter-spacing to card title elements using Tailwind inline utility `tracking-[-0.16px]` on card headers — minimal surface area, no new CSS class needed for this

### Monospace technical label utility (ENHN-04)
- **D-07:** Define a reusable utility class in `global.css` `@layer utilities` — e.g., `.tech-label` with `font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 1.2px; font-size: 0.75rem; line-height: 1.33`
- **D-08:** Utility is additive and opt-in — applied via className where technical labels appear; does not change any existing component defaults

### Radix semantic color scale (ENHN-05)
- **D-09:** Define oklch equivalents manually in CSS custom properties — no `@radix-ui/colors` package dependency; keeps self-contained CSS variable approach
- **D-10:** Include four semantic color families: Red (error/destructive), Amber/Yellow (warning), Green (success), Blue (info) — standard states for alerts, badges, status indicators
- **D-11:** Define sufficient steps per family for background, foreground, and border use cases (e.g., `--semantic-red-bg`, `--semantic-red-fg`, `--semantic-red-border`) in both themes
- **D-12:** Tokens placed in `shadcn-ui.css` alongside existing semantic tokens — both `:root` and `.dark` blocks

### Neutral gray scale extension (ENHN-06)
- **D-13:** Extend existing `--sb-*` tokens from Phase 1 D-14 to cover any gaps in the full `#171717` through `#fafafa` Supabase scale — audit current definitions against DESIGN.md section 2 and add missing stops
- **D-14:** No new naming convention — continue using `--sb-` prefix established in Phase 1

### End-to-end verification
- **D-15:** Verify all new token additions (translucent surfaces, semantic colors) pass WCAG AA contrast requirements in both themes
- **D-16:** Visual inspection of modals, popovers, dropdowns with new translucent tokens applied
- **D-17:** Audit entire codebase for font-weight: 700 / bold usage and confirm none remain after enforcement

### Claude's Discretion
- Exact oklch values for Radix semantic color equivalents (as long as they maintain visual fidelity to Radix scale and meet WCAG AA)
- Number of steps per semantic color family (minimum 3: bg, fg, border — more if needed for hover/active states)
- Whether translucent tokens need additional alpha variants beyond the primary overlay opacity
- Exact gap analysis results for `--sb-*` neutral tokens vs DESIGN.md full scale
- Verification tooling approach (manual contrast calculation vs automated script)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design specification
- `DESIGN.md` — Complete design system spec. S2 (Color Palette & Roles) defines the Radix color tokens, surface overlays, and neutral scale. S3 (Typography Rules) defines weight restraint, letter-spacing, and monospace label specs. S7 (Do's and Don'ts) constrains weight to 400/500 only.
- `DESIGN.md` S2 "Radix Color Tokens" — HSL-based Radix token definitions (crimson, purple, violet, indigo, yellow, tomato, orange, slate) to be converted to oklch
- `DESIGN.md` S2 "Surface & Overlay" — Glass Dark, Slate Alpha, and Fixed Scale Alpha translucent values
- `DESIGN.md` S3 "Principles" — Weight restraint (400/500 only), negative tracking on cards, monospace ritual spec

### Current theme infrastructure
- `app/styles/shadcn-ui.css` — Primary CSS variable file. `:root` (lines 10-76) and `.dark` (lines 78-125) blocks where all new tokens will be added. Already contains `--sb-*` neutral tokens and Supabase green tokens.
- `app/styles/global.css` — CSS import order, `@layer base` and `@layer utilities` — where base weight rule and tech-label utility will be added
- `app/styles/theme.css` — Tailwind `@theme` block mapping Shadcn variables to Tailwind tokens

### Requirements
- `.planning/REQUIREMENTS.md` — ENHN-01 through ENHN-06 define acceptance criteria for this phase

### Prior phase context
- `.planning/phases/01-foundation-dark-theme/01-CONTEXT.md` — D-01 (oklch format), D-14 (--sb-* neutral tokens), D-10-D-12 (shadow removal/border depth)
- `.planning/phases/02-light-theme-component-theming/02-CONTEXT.md` — D-04 (per-theme green intensity), D-09 (shadow-xs global removal)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/styles/shadcn-ui.css`: All CSS token infrastructure in place — `:root` and `.dark` blocks ready for new token additions following established pattern
- `--sb-*` neutral tokens already cover most of the Supabase neutral scale (Phase 1 D-14) — `--sb-near-black` through `--sb-near-white`
- `--supabase-green-border` already uses alpha channel (`oklch(47% 0.165 160 / 0.3)`) — pattern for oklch-with-alpha established
- `app/styles/global.css`: Has `@layer base` and `@layer utilities` sections ready for weight rule and utility class

### Established Patterns
- **oklch color format**: All custom tokens use oklch() — Phase 1 established, Phase 2 continued; translucent tokens follow same format with `/alpha` suffix
- **Token-driven theming**: Components consume CSS variables via Tailwind semantic classes — new tokens automatically available via `var()` references
- **Three-layer CSS architecture**: `shadcn-ui.css` (primitives) -> `theme.css` (@theme mapping) -> components (Tailwind classes)
- **No shadows**: Border-depth system fully enforced across both themes — no shadow tokens to conflict with

### Integration Points
- `app/styles/shadcn-ui.css` — Add translucent surface tokens, semantic color tokens, and neutral gray extensions
- `app/styles/global.css` — Add `font-weight: 400` base rule and `.tech-label` utility class
- `packages/ui/src/shadcn/card.tsx` — Card title elements where `tracking-[-0.16px]` applies
- `packages/ui/src/shadcn/alert.tsx` — Alert component consuming semantic color tokens
- `packages/ui/src/shadcn/badge.tsx` — Badge component consuming semantic color tokens

</code_context>

<specifics>
## Specific Ideas

- DESIGN.md S2 "Surface & Overlay" lists specific translucent values: Glass Dark `rgba(41, 41, 41, 0.84)`, Slate Alpha `hsla(210, 87.8%, 16.1%, 0.031)`, Fixed Scale Alpha `hsla(200, 90.3%, 93.4%, 0.109)` — convert these to oklch equivalents
- Supabase uses "monospace as ritual" — the technical label utility should feel intentional and consistent, not ad hoc
- Success criterion SC-2 specifically checks: "Body text uses weight 400; nav links and buttons use weight 500; no element uses bold 700 typography"

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope.

</deferred>

---

*Phase: 03-enhancement-verification*
*Context gathered: 2026-04-02*
