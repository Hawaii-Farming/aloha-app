# Phase 1: Foundation + Dark Theme - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Install Geist fonts, establish the CSS token architecture with Supabase dark palette values, implement border-based depth, define green accent tokens, and verify WCAG AA compliance. This phase covers only the dark theme foundation — light theme, component-specific theming, and enhancement tokens are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Token format
- **D-01:** Use oklch color format for all Shadcn semantic CSS token overrides — consistent with existing values in `shadcn-ui.css` and native to Tailwind CSS 4
- **D-02:** Convert DESIGN.md hex/HSL values to oklch equivalents when overriding tokens (e.g., `#171717` → oklch equivalent)
- **D-03:** Keep `var(--color-*)` references to Tailwind's built-in palette where they exist (e.g., `var(--color-red-500)` for destructive) — only replace where Supabase palette diverges

### Font installation
- **D-04:** Install `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` packages (NOT the `geist` npm package — Vite incompatible per STATE.md decision)
- **D-05:** Import fonts in `global.css` and set `--font-sans` to `'Geist Variable', ...fallbacks` and `--font-mono` to `'Geist Mono Variable', ...fallbacks`
- **D-06:** Update both `:root` and `@theme` declarations to reference the new font variables

### Green accent wiring
- **D-07:** Define separate custom tokens: `--supabase-green` (`#3ecf8e` in oklch), `--supabase-green-link` (`#00c573` in oklch), `--supabase-green-border` (`rgba(62, 207, 142, 0.3)` equivalent)
- **D-08:** Do NOT replace `--primary` with green — keep `--primary` as the general-purpose Shadcn token (neutral dark/light as currently configured)
- **D-09:** Wire `--supabase-green` into sidebar primary accent: `--sidebar-primary` should use the green token in dark mode

### Shadow removal
- **D-10:** Override `--card`, `--popover`, and container-related tokens to use border-defined depth with no box-shadow
- **D-11:** Remove shadow utility usage from Card and container components where present — depth comes from `border` classes only
- **D-12:** Retain minimal functional shadows for focus states only (per DESIGN.md: `rgba(0, 0, 0, 0.1) 0px 4px 12px`)

### Palette mapping
- **D-13:** Override the full Shadcn dark palette in `.dark {}` with Supabase neutral scale: `#171717` for background, `#fafafa` for foreground text, `#2e2e2e` for borders, etc.
- **D-14:** Add Supabase-specific neutral tokens as CSS custom properties: `--sb-dark`, `--sb-border-dark`, `--sb-border-mid`, `--sb-charcoal`, `--sb-mid-gray`, `--sb-light-gray`, `--sb-near-white`

### WCAG verification
- **D-15:** Verify all dark theme text/background combinations meet WCAG AA (4.5:1 normal text, 3:1 large text) after token overrides — use automated contrast checks

### Hydration warning
- **D-16:** Add `suppressHydrationWarning` to the `<html>` element in `root.tsx` to prevent next-themes hydration mismatch warnings

### Claude's Discretion
- Exact oklch conversion values for each hex/HSL color (as long as they maintain visual fidelity and contrast)
- Naming convention for supplementary Supabase-specific CSS custom properties (prefix style)
- Whether to add the Supabase neutral scale tokens in the `:root` block or in a separate CSS file
- Font fallback chain specifics (beyond the primary Geist + system fallbacks)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design specification
- `DESIGN.md` — Complete Supabase dark theme specification: color palette, typography rules, component stylings, neutral scale values, border system, shadow policy
- `DESIGN.md` S2 — Color Palette & Roles: hex values for all neutral scale, green accents, Radix tokens, surface overlays
- `DESIGN.md` S3 — Typography Rules: font hierarchy, weight restraint, line heights, letter spacing

### Current theme infrastructure
- `app/styles/shadcn-ui.css` — Current Shadcn CSS variable definitions for `:root` (light) and `.dark` — the primary file to override
- `app/styles/theme.css` — Tailwind `@theme` block mapping Shadcn variables to Tailwind color tokens
- `app/styles/global.css` — CSS import order, Tailwind setup, base layer styles, dark variant definition
- `app/root.tsx` — Root component where `<html>` element needs `suppressHydrationWarning`

### Theme toggle infrastructure
- `app/components/root-providers.tsx` — ThemeProvider setup (next-themes)
- `packages/ui/src/kit/mode-toggle.tsx` — Theme toggle component

### Requirements
- `.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-09 define acceptance criteria for this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/styles/shadcn-ui.css`: Already has `:root` and `.dark` blocks with all Shadcn semantic tokens — override in place rather than creating new files
- `app/styles/theme.css`: `@theme` block already bridges Shadcn vars to Tailwind — update `--font-sans` reference here
- `app/styles/global.css`: Import chain and base layer already set up — add font imports at the top
- `packages/ui/src/shadcn/`: All Shadcn components already consume CSS variables — no component code changes needed for palette swap

### Established Patterns
- **CSS variable architecture**: Three-layer system — primitives in `shadcn-ui.css` `:root`/`.dark`, semantic mapping in `theme.css` `@theme`, consumption in components via Tailwind classes
- **Dark mode**: Uses `.dark` class selector (not media query), applied by next-themes — `@variant dark (&:where(.dark, .dark *))` in global.css
- **Color format**: Mix of `var(--color-*)` Tailwind refs and inline oklch values — standardize on oklch for custom values

### Integration Points
- `app/root.tsx:68` — `<html>` element where `suppressHydrationWarning` must be added and where className includes theme class
- `app/styles/global.css:8` — Font CSS imports should be added before theme imports
- `app/styles/shadcn-ui.css:10-58` — `:root` block for light defaults (untouched in Phase 1)
- `app/styles/shadcn-ui.css:60-103` — `.dark` block where all dark palette overrides go

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The DESIGN.md spec is comprehensive and prescriptive.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-dark-theme*
*Context gathered: 2026-04-02*
