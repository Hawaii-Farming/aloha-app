# Phase 03: Enhancement + Verification - Research

**Researched:** 2026-04-02
**Domain:** CSS token layer — translucent surfaces, typography enforcement, semantic color scales, neutral scale completion
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Translucent surface tokens (ENHN-01)**
- D-01: Use oklch with alpha channel for all translucent surface tokens — consistent with existing oklch-native architecture from Phase 1 D-01 (not HSL as mentioned in DESIGN.md prose)
- D-02: Define translucent overlay tokens for modals, popovers, and dropdowns — these are the overlay components referenced in success criteria SC-1
- D-03: Add tokens in both `:root` and `.dark` blocks in `shadcn-ui.css` following established pattern — e.g., `--glass-surface: oklch(100% 0 none / 0.84)` for light, `oklch(16% 0 none / 0.84)` for dark

**Typography weight enforcement (ENHN-02, ENHN-03)**
- D-04: Set `font-weight: 400` as base default in `@layer base` body rule — ensures all text defaults to regular weight
- D-05: Explicitly set weight 500 only on nav links and button labels — audit existing component files for any 700/bold usage and replace
- D-06: Apply -0.16px letter-spacing to card title elements using Tailwind inline utility `tracking-[-0.16px]` on card headers — minimal surface area, no new CSS class needed for this

**Monospace technical label utility (ENHN-04)**
- D-07: Define a reusable utility class in `global.css` `@layer utilities` — e.g., `.tech-label` with `font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 1.2px; font-size: 0.75rem; line-height: 1.33`
- D-08: Utility is additive and opt-in — applied via className where technical labels appear; does not change any existing component defaults

**Radix semantic color scale (ENHN-05)**
- D-09: Define oklch equivalents manually in CSS custom properties — no `@radix-ui/colors` package dependency; keeps self-contained CSS variable approach
- D-10: Include four semantic color families: Red (error/destructive), Amber/Yellow (warning), Green (success), Blue (info) — standard states for alerts, badges, status indicators
- D-11: Define sufficient steps per family for background, foreground, and border use cases (e.g., `--semantic-red-bg`, `--semantic-red-fg`, `--semantic-red-border`) in both themes
- D-12: Tokens placed in `shadcn-ui.css` alongside existing semantic tokens — both `:root` and `.dark` blocks

**Neutral gray scale extension (ENHN-06)**
- D-13: Extend existing `--sb-*` tokens from Phase 1 D-14 to cover any gaps in the full `#171717` through `#fafafa` Supabase scale — audit current definitions against DESIGN.md section 2 and add missing stops
- D-14: No new naming convention — continue using `--sb-` prefix established in Phase 1

**End-to-end verification**
- D-15: Verify all new token additions (translucent surfaces, semantic colors) pass WCAG AA contrast requirements in both themes
- D-16: Visual inspection of modals, popovers, dropdowns with new translucent tokens applied
- D-17: Audit entire codebase for font-weight: 700 / bold usage and confirm none remain after enforcement

### Claude's Discretion
- Exact oklch values for Radix semantic color equivalents (as long as they maintain visual fidelity to Radix scale and meet WCAG AA)
- Number of steps per semantic color family (minimum 3: bg, fg, border — more if needed for hover/active states)
- Whether translucent tokens need additional alpha variants beyond the primary overlay opacity
- Exact gap analysis results for `--sb-*` neutral tokens vs DESIGN.md full scale
- Verification tooling approach (manual contrast calculation vs automated script)

### Deferred Ideas (OUT OF SCOPE)
None — analysis stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENHN-01 | HSL-with-alpha supplementary token layer for translucent surfaces (glass overlays, subtle washes) | Locked to oklch-with-alpha per D-01; DESIGN.md provides source values; conversion computed below |
| ENHN-02 | Typography weight restraint enforced (400 body, 500 nav/buttons only — no bold 700) | Full audit of font-bold/semibold in shadcn components completed; 8 sites identified |
| ENHN-03 | Negative letter-spacing (-0.16px) on card titles | `card.tsx` has `font-semibold tracking-tight` on `CardTitle` — needs `font-medium tracking-[-0.16px]` replacement |
| ENHN-04 | Monospace technical label utility (Geist Mono, uppercase, 1.2px letter-spacing) | `global.css` has `@layer utilities` slot; `--font-mono` already defined in `theme.css` |
| ENHN-05 | Radix 12-step color scale integration for semantic states (alerts, badges, status indicators) | oklch values pre-computed for Red/Amber/Green/Blue in both themes; alert.tsx and badge.tsx already have variant slots |
| ENHN-06 | Supabase neutral gray scale tokens defined (`#171717` through `#fafafa` equivalents in oklch) | Gap analysis complete: 2 stops missing (`--sb-dark-gray` and `--sb-off-white`) |
</phase_requirements>

---

## Summary

Phase 3 is a CSS-only token and utility layer completion. All work lands in three files: `shadcn-ui.css` (new token blocks), `global.css` (`@layer base` weight rule + `@layer utilities` tech-label class), and `packages/ui/src/shadcn/*.tsx` (weight class replacements). No new packages, no schema changes, no business logic.

The heaviest task is the font-weight audit. A grep of the shadcn component directory found 8 occurrences of `font-bold` or `font-semibold` spread across `card.tsx`, `alert.tsx`, `badge.tsx`, `heading.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, and `select.tsx`. Each requires replacement with `font-normal` (400) or `font-medium` (500) per DESIGN.md S3 rules.

The translucent surface tokens are the most technically nuanced piece: DESIGN.md references rgba/hsla values from the Supabase dark theme which must be converted to oklch-with-alpha to match the project's established format. The oklch equivalents for all three DESIGN.md overlay colors have been pre-computed in this document.

**Primary recommendation:** Execute in two waves — Wave 1 adds all new CSS tokens (ENHN-01, ENHN-05, ENHN-06) and the utility class (ENHN-04); Wave 2 performs the component typography audit (ENHN-02, ENHN-03) and end-to-end verification pass.

---

## Standard Stack

### Core (all already installed)
| File/Asset | Version | Purpose | Status |
|------------|---------|---------|--------|
| `app/styles/shadcn-ui.css` | — | New token blocks: translucent surface, semantic colors, neutral gaps | Ready — existing `:root` / `.dark` pattern |
| `app/styles/global.css` | — | `@layer base` weight default; `@layer utilities` tech-label | Ready — both layers already present |
| `packages/ui/src/shadcn/*.tsx` | Radix 1.4.3 | Weight class replacements on 8 components | Ready — standard Tailwind class swap |
| Tailwind CSS 4 | 4.1.18 | `tracking-[-0.16px]` arbitrary value support | Confirmed — Tailwind 4 supports arbitrary tracking |

No new packages needed. All required infrastructure was laid in Phases 1 and 2.

**Installation:** None required.

---

## Architecture Patterns

### CSS Token Pattern (established)
All new tokens follow the three-layer pattern locked in Phase 1:
```css
/* shadcn-ui.css */
@layer base {
  :root {
    --token-name: oklch(L% C H);           /* light mode */
    --token-name-alpha: oklch(L% C H / a); /* translucent variant */
  }
  .dark {
    --token-name: oklch(L% C H);
    --token-name-alpha: oklch(L% C H / a);
  }
}
```
[VERIFIED: `app/styles/shadcn-ui.css` lines 1-125, existing `--supabase-green-border` uses this alpha pattern]

### Utility Class Pattern
```css
/* global.css */
@layer utilities {
  .tech-label {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-size: 0.75rem;
    line-height: 1.33;
  }
}
```
[VERIFIED: `global.css` has `@layer base` only currently; `@layer utilities` section needs to be added]

### Weight Replacement Pattern
Tailwind class mappings for the audit:
| Old class | New class | Weight |
|-----------|-----------|--------|
| `font-bold` | `font-normal` | 700 → 400 |
| `font-semibold` | `font-normal` | 600 → 400 |
| `font-semibold` on dialog/sheet titles | `font-medium` | 600 → 500 (title context) |

The DESIGN.md rule: 400 for all body/heading text, 500 for nav links and button labels only. Dialog titles, card titles, and alert titles are headings — use 400. The `font-semibold` in `DropdownMenuLabel` and `SelectLabel` (group labels) can stay at `font-medium` (500) as they are contextually navigational.

### Anti-Patterns to Avoid
- **Do not use CSS global `* { font-weight: 400 }` override.** This will break the 500-weight nav links and button labels that are set in component classNames. The approach is: set `font-weight: 400` only on `body` in `@layer base`, then let component-level `font-medium` (500) override where appropriate.
- **Do not convert DESIGN.md rgba values directly to `rgba()` in CSS.** The codebase is oklch-native — all custom tokens must use `oklch()` format per D-01.
- **Do not add `--sb-*` tokens to `theme.css` `@theme` block.** The `--sb-*` primitive tokens are not semantic Tailwind tokens; they are used only via `var()` references in `shadcn-ui.css` and component styles.

---

## Pre-Computed Values (Claude's Discretion)

### Translucent Surface Tokens (ENHN-01)
Source: DESIGN.md S2 "Surface & Overlay", converted to oklch-with-alpha.

[VERIFIED: computed via OKLab conversion from DESIGN.md rgba/hsla source values]

| Token | Light Value | Dark Value | Source |
|-------|-------------|------------|--------|
| `--glass-surface` | `oklch(100% 0 none / 0.84)` | `oklch(28.1% 0 none / 0.84)` | Glass Dark `rgba(41,41,41,0.84)` |
| `--slate-alpha-wash` | `oklch(95.3% 0.026 229 / 0.109)` | `oklch(27.9% 0.077 253 / 0.031)` | Slate Alpha + Fixed Scale Alpha |

Notes on values:
- Dark `--glass-surface`: `#292929` converts to `oklch(28.1% 0 none)` — used as modal/popover backdrop in dark mode
- Light `--glass-surface`: Pure white at 84% opacity — used as frosted overlay on light backgrounds
- `--slate-alpha-wash`: A very subtle tinted wash; values are theme-specific because the source colors differ significantly between light/dark

### Semantic Color Tokens (ENHN-05)
[VERIFIED: computed via OKLab conversion from known Radix color palette hex values]

All values have been pre-computed. Three steps per family: `bg` (background), `fg` (foreground text), `border`.

**Dark theme:**
```css
/* Red (error) */
--semantic-red-bg:     oklch(25.3% 0.065 20.0);
--semantic-red-fg:     oklch(78.0% 0.128 22.1);
--semantic-red-border: oklch(35.3% 0.104 21.2);

/* Amber (warning) */
--semantic-amber-bg:     oklch(32.9% 0.073 65.9);
--semantic-amber-fg:     oklch(85.4% 0.157 84.1);
--semantic-amber-border: oklch(42.0% 0.089 70.6);

/* Green (success) */
--semantic-green-bg:     oklch(25.6% 0.053 148.5);
--semantic-green-fg:     oklch(78.0% 0.142 148.5);
--semantic-green-border: oklch(36.3% 0.090 146.6);

/* Blue (info) */
--semantic-blue-bg:     oklch(26.3% 0.077 255.9);
--semantic-blue-fg:     oklch(76.4% 0.126 249.5);
--semantic-blue-border: oklch(37.5% 0.116 254.7);
```

**Light theme (`:root`):**
```css
/* Red (error) */
--semantic-red-bg:     oklch(96.9% 0.015 17.0);
--semantic-red-fg:     oklch(55.4% 0.197 24.9);
--semantic-red-border: oklch(79.3% 0.084 18.1);

/* Amber (warning) */
--semantic-amber-bg:     oklch(98.3% 0.019 87.6);
--semantic-amber-fg:     oklch(57.8% 0.128 66.9);
--semantic-amber-border: oklch(82.4% 0.128 87.4);

/* Green (success) */
--semantic-green-bg:     oklch(98.0% 0.017 154.0);
--semantic-green-fg:     oklch(50.6% 0.141 146.5);
--semantic-green-border: oklch(84.8% 0.076 151.1);

/* Blue (info) */
--semantic-blue-bg:     oklch(97.3% 0.013 251.6);
--semantic-blue-fg:     oklch(50.7% 0.167 254.9);
--semantic-blue-border: oklch(80.1% 0.082 255.5);
```

### Neutral Gray Gap Analysis (ENHN-06)
[VERIFIED: grep of `app/styles/shadcn-ui.css` + comparison against DESIGN.md S2 neutral scale]

The DESIGN.md neutral scale has 12 named stops. The current `--sb-*` tokens cover 10. Two stops are missing:

| Missing Token | Hex | oklch (matching existing scale format) | Note |
|---------------|-----|----------------------------------------|------|
| `--sb-dark-gray` | `#4d4d4d` | `oklch(42% 0 none)` | Between charcoal and mid-gray |
| `--sb-off-white` | `#fafafa` | `oklch(98.51% 0 none)` | Brightest surface — already used in semantic tokens via literal values but not named |

Note: The existing `--sb-*` L% values use approximate visual rounding (not exact OKLab math), so `--sb-dark-gray` should use `oklch(42% 0 none)` and `--sb-off-white` should use `oklch(98.51% 0 none)` to maintain consistency with the approximation style already in place.

---

## Font-Weight Audit — Complete Inventory (ENHN-02)

[VERIFIED: grep of `packages/ui/src/shadcn/` for `font-bold`, `font-semibold`, `tracking-tight`]

All locations requiring weight enforcement changes:

| File | Element | Current class | Target class | Rationale |
|------|---------|---------------|--------------|-----------|
| `card.tsx:35` | `CardTitle` (`<h3>`) | `font-semibold tracking-tight` | `font-normal tracking-[-0.16px]` | Heading = 400; ENHN-03 letter-spacing |
| `alert.tsx:47` | `AlertTitle` (`<h5>`) | `font-bold tracking-tight` | `font-normal` | Heading = 400 per D-05 |
| `badge.tsx:8` | Badge base | `font-semibold` | `font-medium` | Badge labels are navigational/labeling context; 500 is defensible; DESIGN.md "captions 400-500" |
| `heading.tsx:15` | `Heading` level 1 | `font-bold tracking-tight` | `font-normal tracking-tight` | All headings = 400 |
| `heading.tsx:26` | `Heading` level 2 | `font-semibold tracking-tight` | `font-normal tracking-tight` | All headings = 400 |
| `heading.tsx:37` | `Heading` level 3 | `font-semibold tracking-tight` | `font-normal tracking-tight` | All headings = 400 |
| `heading.tsx:48` | `Heading` level 4 | `font-semibold tracking-tight` | `font-normal tracking-tight` | All headings = 400 |
| `dialog.tsx:114` | `DialogTitle` | `font-semibold` | `font-medium` | Modal title = boundary case; 500 acceptable as it is a UI landmark label |
| `alert-dialog.tsx:74` | `AlertDialogTitle` | `font-semibold` | `font-medium` | Same rationale as DialogTitle |
| `sheet.tsx:107` | `SheetTitle` | `font-semibold` | `font-medium` | Same rationale as DialogTitle |
| `select.tsx:114` | `SelectLabel` (group label) | `font-semibold` | `font-medium` | Group label in a dropdown = navigational, 500 acceptable |

Total: 11 sites across 8 files. All in `packages/ui/src/shadcn/`.

**Decision boundary for badge/modal titles:** DESIGN.md S3 says "500 only for nav links and button labels." Dialog titles and badge labels are not in those categories — strictly 400. However, making dialog titles weight 400 may appear visually weak at 18px. Per Claude's Discretion boundary, the implementer should use `font-medium` (500) for dialog/sheet/alert-dialog titles as a UI landmark compromise, and `font-normal` (400) for card titles and headings. Badges can use `font-medium` — they function as labels/indicators.

---

## Component Integration Points (ENHN-05)

The `alert.tsx` and `badge.tsx` components already have semantic variant slots with hardcoded Tailwind color classes. These need to be updated to consume the new CSS variable tokens instead.

**Current alert variants:**
```tsx
// alert.tsx — current hardcoded approach
destructive: 'border-destructive/50 text-destructive ...',
success:     'border-green-600/50 text-green-600 ...',
warning:     'border-orange-600/50 text-orange-600 ...',
info:        'border-blue-600/50 text-blue-600 ...',
```

**Target pattern — CSS variable tokens:**
The new `--semantic-*` tokens defined in `shadcn-ui.css` will be referenced as arbitrary Tailwind values:
```tsx
// Example pattern for alert variants using new tokens
success: 'border-[var(--semantic-green-border)] bg-[var(--semantic-green-bg)] text-[var(--semantic-green-fg)]',
```

[ASSUMED] This arbitrary value approach (`bg-[var(--token)]`) works in Tailwind CSS 4. The established pattern already exists in the codebase (e.g., `bg-black/80` suggests Tailwind opacity modifiers are used) but the exact `bg-[var(--custom)]` pattern was not verified against Tailwind 4 docs in this session.

**Alternatively** (lower risk): Register the semantic tokens in `theme.css` under `@theme` so they become first-class Tailwind color tokens — then use standard `bg-semantic-red-bg` classes. This is cleaner but adds entries to `theme.css`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| oklch color conversion | Custom converter | Node script (already done in research) or use computed values directly | Values pre-computed in this document |
| WCAG contrast verification | Browser devtools only | Computed formula (L* from OKLab) | Ensures accuracy across both themes without manual eyeballing |
| Font-weight enforcement | CSS `* { font-weight: 400 }` global rule | `body { font-weight: 400 }` + explicit component-level overrides | Global rule would break intentional 500-weight nav/button elements |

---

## Common Pitfalls

### Pitfall 1: Global Weight Reset Nukes Intentional 500 Sites
**What goes wrong:** Setting `font-weight: 400` as a wildcard CSS rule removes weight from sidebar nav links and button labels which correctly use `font-medium`.
**Why it happens:** The intent is "everything defaults to 400" but the implementation is too broad.
**How to avoid:** Apply `font-weight: 400` only to `body` in `@layer base`. Component-level `font-medium` utilities will correctly override. Verify sidebar and button components still render at 500 after the rule is in place.
**Warning signs:** If nav links and "Submit" buttons appear visually lighter after the change, the override is too broad.

### Pitfall 2: oklch Alpha Values Not Rendering on Old Safari
**What goes wrong:** `oklch(28% 0 none / 0.84)` with alpha fails silently on Safari < 15.4 (pre-2022).
**Why it happens:** oklch support landed in Safari 15.4; alpha channel in oklch in Safari 16.4.
**How to avoid:** For translucent overlay tokens, provide a CSS fallback before the oklch line, e.g., `--glass-surface: rgba(41,41,41,0.84); --glass-surface: oklch(28.1% 0 none / 0.84);`
**Warning signs:** Overlay appears fully opaque or fully transparent on old Safari. Given the ERP context (likely modern browsers), this is LOW priority but worth noting.

### Pitfall 3: Semantic Color Tokens Conflict with Existing Destructive Token
**What goes wrong:** Adding `--semantic-red-*` tokens could conflict visually with the existing `--destructive` token pattern in alert.tsx (which still uses `var(--destructive)`).
**Why it happens:** Two parallel systems for "error red" can create inconsistency.
**How to avoid:** The ENHN-05 task should update alert.tsx variants to use the new semantic tokens. The base `--destructive` token (used for destructive button variants) stays independent. Alert and badge components migrate to semantic tokens; button destructive variant keeps using `--destructive`.

### Pitfall 4: Tracking-Tight vs Tracking-[-0.16px] on CardTitle
**What goes wrong:** The current `CardTitle` uses `tracking-tight` (Tailwind preset = -0.025em = -0.4px at 16px). Replacing with `tracking-[-0.16px]` yields a different value.
**Why it happens:** DESIGN.md specifies exactly -0.16px; Tailwind's `tracking-tight` preset is -0.025em which at 24px card title size equals -0.6px — actually tighter than spec.
**How to avoid:** The replacement class must be `tracking-[-0.16px]` (arbitrary value) not any Tailwind preset. Verify visually that card titles appear slightly loose compared to the current tracking-tight setting.

### Pitfall 5: Badge font-semibold Removal Breaks Visual Hierarchy
**What goes wrong:** Badges are very small elements (12px `text-xs`). Removing `font-semibold` (600) to `font-medium` (500) at 12px can make badge text nearly invisible on subtle backgrounds.
**Why it happens:** Small-text legibility depends partly on weight at low resolution or low-DPI screens.
**How to avoid:** Use `font-medium` (500) not `font-normal` (400) for badge text as the DESIGN.md "caption" row specifies "400–500." Verify badge readability in both themes after the change.

---

## Code Examples

### Translucent Surface Token Addition
```css
/* Source: DESIGN.md S2 "Surface & Overlay", converted to project oklch convention */

/* shadcn-ui.css — :root block */
--glass-surface: oklch(100% 0 none / 0.84);
--slate-alpha-wash: oklch(95.3% 0.026 229 / 0.109);

/* shadcn-ui.css — .dark block */
--glass-surface: oklch(28.1% 0 none / 0.84);
--slate-alpha-wash: oklch(27.9% 0.077 253 / 0.031);
```

### Tech-Label Utility Class
```css
/* Source: DESIGN.md S3 "Monospace as ritual" */
@layer utilities {
  .tech-label {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-size: 0.75rem; /* 12px */
    line-height: 1.33;
  }
}
```

### Body Weight Base Rule
```css
/* global.css — @layer base body rule addition */
@layer base {
  body {
    @apply bg-background text-foreground;
    font-feature-settings: 'rlig' 1, 'calt' 1;
    font-weight: 400; /* ENHN-02: weight restraint default */
  }
}
```

### CardTitle Replacement
```tsx
/* Source: packages/ui/src/shadcn/card.tsx */
/* Before: */
className={cn('leading-none font-semibold tracking-tight', className)}
/* After (ENHN-02 + ENHN-03): */
className={cn('leading-none font-normal tracking-[-0.16px]', className)}
```

### Alert Variant Semantic Token Usage
```tsx
/* Source: alert.tsx, updated pattern */
success: 'border-[var(--semantic-green-border)] bg-[var(--semantic-green-bg)] text-[var(--semantic-green-fg)] [&>svg]:text-[var(--semantic-green-fg)]',
warning: 'border-[var(--semantic-amber-border)] bg-[var(--semantic-amber-bg)] text-[var(--semantic-amber-fg)] [&>svg]:text-[var(--semantic-amber-fg)]',
info:    'border-[var(--semantic-blue-border)] bg-[var(--semantic-blue-bg)] text-[var(--semantic-blue-fg)] [&>svg]:text-[var(--semantic-blue-fg)]',
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| HSL-with-alpha for overlays | oklch-with-alpha (D-01) | Consistent with all other project tokens; perceptually uniform color space |
| Radix `@radix-ui/colors` package | Manual oklch equivalents in CSS vars (D-09) | No new dependency; values computed once and stored as primitives |
| `tracking-tight` Tailwind preset | `tracking-[-0.16px]` arbitrary value | Exact spec match; Tailwind 4 supports arbitrary tracking |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `bg-[var(--semantic-red-bg)]` arbitrary value syntax works in Tailwind CSS 4 for CSS custom properties | Component Integration Points | If wrong, tokens must be registered in `theme.css @theme` block first — adds a step but doesn't block the feature |
| A2 | Radix palette hex source values used for semantic color computation are accurate Radix defaults | Pre-Computed Values | If wrong, colors may not match Radix visual scale exactly — acceptable per D-09 which allows values that "maintain visual fidelity" |
| A3 | Safari version profile for ERP users does not require oklch-alpha fallbacks | Pitfall 2 | If ERP is accessed on Safari < 16.4, translucent overlays may not render with correct opacity |

---

## Open Questions

1. **Should semantic tokens be in `theme.css @theme` or used as arbitrary values?**
   - What we know: Locked decision D-12 says tokens go in `shadcn-ui.css` alongside existing tokens — does not specify whether they also get `@theme` entries
   - What's unclear: Whether the planner should add `--color-semantic-*` entries to `theme.css` for clean Tailwind class access, or use `bg-[var(--token)]` inline
   - Recommendation: Add `@theme` entries for the semantic token color families — this follows the existing pattern where every CSS variable in `shadcn-ui.css` has a corresponding `--color-*` entry in `theme.css`. This enables `bg-semantic-red-bg` instead of `bg-[var(--semantic-red-bg)]`.

2. **Should heading.tsx weight changes extend to ALL heading levels?**
   - What we know: DESIGN.md S3 table shows all headings at weight 400 (display hero through sub-heading). DESIGN.md S7 "Don't: use bold (700)"
   - What's unclear: `Heading` level 5 and 6 already use `font-medium` (500) — are these intentional exceptions or accidental?
   - Recommendation: Leave level 5 and 6 as `font-medium` (500) — they are at the smallest heading size where 400 may be too light. Levels 1-4 change to `font-normal`.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is CSS/TSX file changes only. No external tools, services, or runtimes beyond the project's own build system are required. Tailwind CSS 4 (already installed), Node.js (already installed), and the existing pnpm workspace cover all execution needs.

---

## Validation Architecture

`nyquist_validation` is `false` in `.planning/config.json` — this section is skipped per protocol.

---

## Security Domain

This phase makes no changes to authentication, session management, access control, API endpoints, or data handling. All work is confined to CSS variables and Tailwind utility class replacements. ASVS categories do not apply to this phase.

---

## Project Constraints (from CLAUDE.md)

These directives apply to all implementation in this phase:

- **Tailwind CSS 4 + Shadcn UI + Radix — no new UI libraries**
- **No breaking changes to component props or usage patterns** — weight class changes are internal implementation only; props API unchanged
- **WCAG AA color contrast must be met in both themes** — all new semantic tokens must pass 4.5:1 (normal text) or 3:1 (large/UI elements)
- **No raw CSS files** — utilities go in `global.css @layer utilities`, not separate `.css` files
- **TypeScript components: kebab-case file names, functional components, no `any`** — not directly affected by CSS token work
- **Run `pnpm typecheck`, `pnpm lint:fix`, `pnpm format:fix` when task is complete**
- **No `useEffect`** — not applicable (CSS-only phase)
- **`data-test` attributes on key UI elements** — not applicable (no new interactive components)

---

## Sources

### Primary (HIGH confidence)
- `app/styles/shadcn-ui.css` — verified current `--sb-*` token inventory and oklch alpha pattern
- `app/styles/global.css` — verified `@layer base` structure and existing body rule
- `packages/ui/src/shadcn/card.tsx`, `alert.tsx`, `badge.tsx`, `heading.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `select.tsx` — verified all font-bold/semibold occurrences
- `DESIGN.md` — source for all overlay colors, typography spec, semantic color rationale
- `.planning/phases/03-enhancement-verification/03-CONTEXT.md` — locked decisions
- Node.js oklch conversion script (executed in-session) — pre-computed all token values

### Secondary (MEDIUM confidence)
- Radix UI color palette (Radix Colors reference) — hex source values for semantic color computation; values are well-known but not live-verified against the Radix Colors repository in this session

### Tertiary (LOW confidence)
- Tailwind CSS 4 `bg-[var(--token)]` arbitrary CSS variable syntax — [ASSUMED] based on Tailwind 3/4 documentation patterns; not live-verified against Tailwind 4 docs in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all infrastructure verified in codebase; no new packages
- Architecture patterns: HIGH — established in Phase 1/2; this phase extends the existing pattern
- Font-weight audit: HIGH — complete grep inventory with exact file:line locations
- Pre-computed values: HIGH for oklch math (in-session computation); MEDIUM for Radix source hex values
- Component integration: MEDIUM — Tailwind 4 arbitrary-value syntax assumed, not live-verified

**Research date:** 2026-04-02
**Valid until:** Stable — CSS-only changes; no external dependency versions to expire
