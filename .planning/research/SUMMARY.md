# Project Research Summary

**Project:** Aloha App — Supabase-Inspired Theme
**Domain:** Design system theming — Shadcn UI + Tailwind CSS 4 + next-themes
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

This is a theming milestone, not a greenfield project. The entire application stack (React Router 7, Shadcn UI, Tailwind CSS 4, next-themes, Radix UI) is already in place and non-negotiable. The work involves overriding Shadcn's default token values in `shadcn-ui.css`, installing the Geist variable font via Fontsource, and adding a CVA `pill` variant to the Button component. The architecture to support all of this is already correct — the three-file CSS pattern (`global.css` → `shadcn-ui.css` → `theme.css`) already implements the exact approach experts use for Shadcn + Tailwind CSS 4 theming.

The recommended approach is a strict two-layer token model: Supabase primitive colors (hex/oklch) defined once in `:root` inside `shadcn-ui.css`, then semantic Shadcn tokens (`--background`, `--primary`, etc.) referencing those primitives via `var()`. The `@theme` block in `theme.css` maps semantics to Tailwind utilities and must contain only `var()` references — never raw color values. This distinction is the single most important architectural rule for dual-theme correctness: violating it causes dark mode to silently stop working.

The key risks are well-understood and preventable. The most critical is the `@theme` vs `@theme inline` dark mode trap — raw values in `@theme` break theme switching. Secondary risks include: WCAG contrast failures on muted text (the `#898989` on `#171717` pairing is marginally compliant and must be verified), removing box-shadows in ways that destroy keyboard focus indicators, and using the wrong Geist font package (the official `geist` npm package uses Next.js internals and will crash the Vite build). All 10 identified pitfalls have clear prevention strategies that map to specific phases.

## Key Findings

### Recommended Stack

The stack requires exactly two new packages: `@fontsource-variable/geist@5.2.8` and `@fontsource-variable/geist-mono@5.2.7`. Everything else is already installed. These Fontsource packages are Vite-compatible WOFF2 variable fonts imported via CSS — the standard non-Next.js Geist solution. The official `geist` npm package must never be used in this project (it imports `next/font/local` which is unavailable in Vite and causes an immediate RollupError).

**Core technologies:**
- `@fontsource-variable/geist` — self-hosted Geist Sans variable font; Vite-compatible; only correct Geist source for non-Next.js
- `@fontsource-variable/geist-mono` — monospace companion; same rationale
- `class-variance-authority@0.7.1` — already installed; used to add `pill` variant to Button component
- `tailwindcss@4.1.18` — already installed; CSS-first config via `@theme` block; no JS config file
- `next-themes@0.4.6` — already installed and correctly configured; toggles `.dark` class on `<html>`

**Version requirements:** No version changes to any existing package. Font imports go in `global.css` before `@import 'tailwindcss'`.

### Expected Features

**Must have (table stakes) — v1:**
- CSS variables: complete dark theme palette overriding all Shadcn tokens — the foundation for everything else
- CSS variables: complete light theme palette — the three-way toggle is meaningless without a complete light theme
- Geist + Geist Mono fonts installed and applied — typography is the most immediately visible change; all DESIGN.md specs are calibrated to Geist metrics
- Border-based depth: remove box-shadows from cards/containers; replace with border color hierarchy — core Supabase identity
- Sidebar themed: dark background, green nav accents, weight-500 links — most visible chrome element
- Form inputs themed: `--input`, `--ring`, `--border` tokens updated — primary interaction surface in an ERP
- Data table themed: consistent with overall palette — primary read surface in an ERP
- Pill button variant added to Button component via CVA — highest-recognition Supabase UI element
- WCAG AA contrast verified for both themes — launch blocker, not optional
- No theme flicker on page load — verify `suppressHydrationWarning` on `<html>` and `disableTransitionOnChange` on ThemeProvider

**Should have (differentiators) — v1.x:**
- Pill tab variant — same CVA approach as pill button; add after core theme is stable
- HSL-with-alpha supplementary tokens — enables glass-like overlays and richer surface layering
- Radix color scale integration — semantic alert/badge/status colors
- Monospace technical label utility — applies Geist Mono uppercase + 1.2px letter-spacing to code/technical labels

**Defer (v2+):**
- Negative letter-spacing on card titles (-0.16px) — subtle detail; implement after main palette work is in production
- Typography weight audit across all screens — high value but requires screen-by-screen review; separate milestone
- Tenant-level branding / runtime theme customization — different architecture entirely; out of scope

**Anti-features to explicitly avoid:**
- CSS animations/transitions on theme switch — causes guaranteed FOUC-like flash on every page load with SSR
- Per-module color accents (green for growing, blue for packing) — destroys the "emerald is identity" principle
- `geist` npm package — crashes Vite builds
- Raw color values in `@theme` block — breaks dark mode silently
- Global `box-shadow: none` — destroys keyboard focus indicators (WCAG failure)

### Architecture Approach

The architecture is a strict four-layer CSS hierarchy: (0) global.css as import hub and font loader, (1) primitive Supabase color tokens in `:root` inside `shadcn-ui.css`, (2) semantic Shadcn tokens in `:root`/`.dark` inside `shadcn-ui.css` referencing layer 1 via `var()`, (3) Tailwind utility bridge in `theme.css` via `@theme { --color-*: var(--*); }`, (4) component-level CVA variants in `packages/ui/src/shadcn/`. The SSR-safe theme flow (cookie read in root loader → `dark` class on `<html>` before streaming → ThemeProvider hydrates on client) is already implemented correctly and requires no structural changes.

**Major components:**
1. `app/styles/shadcn-ui.css` — single source of truth for all token values: Supabase primitives + Shadcn semantics, both `:root` (light) and `.dark`
2. `app/styles/theme.css` — Tailwind utility bridge; `@theme {}` block maps `var(--background)` → `--color-background`; extend only, never replace
3. `app/styles/global.css` — import hub; add font `@import` statements here
4. `packages/ui/src/shadcn/button.tsx` — add `pill` and `pill-ghost` CVA variants; use compound variants to avoid size/radius conflicts
5. `app/root.tsx` — add `suppressHydrationWarning` to `<html>` element; one-line fix

### Critical Pitfalls

1. **`@theme` raw color values break dark mode** — `@theme` must contain only `var()` references; raw hex/oklch values in `@theme` are baked at build time and don't respond to `.dark` class changes. Enforce: no raw color values in `theme.css` ever.

2. **Global box-shadow removal destroys focus indicators** — "no elevation shadows" applies only to card/container surfaces, not to focus rings. Shadcn uses `box-shadow` for `focus-visible:ring-*`. Replace focus box-shadows with `outline`-based styles per component; never use a global `box-shadow: none` override.

3. **Wrong Geist font package** — `geist` (Vercel official) imports `next/font/local` and fails in Vite. Use `@fontsource-variable/geist` exclusively. Verify the correct package before writing any font-family CSS.

4. **WCAG contrast failures on muted text** — `#898989` on `#171717` is ~4.6:1, barely above the 4.5:1 AA threshold. Small deviations fail. The green accent (`#00c573`) on dark backgrounds is ~3.5:1 — never use green for small text. Run WebAIM checks on all text/background pairs before committing token values.

5. **Pill button CVA conflicts with size variants** — the `sm`/`lg` size variants hardcode `rounded-md` in the same CVA merge. Adding `rounded-full` to a new `pill` variant produces class conflicts unless resolved via compound variants (`compoundVariants`) or a separate `rounded` CVA dimension.

6. **Missing `suppressHydrationWarning` on `<html>`** — without this, next-themes triggers React hydration warnings on every page load because the server-applied theme class may not match what the client expects for `system` preference. One-line fix in `root.tsx`; must be done in the foundation phase.

## Implications for Roadmap

Based on the build-order dependencies identified in ARCHITECTURE.md, a 6-phase structure is the optimal sequencing. Each phase is a logical unit that unblocks the next.

### Phase 1: Foundation
**Rationale:** All subsequent work depends on fonts being installed and the CSS variable architecture being correctly established. Nothing renders correctly until primitives exist and `@theme` is verified. The `kit.css` audit also belongs here — hardcoded colors in kit.css will break under the new theme and must be replaced before token values are written.
**Delivers:** Geist/Geist Mono installed; Supabase primitive tokens in `:root`; `@theme` extended with `--color-sb-*` and font entries; `suppressHydrationWarning` added to `<html>`; `kit.css` hardcoded colors replaced with semantic tokens; naming convention established (`--sb-*` prefix for all Supabase-specific primitives).
**Addresses:** Geist font installation, primitive token layer, CSS architecture correctness
**Avoids:** Wrong Geist package (Pitfall 3), `@theme` raw value trap (Pitfall 10), `kit.css` hardcoded color breakage (Pitfall 9), hydration warnings (Pitfall 2)

### Phase 2: Dark Theme Palette
**Rationale:** Dark is the primary theme per DESIGN.md and is fully specced. Build dark first; use it as the verified reference when speccing light. Completing dark before starting light also enables real visual validation at every step.
**Delivers:** All Shadcn semantic tokens in `.dark {}` overridden with Supabase dark palette; `--sidebar-*` tokens updated for dark; border-based depth (card/container shadows removed); WCAG AA contrast verified for dark theme.
**Addresses:** Dark CSS variable overrides, border-based depth, sidebar dark theme, WCAG dark
**Avoids:** Contrast failures on muted text (Pitfall 5), CSS variable naming conflicts (Pitfall 6), incomplete token coverage (Destructive/Ghost variants missing)

### Phase 3: Light Theme Palette
**Rationale:** Light theme cannot be built until dark is verified — dark values serve as the reference for mapping neutrals. The light palette has a gap in the source spec (marked "Active" in PROJECT.md), so this phase may require design decisions before implementation.
**Delivers:** All Shadcn semantic tokens in `:root {}` overridden with Supabase light palette; `--sidebar-*` tokens updated for light; WCAG AA contrast verified for light theme.
**Addresses:** Light CSS variable overrides, system preference toggle completion, WCAG light
**Avoids:** Dark-to-light copy without contrast re-check (Pitfall 5), missing `:root` tokens that silently inherit browser defaults

### Phase 4: Component Variants
**Rationale:** Component variants depend on semantic tokens from Phases 2-3 being finalized. Doing this earlier risks having to update variant classes when token names change.
**Delivers:** `pill` and `pill-ghost` CVA variants in `button.tsx`; `pill` shape override in `tabs.tsx`; all size + variant combinations tested.
**Addresses:** Pill button variant, pill tab variant
**Avoids:** CVA size/radius conflicts (Pitfall 8); use compound variants or separate `rounded` CVA dimension

### Phase 5: Structural Theming
**Rationale:** Sidebar, form inputs, and data table require knowing final token values from Phases 2-3. They also touch more files than pure CSS variable work, making them the right "integration" phase after the token layer is locked.
**Delivers:** Sidebar navigation themed (green accents, weight-500 links, active state indicators); form inputs/select/checkbox/radio themed; data table themed; Sonner toasts themed; Radix portal components verified.
**Addresses:** Sidebar theming, form inputs, data table, toast notifications
**Avoids:** Green used as background on active states (must use `--sidebar-accent` surface); focus ring preservation (Pitfall 7)

### Phase 6: Verification and Polish
**Rationale:** End-to-end verification catches anything that slipped through per-phase checks. The "Looks Done But Isn't" checklist from PITFALLS.md has 8 items that require a complete, functioning theme to verify.
**Delivers:** Dark/light/system three-way toggle tested end-to-end; all Shadcn component variants verified in both themes; font loaded verified in production build; keyboard navigation and focus indicators confirmed in both themes; Recharts chart colors verified; no theme flicker confirmed; Lighthouse CLS baseline maintained.
**Addresses:** No theme flicker, WCAG focus visible, production font loading, system preference
**Avoids:** "Looks done but isn't" failures; production build font path failures (different from dev)

### Phase Ordering Rationale

- Fonts and primitives must precede all color work — components that reference undefined CSS variables silently fall back to browser defaults, producing misleading visuals during development
- Dark before light — dark is fully specced; light has a gap that requires design input; avoid blocking on design decisions during the dark implementation pass
- CSS token work before component variants — variant classes should reference finalized token names; early variant work requires rework if tokens rename
- Structural theming after token lock — sidebar/forms/tables reference many tokens; doing this after token values are stable avoids cascading rework
- Verification last and isolated — the full-system check requires all previous phases to be complete; running it earlier gives false confidence on partial work

### Research Flags

Phases with well-documented patterns (standard implementation, skip additional research):
- **Phase 1 (Foundation):** Fontsource install and CSS variable architecture are thoroughly documented in official sources. Codebase inspection confirmed existing pattern is already correct.
- **Phase 2 (Dark Palette):** DESIGN.md specifies the full dark palette. Mechanical token-mapping work.
- **Phase 4 (Component Variants):** CVA compound variants are well-documented. Button component is owned source.
- **Phase 6 (Verification):** Checklist-driven; no novel decisions required.

Phases that may need closer attention during planning:
- **Phase 3 (Light Palette):** The light palette spec has a noted gap in PROJECT.md ("Active" status). Design decisions may be needed before implementation can proceed. Validate completeness of DESIGN.md light palette before committing to this phase.
- **Phase 5 (Structural Theming):** Sidebar uses dedicated `--sidebar-*` tokens separate from the main token set. Radix portals render at `document.body` and inherit `.dark` only via the `(&:where(.dark, .dark *))` variant — verify this works for all portal-based components (Select, Dialog, Popover, Tooltip) before considering Phase 5 complete.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only two new packages; verified via Fontsource official docs and npm registry; existing architecture confirmed via codebase inspection |
| Features | HIGH | Shadcn theming is well-documented; feature set derives directly from DESIGN.md spec; anti-features are grounded in well-understood tradeoffs |
| Architecture | HIGH | Verified against official Shadcn v4 docs, Tailwind v4 docs, and direct codebase inspection; existing four-file CSS pattern is already correct |
| Pitfalls | HIGH | 10 pitfalls identified; most verified against official docs, Tailwind GitHub discussions, and direct codebase inspection; all have prevention strategies |

**Overall confidence:** HIGH

### Gaps to Address

- **Light theme palette completeness:** PROJECT.md notes the light palette spec as "Active" (incomplete). Before Phase 3 begins, DESIGN.md must have a complete light palette or a decision must be made to derive it systematically from the dark palette. This is a design input gap, not a research gap.
- **`react-day-picker` date picker theming:** PITFALLS.md flags that `react-day-picker` imports hardcoded colors that may conflict with the new theme. If the application uses date pickers, their stylesheet needs auditing. This is a lower-priority gap — identify whether date pickers are used in any current ERP module before Phase 5.
- **Recharts `hsl()` wrapping:** `shadcn-ui.css` defines `--chart-1` through `--chart-5` with values wrapped in `hsl()` by consumers (`hsl(var(--chart-1))`). If chart token values are converted to oklch format during the palette overhaul, the `hsl()` wrappers in chart components will break. Audit chart usage before changing chart token format.

## Sources

### Primary (HIGH confidence)
- [Shadcn UI Theming Docs](https://ui.shadcn.com/docs/theming) — CSS variable token system, semantic pairs
- [Shadcn UI Tailwind v4 Migration Guide](https://ui.shadcn.com/docs/tailwind-v4) — `@theme inline` pattern, OKLCH migration
- [Tailwind CSS v4 Dark Mode Docs](https://tailwindcss.com/docs/dark-mode) — `@custom-variant` / `@variant` syntax
- [Fontsource Geist](https://fontsource.org/fonts/geist/install) — `@fontsource-variable/geist` package and import syntax
- [Fontsource Geist Mono](https://fontsource.org/fonts/geist-mono/install) — `@fontsource-variable/geist-mono` package
- [Tailwind GitHub Discussion #18560](https://github.com/tailwindlabs/tailwindcss/discussions/18560) — `@theme` vs `@theme inline` behavior differences
- [Tailwind GitHub Discussion #16730](https://github.com/tailwindlabs/tailwindcss/discussions/16730) — dark-mode-specific CSS variables in Tailwind 4
- [Geist Font GitHub Issue #62](https://github.com/vercel/geist-font/issues/62) — `geist` package Next.js-only limitation
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — WCAG AA contrast ratio standards
- [next-themes README](https://github.com/pacocoursey/next-themes) — `suppressHydrationWarning`, SSR hydration patterns
- Codebase inspection: `app/styles/`, `packages/ui/src/shadcn/button.tsx`, `app/root.tsx`, `app/components/root-providers.tsx` — confirmed existing architecture

### Secondary (MEDIUM confidence)
- [Shadcnblocks Tailwind v4 Theming Guide](https://www.shadcnblocks.com/blog/tailwind4-shadcn-themeing/) — breaking changes, border color removal
- [Supabase Design System (DeepWiki)](https://deepwiki.com/supabase/supabase/2.5-design-system-and-ui-library) — Supabase token architecture reference
- [Design Tokens That Scale — Tailwind v4](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026) — three-tier token architecture
- [Vercel Geist Font Issue #107](https://github.com/vercel/geist-font/issues/107) — Vite/Remix incompatibility confirmation

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
