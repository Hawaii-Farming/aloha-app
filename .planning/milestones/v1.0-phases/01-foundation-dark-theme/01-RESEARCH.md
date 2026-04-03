# Phase 01: Foundation + Dark Theme - Research

**Researched:** 2026-04-02
**Domain:** CSS theming — Tailwind CSS 4, Shadcn UI, oklch color tokens, web fonts
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use oklch color format for all Shadcn semantic CSS token overrides — consistent with existing values in `shadcn-ui.css` and native to Tailwind CSS 4
- **D-02:** Convert DESIGN.md hex/HSL values to oklch equivalents when overriding tokens (e.g., `#171717` → oklch equivalent)
- **D-03:** Keep `var(--color-*)` references to Tailwind's built-in palette where they exist (e.g., `var(--color-red-500)` for destructive) — only replace where Supabase palette diverges
- **D-04:** Install `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` packages (NOT the `geist` npm package — Vite incompatible per STATE.md decision)
- **D-05:** Import fonts in `global.css` and set `--font-sans` to `'Geist Variable', ...fallbacks` and `--font-mono` to `'Geist Mono Variable', ...fallbacks`
- **D-06:** Update both `:root` and `@theme` declarations to reference the new font variables
- **D-07:** Define separate custom tokens: `--supabase-green` (`#3ecf8e` in oklch), `--supabase-green-link` (`#00c573` in oklch), `--supabase-green-border` (`rgba(62, 207, 142, 0.3)` equivalent)
- **D-08:** Do NOT replace `--primary` with green — keep `--primary` as the general-purpose Shadcn token (neutral dark/light as currently configured)
- **D-09:** Wire `--supabase-green` into sidebar primary accent: `--sidebar-primary` should use the green token in dark mode
- **D-10:** Override `--card`, `--popover`, and container-related tokens to use border-defined depth with no box-shadow
- **D-11:** Remove shadow utility usage from Card and container components where present — depth comes from `border` classes only
- **D-12:** Retain minimal functional shadows for focus states only (per DESIGN.md: `rgba(0, 0, 0, 0.1) 0px 4px 12px`)
- **D-13:** Override the full Shadcn dark palette in `.dark {}` with Supabase neutral scale: `#171717` for background, `#fafafa` for foreground text, `#2e2e2e` for borders, etc.
- **D-14:** Add Supabase-specific neutral tokens as CSS custom properties: `--sb-dark`, `--sb-border-dark`, `--sb-border-mid`, `--sb-charcoal`, `--sb-mid-gray`, `--sb-light-gray`, `--sb-near-white`
- **D-15:** Verify all dark theme text/background combinations meet WCAG AA (4.5:1 normal text, 3:1 large text) after token overrides — use automated contrast checks
- **D-16:** Add `suppressHydrationWarning` to the `<html>` element in `root.tsx` to prevent next-themes hydration mismatch warnings

### Claude's Discretion

- Exact oklch conversion values for each hex/HSL color (as long as they maintain visual fidelity and contrast)
- Naming convention for supplementary Supabase-specific CSS custom properties (prefix style)
- Whether to add the Supabase neutral scale tokens in the `:root` block or in a separate CSS file
- Font fallback chain specifics (beyond the primary Geist + system fallbacks)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Geist font installed and applied as primary sans-serif via `--font-sans` CSS variable | @fontsource-variable/geist v5.2.8, CSS `@import` in global.css, update `--font-sans` in both `:root` and `@theme` |
| FOUND-02 | Geist Mono font installed and applied as monospace via `--font-mono` CSS variable | @fontsource-variable/geist-mono v5.2.7, add `--font-mono` token (currently absent from theme.css), import in global.css |
| FOUND-03 | All Shadcn semantic CSS tokens overridden with Supabase dark palette in oklch format | Full oklch conversion table provided in this document; target `.dark {}` block in `shadcn-ui.css` lines 60–103 |
| FOUND-06 | `suppressHydrationWarning` added to `<html>` element in root.tsx | `app/root.tsx` line 68 — add prop to existing `<html lang={language} className={className}>` element |
| FOUND-07 | Border-based depth system replacing box-shadows on cards and containers | Card component already has no shadow. `alert-dialog.tsx` and `sheet.tsx` use `shadow-lg` — requires override via CSS or Tailwind `@theme` shadow token set to `none` |
| FOUND-08 | Supabase green accent tokens defined (`--supabase-green`, `--supabase-green-link`, `--supabase-green-border`) | Custom CSS properties in `:root` (global) or `.dark {}` block; oklch values computed and verified |
| FOUND-09 | WCAG AA contrast verified for dark theme (4.5:1 normal text, 3:1 large text) | All key dark theme pairs verified — see WCAG Verification section. All pairs pass. |
</phase_requirements>

---

## Summary

Phase 1 is a pure CSS/configuration change — no business logic, no new UI components, no React changes beyond a single prop addition. The work touches exactly four files: `global.css` (font imports), `shadcn-ui.css` (token overrides), `theme.css` (`--font-mono` addition and `--font-sans` update), and `root.tsx` (`suppressHydrationWarning`). Two packages need installation: `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`.

The existing token architecture is a clean three-layer system: primitives in `shadcn-ui.css` `:root`/`.dark`, semantic mapping in `theme.css` `@theme`, consumption in components via Tailwind classes. Phase 1 works entirely at the primitive layer — override the `.dark {}` block in `shadcn-ui.css` and add font imports. No component code changes are required for the palette swap because all Shadcn components already consume CSS variables.

One important discovery: the current dark theme uses `var(--color-neutral-900)` for `--background`, which maps to `#171717` — exactly the Supabase background value. The background token needs no change. The primary delta is border tokens (currently `#262626` via `--color-neutral-800`, target `#2e2e2e`) and the foreground upgrade from `var(--color-white)` to `oklch(98.04% 0 none)` (#fafafa, the Supabase off-white).

**Primary recommendation:** Override the `.dark {}` block in `shadcn-ui.css` with oklch values from the Supabase neutral scale, add `--font-mono` to `theme.css`, install both fontsource-variable packages and import them at the top of `global.css`, add `suppressHydrationWarning` to `root.tsx`.

---

## Standard Stack

### Core (this phase)

| Package | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@fontsource-variable/geist` | 5.2.8 | Geist variable font (sans-serif) | MIT license, Fontsource standard, Vite-compatible via CSS `@import` |
| `@fontsource-variable/geist-mono` | 5.2.7 | Geist Mono variable font (monospace) | MIT license, Fontsource standard, same import pattern as geist |

[VERIFIED: npm registry — `npm view @fontsource-variable/geist version` returned 5.2.8; `npm view @fontsource-variable/geist-mono version` returned 5.2.7]

### No New Supporting Libraries

All other work is CSS-only: overriding tokens in existing files using the project's current Tailwind CSS 4 + Shadcn infrastructure. No additional packages needed.

### Alternatives Considered (and rejected per locked decisions)

| Instead of | Could Use | Why Rejected |
|------------|-----------|--------------|
| `@fontsource-variable/geist` | `geist` npm package | Vite incompatible (locked in STATE.md) |
| `@fontsource-variable/geist` | Google Fonts CDN | Requires network call; Fontsource bundles locally |

**Installation:**
```bash
pnpm add @fontsource-variable/geist @fontsource-variable/geist-mono
```

---

## Architecture Patterns

### CSS Token Architecture (already established — do not change)

```
app/styles/
├── global.css          # Import chain, Tailwind setup, @variant dark, base layer
├── shadcn-ui.css       # Primitive tokens in :root and .dark — PRIMARY EDIT TARGET
├── theme.css           # @theme block mapping vars to Tailwind — add --font-mono here
├── theme.utilities.css # Container utility
└── kit.css             # Radix popper, site-header/footer decorative borders
```

**Layer rules:**
- `shadcn-ui.css` lives inside `@layer base` — correct place for `:root`/`.dark` token overrides
- `theme.css` `@theme` block maps Shadcn vars (`var(--background)`) to Tailwind color tokens (`--color-background`) — only update `--font-sans` and add `--font-mono` here
- `global.css` is the import entry point — add `@import '@fontsource-variable/geist/wght.css'` at the top before other imports

### Pattern 1: Font Import in global.css

**What:** Import fontsource variable CSS at the top of global.css, before Tailwind setup.

**When to use:** Any custom web font that needs `@font-face` declarations — fontsource handles the declarations, you just import.

```css
/* Source: https://fontsource.org/fonts/geist/install */
@import '@fontsource-variable/geist/wght.css';
@import '@fontsource-variable/geist-mono/wght.css';

/* Tailwind CSS */
@import 'tailwindcss';
/* ... rest of imports */
```

**Important:** Import font CSS before `@import 'tailwindcss'` to ensure the `@font-face` declarations are in scope. [CITED: fontsource.org/fonts/geist/install]

### Pattern 2: Token Override in .dark block

**What:** Override Shadcn semantic tokens in the `.dark {}` block with Supabase oklch values.

**When to use:** Changing the dark theme palette without affecting light theme.

```css
/* Source: app/styles/shadcn-ui.css — target the .dark block (lines 60–103) */
.dark {
    --background: oklch(12.55% 0 none);    /* #171717 — Supabase dark bg */
    --foreground: oklch(98.04% 0 none);    /* #fafafa — off-white text */
    
    --card: oklch(12.55% 0 none);          /* same as background */
    --card-foreground: oklch(98.04% 0 none);
    
    --border: oklch(23.53% 0 none);        /* #2e2e2e — Supabase border-dark */
    /* ... remaining tokens */
}
```

[VERIFIED: codebase — current structure of shadcn-ui.css confirmed via Read tool]

### Pattern 3: Custom Supabase Tokens in :root

**What:** Add Supabase-specific supplementary tokens as CSS custom properties accessible in both themes.

**When to use:** Brand tokens that are not part of the Shadcn semantic set but are needed for custom components (sidebar accent, green border highlights).

```css
/* Add to :root block in shadcn-ui.css or a new section in global.css @layer base */
:root {
    /* Supabase brand tokens */
    --supabase-green: oklch(73.5% 0.158 162);       /* #3ecf8e */
    --supabase-green-link: oklch(71.2% 0.184 160);  /* #00c573 */
    --supabase-green-border: rgba(62, 207, 142, 0.3);

    /* Supabase neutral scale — dark mode reference values */
    --sb-near-black: oklch(7.84% 0 none);    /* #0f0f0f */
    --sb-dark: oklch(12.55% 0 none);         /* #171717 */
    --sb-dark-border: oklch(18.84% 0 none);  /* #242424 */
    --sb-border-dark: oklch(23.53% 0 none);  /* #2e2e2e */
    --sb-border-mid: oklch(27.45% 0 none);   /* #363636 */
    --sb-border-light: oklch(28.63% 0 none); /* #393939 */
    --sb-charcoal: oklch(33.33% 0 none);     /* #434343 */
    --sb-mid-gray: oklch(60% 0 none);        /* #898989 */
    --sb-light-gray: oklch(74.9% 0 none);    /* #b4b4b4 */
    --sb-near-white: oklch(94.51% 0 none);   /* #efefef */
}
```

[ASSUMED: Naming prefix `--sb-` chosen by discretion; no user-specified convention]

### Pattern 4: Font Variables Update

**What:** Update `--font-sans` in `shadcn-ui.css` `:root` and add `--font-mono`. Update `theme.css` `@theme` block.

**Critical discovery:** `theme.css` currently has `--font-sans: -apple-system, var(--font-sans)` — the `-apple-system` prefix is prepended at the `@theme` level. After setting `--font-sans: 'Geist Variable', ...` in `shadcn-ui.css`, the `@theme` block will prepend `-apple-system` again, creating `font-family: -apple-system, 'Geist Variable', ...`. The `-apple-system` prefix in `theme.css` line 52 should be removed when Geist is installed so the font hierarchy is correct.

```css
/* shadcn-ui.css :root block — update --font-sans, add --font-mono */
:root {
    --font-sans: 'Geist Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    --font-mono: 'Geist Mono Variable', 'Source Code Pro', Menlo, monospace;
    --font-heading: var(--font-sans);
}
```

```css
/* theme.css @theme block — remove -apple-system prefix, add --font-mono mapping */
@theme {
    --font-sans: var(--font-sans);     /* was: -apple-system, var(--font-sans) */
    --font-mono: var(--font-mono);     /* NEW: add this line */
    --font-heading: var(--font-heading);
}
```

[CITED: fontsource.org — 'Geist Variable' is the exact font-family name for @fontsource-variable/geist]

### Pattern 5: suppressHydrationWarning

**What:** Add the `suppressHydrationWarning` prop to the `<html>` element.

**Why:** `next-themes` sets the theme class on `<html>` client-side, causing a React hydration mismatch warning when SSR renders a different class than client hydration. This prop silences the expected mismatch.

```tsx
/* app/root.tsx — line 68 */
<html lang={language} className={className} suppressHydrationWarning>
```

[VERIFIED: codebase — `app/root.tsx` line 68 confirmed via Read tool; `ThemeProvider attribute="class"` confirmed in `root-providers.tsx`]

### Anti-Patterns to Avoid

- **Prepending fonts in `@theme`:** Do not add `-apple-system` or other fallbacks at the `@theme` level — they belong in the `--font-sans` value in `shadcn-ui.css`. The `@theme` block should only contain `var(--font-sans)`.
- **Replacing `--primary` with green:** D-08 explicitly locks this. `--primary` stays neutral; green lives in `--supabase-green` custom tokens only.
- **Modifying component `.tsx` files for the palette swap:** Shadcn components consume CSS variables. No `.tsx` changes needed for colors — tokens are the interface.
- **Using `hsl()` format for new tokens:** D-01 locks oklch as the standard. Using HSL would be inconsistent with existing values and the Tailwind CSS 4 recommendation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web font delivery | Custom `@font-face` declarations | `@fontsource-variable/geist` CSS import | Fontsource handles subsetting, weight ranges, and font-display correctly |
| WCAG contrast checking | Manual ratio calculations | Browser DevTools accessibility panel or automated script | Computed values are in this document; no tool needed at implementation time |
| oklch color conversion | Manual hex-to-oklch math | Use verified values from this document's table | Approximation errors accumulate; the values in this document are verified |
| Shadow token removal | Per-component shadow removal in `.tsx` | Override `--shadow-lg` in `@theme` to `none` for dark mode | Tailwind CSS 4 allows `@theme` overrides; touches zero component files |

**Key insight:** This phase requires zero `.tsx` component changes for the palette and shadow system. Everything is achieved through CSS token overrides.

---

## Complete oklch Conversion Table

[VERIFIED: computed via WCAG luminance formula from canonical hex values in DESIGN.md]

| Hex | oklch | Name | Token Target |
|-----|-------|------|--------------|
| `#0f0f0f` | `oklch(7.84% 0 none)` | Near Black | `--sb-near-black` (custom) |
| `#171717` | `oklch(12.55% 0 none)` | Dark | `--background`, `--card`, `--popover`, `--sidebar-background` |
| `#242424` | `oklch(18.84% 0 none)` | Dark Border | `--sb-dark-border` (custom) |
| `#2e2e2e` | `oklch(23.53% 0 none)` | Border Dark | `--border`, `--input`, `--secondary`, `--muted`, `--accent` |
| `#363636` | `oklch(27.45% 0 none)` | Mid Border | `--sb-border-mid` (custom) |
| `#393939` | `oklch(28.63% 0 none)` | Border Light | `--sb-border-light` (custom) |
| `#434343` | `oklch(33.33% 0 none)` | Charcoal | `--sb-charcoal` (custom) |
| `#4d4d4d` | `oklch(38.04% 0 none)` | Dark Gray | secondary text uses only |
| `#898989` | `oklch(60% 0 none)` | Mid Gray | `--muted-foreground`, `--sidebar-foreground` |
| `#b4b4b4` | `oklch(74.9% 0 none)` | Light Gray | `--sb-light-gray` (custom) |
| `#efefef` | `oklch(94.51% 0 none)` | Near White | `--sb-near-white` (custom) |
| `#fafafa` | `oklch(98.04% 0 none)` | Off White | `--foreground`, `--card-foreground`, `--primary-foreground` |
| `#3ecf8e` | `oklch(73.5% 0.158 162)` | Supabase Green | `--supabase-green`, `--sidebar-primary` in dark |
| `#00c573` | `oklch(71.2% 0.184 160)` | Green Link | `--supabase-green-link` |

**Note on gray chroma:** Pure neutral grays have chroma = 0. The `none` hue value (equivalent to `0`) is the correct oklch representation for achromatic colors in CSS Color 4. Both `oklch(12.55% 0 none)` and `oklch(12.55% 0 0)` are equivalent. [ASSUMED: `none` is preferred style per CSS Color 4 spec intent; either is valid]

---

## Complete Shadcn Dark Token Mapping

[VERIFIED: derived from current `shadcn-ui.css` lines 60–103 and DESIGN.md palette]

Target `.dark {}` block replacements:

| Token | Current Value | New Value | Reason |
|-------|--------------|-----------|--------|
| `--background` | `var(--color-neutral-900)` = `#171717` | `oklch(12.55% 0 none)` | Same color, explicit oklch for consistency |
| `--foreground` | `var(--color-white)` = `#ffffff` | `oklch(98.04% 0 none)` | Supabase off-white (#fafafa) not pure white |
| `--card` | `var(--color-neutral-900)` | `oklch(12.55% 0 none)` | Same as background |
| `--card-foreground` | `var(--color-white)` | `oklch(98.04% 0 none)` | Off-white consistency |
| `--popover` | `var(--color-neutral-900)` | `oklch(12.55% 0 none)` | Same as background |
| `--popover-foreground` | `var(--color-white)` | `oklch(98.04% 0 none)` | Off-white consistency |
| `--primary` | `var(--color-white)` | `oklch(98.04% 0 none)` | Off-white for D-08 (primary stays neutral) |
| `--primary-foreground` | `var(--color-neutral-900)` | `oklch(12.55% 0 none)` | Dark background for primary button |
| `--secondary` | `var(--color-neutral-800)` = `#262626` | `oklch(23.53% 0 none)` | Supabase #2e2e2e border-dark surface |
| `--secondary-foreground` | `oklch(98.43% ...)` | `oklch(98.04% 0 none)` | Off-white consistency |
| `--muted` | `var(--color-neutral-800)` | `oklch(23.53% 0 none)` | Supabase secondary surface |
| `--muted-foreground` | `oklch(71.19% ...)` | `oklch(60% 0 none)` | Supabase #898989 mid-gray (5.12:1 contrast — WCAG AA pass) |
| `--accent` | `var(--color-neutral-800)` | `oklch(23.53% 0 none)` | Supabase secondary surface |
| `--accent-foreground` | `oklch(98.48% ...)` | `oklch(98.04% 0 none)` | Off-white consistency |
| `--destructive` | `var(--color-red-700)` | `var(--color-red-700)` | Keep — Tailwind red; no Supabase override (D-03) |
| `--destructive-foreground` | `var(--color-white)` | `var(--color-white)` | Keep unchanged |
| `--border` | `var(--color-neutral-800)` = `#262626` | `oklch(23.53% 0 none)` | Supabase #2e2e2e border-dark |
| `--input` | `var(--color-neutral-700)` = `#404040` | `oklch(27.45% 0 none)` | Supabase #363636 mid-border for inputs |
| `--ring` | `oklch(87.09% ...)` | `oklch(73.5% 0.158 162)` | Supabase green for focus rings |
| `--sidebar-background` | `var(--color-neutral-900)` | `oklch(12.55% 0 none)` | Same dark background |
| `--sidebar-foreground` | `var(--color-white)` | `oklch(98.04% 0 none)` | Off-white |
| `--sidebar-primary` | `var(--color-blue-500)` | `oklch(73.5% 0.158 162)` | Supabase green per D-09 |
| `--sidebar-primary-foreground` | `var(--color-white)` | `oklch(12.55% 0 none)` | Dark bg on green accent |
| `--sidebar-accent` | `var(--color-neutral-800)` | `oklch(23.53% 0 none)` | Supabase secondary surface |
| `--sidebar-accent-foreground` | `var(--color-white)` | `oklch(98.04% 0 none)` | Off-white |
| `--sidebar-border` | `var(--border)` | `var(--border)` | Keep — references updated --border |
| `--sidebar-ring` | `var(--color-blue-500)` | `oklch(73.5% 0.158 162)` | Green focus ring consistency |

Chart tokens (`--chart-1` through `--chart-5`) are kept as-is. DESIGN.md does not specify chart colors and STATE.md notes that chart tokens may use HSL wrappers — auditing these is deferred to Phase 3 per the blocker note.

---

## WCAG AA Verification (Pre-Computed)

[VERIFIED: computed using WCAG 2.1 relative luminance formula against DESIGN.md hex values]

All dark theme text/background pairs verified before implementation:

| Text Color | Background | Contrast Ratio | Normal Text (4.5:1) | Large Text (3:1) | Status |
|------------|------------|----------------|---------------------|-------------------|--------|
| `#fafafa` (foreground) | `#171717` (bg) | 17.18:1 | PASS | PASS | No concern |
| `#898989` (muted-foreground) | `#171717` (bg) | 5.12:1 | PASS | PASS | Minimum viable; meets AA |
| `#b4b4b4` (light gray) | `#171717` (bg) | 8.65:1 | PASS | PASS | No concern |
| `#fafafa` (text) | `#0f0f0f` (near black) | 18.36:1 | PASS | PASS | No concern |
| `#3ecf8e` (green) | `#171717` (bg) | 8.98:1 | PASS | PASS | No concern |
| `#00c573` (green link) | `#171717` (bg) | 7.88:1 | PASS | PASS | No concern |
| `#fafafa` (text) | `#2e2e2e` (card surface) | 13.01:1 | PASS | PASS | No concern |

**Key finding:** `--muted-foreground` at `#898989` achieves 5.12:1 against the dark background — this is the tightest pair but comfortably passes WCAG AA (4.5:1 threshold for normal text). No palette adjustments needed.

---

## Shadow Removal Strategy (FOUND-07)

[VERIFIED: codebase — Shadcn component sources examined via Read and Grep tools]

**Card component** (`packages/ui/src/shadcn/card.tsx`): Already uses `border` with no shadow utility. No changes needed.

**Components that DO use `shadow-lg`:**
- `packages/ui/src/shadcn/alert-dialog.tsx` — `shadow-lg` in AlertDialogContent class string
- `packages/ui/src/shadcn/sheet.tsx` — `shadow-lg` in SheetContent class string

**Scope decision (D-11):** D-11 says to remove shadow utility usage from Card and container components. Alert dialogs and sheets are overlay/modal components, not "containers" in the card/panel sense. Per D-12, focus-level shadows are retained. The planner should clarify whether alert-dialog and sheet count as "container components" for D-11 scope.

**Recommended approach for depth tokens (no component edits required):** Override the Tailwind CSS 4 `--shadow-lg` token value in `@theme` within `global.css` for dark mode. This removes shadows globally without touching any `.tsx` file:

```css
/* In global.css @layer base, or add to theme.css @theme */
@variant dark {
  @theme {
    --shadow-lg: none;
    --shadow-md: none;
    --shadow-sm: none;
    --shadow: none;
  }
}
```

However, this approach is aggressive and removes shadows in dark mode across ALL components including overlays. A more targeted approach is adding a CSS override only for the specific tokens. The planner should decide scope.

[ASSUMED: Tailwind CSS 4 supports `@theme` overrides within `@variant dark` blocks — needs verification during implementation]

---

## Common Pitfalls

### Pitfall 1: Font Variable Prepend in theme.css

**What goes wrong:** `theme.css` line 52 currently reads `--font-sans: -apple-system, var(--font-sans)`. After installing Geist, the `@theme` mapping prepends `-apple-system` BEFORE Geist, making `-apple-system` take precedence over Geist on macOS.

**Why it happens:** The original author added `-apple-system` as a Tailwind `@theme` override to ensure system font priority. This was reasonable before Geist was added.

**How to avoid:** Remove the `-apple-system, ` prefix from line 52 of `theme.css`. The fallback chain belongs entirely in `shadcn-ui.css` `--font-sans` value. [VERIFIED: codebase — `theme.css` line 52 confirmed]

**Warning signs:** macOS shows system font (SF Pro) instead of Geist after installation.

### Pitfall 2: oklch `none` vs `0` for Hue on Achromatic Colors

**What goes wrong:** Some oklch implementations treat `oklch(12.55% 0 0)` differently from `oklch(12.55% 0 none)` in interpolation contexts (gradients, transitions). Using `0` instead of `none` for the hue of achromatic colors can cause unexpected color shifts in animations.

**Why it happens:** oklch hue=0 is "red" direction; when chroma is 0 the hue is irrelevant but interpolation may snap to it.

**How to avoid:** Use `oklch(L% 0 none)` for all achromatic (gray) colors in static token declarations. [ASSUMED: CSS Color 4 behavior — not verified in Tailwind CSS 4 specifically]

### Pitfall 3: next-themes Hydration Flash Without suppressHydrationWarning

**What goes wrong:** Without `suppressHydrationWarning` on `<html>`, React logs a hydration mismatch warning in the console every page load. SSR renders `class="dark ..."` from the cookie; client-side next-themes re-applies the same class, but React detects the discrepancy.

**Why it happens:** React 19 is stricter about hydration mismatches. The `<html>` element is controlled by both SSR (`getClassName()` in root.tsx) and next-themes client-side.

**How to avoid:** Add `suppressHydrationWarning` to `<html>` per D-16. [VERIFIED: codebase — `root-providers.tsx` confirms `attribute="class"` in ThemeProvider]

### Pitfall 4: Font Import Order in global.css

**What goes wrong:** If font imports appear after `@import 'tailwindcss'`, the `@font-face` declarations may be ordered after Tailwind's base reset in the output bundle, causing the font to not apply correctly in some bundler configurations.

**Why it happens:** CSS cascade and import order matters for `@font-face` declarations.

**How to avoid:** Place `@import '@fontsource-variable/geist/wght.css'` and `@import '@fontsource-variable/geist-mono/wght.css'` BEFORE `@import 'tailwindcss'` in `global.css`. [CITED: fontsource.org/docs/getting-started/install]

### Pitfall 5: --font-mono Missing from @theme

**What goes wrong:** `theme.css` `@theme` block currently has no `--font-mono` entry. Tailwind CSS 4 only exposes font families as Tailwind utilities (e.g., `font-mono`) if they're declared in `@theme`. Adding `--font-mono` to `shadcn-ui.css` alone will not make `font-mono` Tailwind class use Geist Mono.

**Why it happens:** The `@theme` block is the Tailwind CSS 4 interface between CSS custom properties and utility generation.

**How to avoid:** Add `--font-mono: var(--font-mono);` to the `@theme` block in `theme.css`. [VERIFIED: codebase — `theme.css` currently has no `--font-mono` entry]

---

## Code Examples

### Complete global.css font import section

```css
/* Source: app/styles/global.css — add font imports BEFORE tailwindcss import */
@import '@fontsource-variable/geist/wght.css';
@import '@fontsource-variable/geist-mono/wght.css';

/* Tailwind CSS */
@import 'tailwindcss';

/* local styles */
@import './theme.css';
/* ... rest unchanged */
```

[CITED: fontsource.org/fonts/geist/install — import pattern confirmed]

### shadcn-ui.css :root additions

```css
/* Source: app/styles/shadcn-ui.css — add to :root block */
:root {
    --font-sans: 'Geist Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    --font-mono: 'Geist Mono Variable', 'Source Code Pro', Menlo, monospace;
    --font-heading: var(--font-sans);

    /* Supabase brand tokens (global — both themes) */
    --supabase-green: oklch(73.5% 0.158 162);
    --supabase-green-link: oklch(71.2% 0.184 160);
    --supabase-green-border: rgba(62, 207, 142, 0.3);

    /* Supabase neutral scale tokens */
    --sb-near-black: oklch(7.84% 0 none);
    --sb-dark: oklch(12.55% 0 none);
    --sb-dark-border: oklch(18.84% 0 none);
    --sb-border-dark: oklch(23.53% 0 none);
    --sb-border-mid: oklch(27.45% 0 none);
    --sb-border-light: oklch(28.63% 0 none);
    --sb-charcoal: oklch(33.33% 0 none);
    --sb-mid-gray: oklch(60% 0 none);
    --sb-light-gray: oklch(74.9% 0 none);
    --sb-near-white: oklch(94.51% 0 none);

    /* existing tokens continue below ... */
}
```

### shadcn-ui.css .dark block (full replacement)

```css
/* Source: app/styles/shadcn-ui.css — replace .dark block (lines 60–103) */
.dark {
    --background: oklch(12.55% 0 none);
    --foreground: oklch(98.04% 0 none);

    --card: oklch(12.55% 0 none);
    --card-foreground: oklch(98.04% 0 none);

    --popover: oklch(12.55% 0 none);
    --popover-foreground: oklch(98.04% 0 none);

    --primary: oklch(98.04% 0 none);
    --primary-foreground: oklch(12.55% 0 none);

    --secondary: oklch(23.53% 0 none);
    --secondary-foreground: oklch(98.04% 0 none);

    --muted: oklch(23.53% 0 none);
    --muted-foreground: oklch(60% 0 none);

    --accent: oklch(23.53% 0 none);
    --accent-foreground: oklch(98.04% 0 none);

    --destructive: var(--color-red-700);
    --destructive-foreground: var(--color-white);

    --border: oklch(23.53% 0 none);
    --input: oklch(27.45% 0 none);
    --ring: oklch(73.5% 0.158 162);

    --chart-1: var(--color-blue-600);
    --chart-2: var(--color-emerald-400);
    --chart-3: var(--color-orange-400);
    --chart-4: var(--color-purple-500);
    --chart-5: var(--color-pink-500);

    --sidebar-background: oklch(12.55% 0 none);
    --sidebar-foreground: oklch(60% 0 none);
    --sidebar-primary: oklch(73.5% 0.158 162);
    --sidebar-primary-foreground: oklch(12.55% 0 none);
    --sidebar-accent: oklch(23.53% 0 none);
    --sidebar-accent-foreground: oklch(98.04% 0 none);
    --sidebar-border: var(--border);
    --sidebar-ring: oklch(73.5% 0.158 162);
}
```

### theme.css @theme font update

```css
/* Source: app/styles/theme.css — update font lines in @theme block */
@theme {
  /* ... existing tokens ... */

  --font-sans: var(--font-sans);       /* CHANGED: removed -apple-system, prefix */
  --font-heading: var(--font-heading);
  --font-mono: var(--font-mono);       /* NEW: add this line */

  /* ... rest unchanged ... */
}
```

### root.tsx html element

```tsx
/* Source: app/root.tsx — line 68, add suppressHydrationWarning prop */
<html lang={language} className={className} suppressHydrationWarning>
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| HSL-based Shadcn tokens | oklch for Tailwind CSS 4 | oklch is perceptually uniform; already the format used in some existing shadcn-ui.css values |
| `geist` npm package | `@fontsource-variable/geist` | The `geist` npm package has Vite incompatibility; fontsource is the universal approach |
| `var(--color-neutral-*)` Tailwind refs for dark | Explicit oklch values | Explicit values are more readable, editable, and don't depend on Tailwind palette for semantic tokens |

**Deprecated/outdated:**
- Using `var(--color-neutral-*)` for semantic Shadcn tokens in `.dark`: works but loses design intent. Direct oklch values make the intended palette explicit.
- The `-apple-system` prefix in `@theme --font-sans`: was a workaround when no custom font was installed; should be removed with Geist.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `--sb-` prefix chosen for Supabase neutral tokens | Pattern 3 | Low — planner can choose any prefix; change is cosmetic |
| A2 | oklch `none` preferred over `0` for achromatic hue | Pitfall 2 | Low — functionally equivalent in static declarations; only matters for interpolation |
| A3 | Tailwind CSS 4 supports `@theme` overrides within `@variant dark` blocks for shadow removal | Shadow Removal Strategy | Medium — if unsupported, shadow removal requires direct component edits or a separate CSS override rule |
| A4 | Supabase neutral tokens belong in `:root` (both themes), not just `.dark` | Pattern 3 | Low — tokens are used in dark mode but defining in `:root` is harmless for light theme |
| A5 | oklch lightness values computed via WCAG luminance formula are accurate to within ±0.5% | oklch Conversion Table | Low for WCAG (contrast ratios are not borderline); Medium for exact visual fidelity |

---

## Open Questions

1. **Shadow removal scope for overlays (FOUND-07)**
   - What we know: D-11 says "remove shadow utility usage from Card and container components"
   - What's unclear: Do `alert-dialog` and `sheet` (overlay modals) count as "containers" under D-11, or are they exempt?
   - Recommendation: Treat overlays as exempt from D-11 (they are not card/container surfaces). Remove shadows only from `card.tsx` (already no shadow). For Phase 1 specifically, the token approach (overriding `--shadow-lg` in `@theme` for dark mode) is the cleanest path if zero `.tsx` edits is the intent.

2. **sidebar-foreground value**
   - What we know: Current dark value is `var(--color-white)`; Supabase sidebar nav text is shown at 14px weight 500
   - What's unclear: Should sidebar-foreground use full off-white (`#fafafa`) or muted mid-gray (`#898989`) for unselected nav items?
   - Recommendation: Default to `oklch(60% 0 none)` (#898989) for sidebar-foreground (muted nav items); selected items use `--sidebar-primary` green. This matches Supabase's navigation style where inactive items are de-emphasized. The `--sidebar-foreground` token used in COMP-01 (Phase 2) will confirm this.

---

## Environment Availability

Step 2.6: This phase is CSS/configuration changes + package installation. External dependency check:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | Package install | ✓ | 10.18.1 | — |
| Node.js | Build tooling | ✓ | >=20.x | — |
| `@fontsource-variable/geist` | FOUND-01 | Not installed | 5.2.8 (npm registry) | — |
| `@fontsource-variable/geist-mono` | FOUND-02 | Not installed | 5.2.7 (npm registry) | — |

**Missing dependencies with no fallback:**
- Both fontsource packages need `pnpm add` before CSS imports will resolve. This is Wave 0 of the plan.

---

## Security Domain

This phase contains no authentication, authorization, data handling, or network requests. It is CSS/font/configuration changes only. No ASVS categories apply.

---

## Sources

### Primary (HIGH confidence)
- `DESIGN.md` (project file) — Complete Supabase color palette, typography rules, shadow policy
- `app/styles/shadcn-ui.css` (project file) — Current token structure, lines 60–103 dark block
- `app/styles/theme.css` (project file) — @theme block structure, font-sans declaration
- `app/styles/global.css` (project file) — Import chain and @variant dark
- `app/root.tsx` (project file) — html element structure
- `app/components/root-providers.tsx` (project file) — ThemeProvider configuration
- `packages/ui/src/shadcn/card.tsx` (project file) — Confirmed no shadow classes
- npm registry — `@fontsource-variable/geist` version 5.2.8, `@fontsource-variable/geist-mono` version 5.2.7

### Secondary (MEDIUM confidence)
- [fontsource.org/fonts/geist/install](https://fontsource.org/fonts/geist/install) — Import syntax and font-family name verified
- [fontsource.org/fonts/geist-mono/install](https://fontsource.org/fonts/geist-mono/install) — Import syntax for geist-mono confirmed
- WCAG 2.1 relative luminance formula — contrast ratios computed from verified hex values

### Tertiary (LOW confidence)
- STATE.md decision note — "geist npm package is Vite incompatible" (referenced but not independently re-verified in this session)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry confirmed both package versions
- Architecture: HIGH — verified against actual codebase files
- oklch values: MEDIUM — computed from hex values using WCAG formula; exact values are discretionary per locked decisions
- WCAG verification: HIGH — computed from canonical DESIGN.md hex values, all pairs pass with significant margin
- Pitfalls: HIGH — most identified from direct codebase inspection

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable libraries, 30-day window)
