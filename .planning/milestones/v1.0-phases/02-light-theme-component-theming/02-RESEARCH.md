# Phase 02: Light Theme + Component Theming - Research

**Researched:** 2026-04-02
**Domain:** Tailwind CSS 4 token theming, Shadcn UI CVA, CSS color space, next-themes FOUC
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Light palette strategy
- **D-01:** Mirror Supabase Studio's dashboard light theme as the reference for all light palette values
- **D-02:** Light sidebar in light theme — matching Supabase Studio behavior (sidebar goes light in light mode, not permanently dark)
- **D-03:** Update DESIGN.md with complete light palette spec before touching any CSS — spec-first approach
- **D-04:** Use different green intensities per theme: lighter green in light mode, darker green in dark mode (matching Supabase's pattern)

#### Pill variants
- **D-05:** Add `variant: 'pill'` to Button CVA — new variant with 9999px radius and Supabase CTA styling, separate from existing variants
- **D-06:** Override default TabsList/TabsTrigger to pill shape globally — all tabs in the app get pill styling with rounded-full, no variant prop needed

#### Form & table styling
- **D-07:** Form inputs match Supabase Studio style — subtle border, no shadow, adjusted border/focus tokens in CSS with minimal component changes
- **D-08:** Data tables themed via token overrides + minimal class changes — border-defined rows, subtle hover states, no zebra striping
- **D-09:** Global removal of `shadow-xs` from all Shadcn component files (button, input, select, etc.) — consistent with border-depth system, no shadows except focus rings

### Claude's Discretion
- Exact green oklch values per theme (lighter for light mode, darker for dark mode) — research Supabase Studio and pick closest equivalents, document in DESIGN.md
- Nav weight-500 application method — Claude decides how to apply font-weight to sidebar nav links (Tailwind classes vs CSS utility)
- Toast/Sonner theming approach — token overrides to match palette
- Link color token definitions per DESIGN.md link hierarchy (green branded, primary light, secondary, muted)
- Exact light theme token values for all Shadcn semantic variables (--background, --foreground, --card, --muted, etc.)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-04 | All Shadcn semantic CSS tokens overridden with Supabase light palette in oklch format | Light palette values section; `:root` override pattern already established in dark theme |
| FOUND-05 | Light theme palette values defined in DESIGN.md | DESIGN.md spec-first workflow; wave 0 task |
| FOUND-10 | WCAG AA contrast verified for light theme (4.5:1 normal text, 3:1 large text) | WCAG AA verification section; oklch relative luminance calculation |
| FOUND-11 | No theme flicker (FOUC) on page load in both dark and light modes | next-themes + SSR pattern; `suppressHydrationWarning` already present from Phase 1 |
| COMP-01 | Sidebar themed with dark background, green accents, and weight-500 nav links | Sidebar token map; `SidebarMenuButton` CVA with `data-[active=true]:font-medium` already in place — needs weight upgrade |
| COMP-02 | Form inputs themed (text input, select, checkbox, radio, textarea) | Shadow-xs removal audit; `--input`, `--ring` token adjustments in `:root` |
| COMP-03 | Data tables themed (headers, rows, borders, hover states) | Table component analysis; token-driven theming pattern |
| COMP-04 | Pill button variant (9999px radius) added to Shadcn Button via CVA | Button CVA extension pattern; DESIGN.md pill spec |
| COMP-05 | Pill tab indicator added to Shadcn Tabs component | Tabs component class override; rounded-full pattern |
| COMP-06 | Cards and containers use border-defined edges with no visible shadows | Shadow null in `.dark`; needs equivalent in `:root` for light theme |
| COMP-07 | Links styled per Supabase palette (green branded, primary light, secondary, muted) | Link token strategy; `--supabase-green-link` already defined |
| COMP-08 | Toast notifications (Sonner) themed to match palette | Sonner classNames pattern in sonner.tsx already wired to semantic tokens |
</phase_requirements>

---

## Summary

Phase 2 has two interlocking workstreams: (1) completing the color system so the light theme is as thorough as the dark theme, and (2) applying component-level structural changes that are theme-agnostic but were deferred from Phase 1.

The CSS token architecture from Phase 1 is the foundation — the `:root` block in `shadcn-ui.css` already has the skeleton of light defaults but they are unthemed Shadcn stock values. The task is to replace those stock values with Supabase-quality light palette equivalents in oklch, exactly as was done for `.dark`. The pattern, tools, and file layout are fully established.

The component work (shadow-xs removal, pill variants, sidebar font weight) requires targeted `.tsx` edits. These are small but numerous: 14 component files carry `shadow-xs`. The pill button is a single CVA variant extension; pill tabs are 3 class changes in `tabs.tsx`. The sidebar already has `data-[active=true]:font-medium` wired in `SidebarMenuButton` — but "medium" in Tailwind defaults to 500, and the active state uses `bg-sidebar-accent`. In light mode, `--sidebar-accent` must be set to a clearly visible highlight color.

**Primary recommendation:** Execute in four sequential sub-tasks: (1) DESIGN.md light palette spec, (2) `:root` CSS token override, (3) shadow-xs removal + pill variants, (4) sidebar light-mode token wiring.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS 4 | 4.1.18 | CSS token system, utility classes | Already in use; phase is CSS-only |
| Shadcn UI (CVA) | current | Component variant system | Established pattern; pill variant follows existing CVA shape |
| next-themes | 0.4.6 | Theme toggling, FOUC prevention | Already wired; no changes needed to infrastructure |
| class-variance-authority | 0.7.1 | Button/sidebar CVA definitions | Already in use in button.tsx and sidebar.tsx |

[VERIFIED: codebase grep — all packages confirmed present in packages/ui/package.json and app]

### No New Libraries Required

This phase is purely CSS tokens + minimal component class changes. No new packages to install. [VERIFIED: CONTEXT.md constraint "no new UI libraries"]

---

## Architecture Patterns

### Three-Layer CSS Architecture (Established)

```
global.css          → @import order, font loads, @layer base shadow resets
  └─ shadcn-ui.css  → :root (light tokens), .dark (dark tokens) — ALL palette values here
       └─ theme.css → @theme { --color-*: var(--*) } — bridges tokens to Tailwind utilities
```

Components consume via Tailwind semantic classes (`bg-background`, `text-muted-foreground`, etc.) — no direct CSS variable usage in TSX except the sidebar outline variant which uses an `hsl()` wrapper (known anomaly).

[VERIFIED: direct file read of global.css, theme.css, shadcn-ui.css]

### Light Palette Override Pattern

The `:root` block in `shadcn-ui.css` (lines 10–76) already exists. The pattern mirrors exactly what was done in `.dark` (lines 78–121):

```css
/* Current `:root` — stock Shadcn values, needs replacement */
--background: var(--color-white);          /* → oklch(99% 0 none) equivalent */
--foreground: var(--color-neutral-950);    /* → Supabase light fg */
--border: var(--color-gray-100);           /* → Supabase light border */
--input: var(--color-gray-200);            /* → slightly darker input border */
--ring: var(--color-neutral-800);          /* → green focus ring in light mode */
/* ... all semantic tokens */
```

All replacements go in `:root`. No new CSS files needed. [VERIFIED: direct file read]

### Shadow Removal — Light Theme Gap

Phase 1 established shadow removal only for `.dark`:

```css
/* global.css lines 49-56 — dark only */
.dark {
  --shadow: none;
  --shadow-sm: none;
  --shadow-md: none;
  /* ... */
}
```

The light theme has NO equivalent override. In light mode, `shadow-xs` on components renders a visible box-shadow because Tailwind's default `--shadow-xs` is `0 1px 2px 0 rgb(0 0 0 / 0.05)`. Per D-09, shadow-xs must be removed from component files (the TSX `shadow-xs` class strings), AND the `:root` shadow token override should also be added for defense in depth.

**Two-pronged approach:**
1. Add shadow nullification to `:root` in `global.css` (same block style as `.dark`)
2. Remove `shadow-xs` from component tsx files (belt-and-suspenders; handles any classes added by callers)

[VERIFIED: global.css read; grep confirmed 14 shadow-xs occurrences across shadcn components]

### CVA Pill Variant Pattern

`button.tsx` already uses CVA with 6 variants. The pill variant is an additive change:

```typescript
// Source: packages/ui/src/shadcn/button.tsx — existing CVA structure
variant: {
  // existing variants...
  pill: 'rounded-full bg-primary text-primary-foreground border border-primary-foreground/20 px-8 py-2 font-medium hover:bg-primary/90',
}
```

The pill button per DESIGN.md S4:
- Radius: `rounded-full` (9999px)
- Padding: `px-8 py-2` (matches "8px 32px")
- Border: 1px matching theme (white border on dark primary, subtle border on light)
- Font: `font-medium` (weight 500)
- Background: `bg-primary` (near-black in dark, near-white in light — or use `--sb-near-black` token directly)

[VERIFIED: button.tsx read; DESIGN.md S4 read]

### Pill Tabs Pattern

`tabs.tsx` TabsList uses `rounded-md` and TabsTrigger uses `shadow-xs`. Per D-06, global pill override:

```typescript
// TabsList: rounded-md → rounded-full
'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-full p-1'

// TabsTrigger: remove shadow-xs, add rounded-full, green active state
'... rounded-full data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground ...'
```

The active tab should use the green accent token. In dark mode `--sidebar-primary` is already the Supabase green. For light mode, `--sidebar-primary` will need to be set to the lighter green in `:root`.

[VERIFIED: tabs.tsx read; shadcn-ui.css read]

---

## Light Palette Token Derivation

### Supabase Studio Light Theme Reference

Supabase Studio's light dashboard uses a light-gray canvas with dark text and green accents. Based on DESIGN.md and Supabase's public design tokens, the light palette maps as follows. These values are derived from the established dark palette as equivalents — they must be confirmed in DESIGN.md (D-03) before CSS implementation:

[ASSUMED] Supabase light theme uses near-white backgrounds (~`#fafafa`, `#ffffff`), dark foreground (~`#171717`), medium-gray borders (~`#e2e2e2`), and lighter green accent.

Recommended light palette in oklch (for DESIGN.md and then `:root`):

| Token | Target Value | DESIGN.md Dark Equivalent | Notes |
|-------|-------------|--------------------------|-------|
| `--background` | `oklch(99% 0 none)` | `oklch(12.55% 0 none)` | Near-white canvas |
| `--foreground` | `oklch(12% 0 none)` | `oklch(98.04% 0 none)` | Near-black text |
| `--card` | `oklch(100% 0 none)` | `oklch(12.55% 0 none)` | Pure white cards |
| `--card-foreground` | `oklch(12% 0 none)` | `oklch(98.04% 0 none)` | Same as foreground |
| `--popover` | `oklch(100% 0 none)` | `oklch(12.55% 0 none)` | Pure white |
| `--popover-foreground` | `oklch(12% 0 none)` | `oklch(98.04% 0 none)` | |
| `--primary` | `oklch(12% 0 none)` | `oklch(98.04% 0 none)` | Near-black CTA |
| `--primary-foreground` | `oklch(99% 0 none)` | `oklch(12.55% 0 none)` | White text on primary |
| `--secondary` | `oklch(96% 0 none)` | `oklch(23.53% 0 none)` | Light gray secondary |
| `--secondary-foreground` | `oklch(12% 0 none)` | `oklch(98.04% 0 none)` | |
| `--muted` | `oklch(96% 0 none)` | `oklch(23.53% 0 none)` | |
| `--muted-foreground` | `oklch(45% 0 none)` | `oklch(60% 0 none)` | Medium gray |
| `--accent` | `oklch(96% 0 none)` | `oklch(23.53% 0 none)` | |
| `--accent-foreground` | `oklch(12% 0 none)` | `oklch(98.04% 0 none)` | |
| `--border` | `oklch(89% 0 none)` | `oklch(23.53% 0 none)` | Light gray border |
| `--input` | `oklch(85% 0 none)` | `oklch(27.45% 0 none)` | Slightly darker input border |
| `--ring` | `oklch(68% 0.165 160)` | `oklch(73.5% 0.158 162)` | Lighter green focus ring |

**Light green accent (D-04):** The lighter green for light mode should be a darker chroma/saturation level than the dark-mode green to maintain contrast on white — counter-intuitively the dark mode uses a lighter green (high L in oklch) while the light mode needs a green with enough contrast on white. Recommended: `oklch(47% 0.165 160)` for `--supabase-green` in light theme context (≈ `#1d9e65` equivalent). The `--ring` can use a perceptually lighter `oklch(60% 0.165 160)`.

[ASSUMED] — exact oklch values require visual validation against Supabase Studio. Values above are strong approximations based on Supabase's known hex palette (`#3ecf8e`, `#1d9e65`) converted to oklch.

### Sidebar Light Theme Tokens

Per D-02, the sidebar goes light in light mode. The `--sidebar-*` tokens in `:root` need to be set for a light sidebar:

| Token | Recommended Value | Notes |
|-------|-----------------|-------|
| `--sidebar-background` | `oklch(99% 0 none)` | Near-white, matches page bg |
| `--sidebar-foreground` | `oklch(35% 0 none)` | Dark-gray nav text |
| `--sidebar-primary` | `oklch(47% 0.165 160)` | Darker green for light mode active |
| `--sidebar-primary-foreground` | `oklch(99% 0 none)` | White text on green |
| `--sidebar-accent` | `oklch(95% 0.01 160)` | Very subtle green wash for hover/active bg |
| `--sidebar-accent-foreground` | `oklch(30% 0 none)` | Dark text |
| `--sidebar-border` | `oklch(89% 0 none)` | Light border |
| `--sidebar-ring` | `oklch(47% 0.165 160)` | Green focus ring |

[ASSUMED] — sidebar token values need visual validation

---

## Component Change Map

### Complete shadow-xs Removal Target

All 14 occurrences verified via grep:

| File | Count | Nature |
|------|-------|--------|
| `button.tsx` | 4 | 4 variants (default, destructive, outline, secondary) |
| `input.tsx` | 1 | Base input class |
| `textarea.tsx` | 1 | Base textarea class |
| `select.tsx` | 2 | SelectTrigger + SelectItem |
| `checkbox.tsx` | 1 | Root element |
| `tabs.tsx` | 1 | TabsTrigger (active state also has `shadow-sm`) |
| `badge.tsx` | 2 | default + destructive variants |
| `switch.tsx` | 1 | Track element |
| `input-otp.tsx` | 1 | OTP cell |
| `navigation-menu.tsx` | 1 | Viewport |
| `command.tsx` | 1 | CommandItem |
| `button-group.tsx` | 1 | Container |
| `calendar.tsx` | 1 | Root element |
| `input-group.tsx` | 1 | Wrapper |

[VERIFIED: grep on packages/ui/src/shadcn]

**Constraint:** Per CONTEXT.md "Component API: No breaking changes to component props or usage patterns." Shadow removal is safe — it only removes a visual artifact; no prop signatures change.

### Sidebar Nav Weight-500

`SidebarMenuButton` in `sidebar.tsx` CVA base already includes `data-[active=true]:font-medium`. In Tailwind CSS 4, `font-medium` = `font-weight: 500`. This is correct per DESIGN.md typography rules (Nav Link: weight 500).

However, `data-[active=true]:font-medium` only applies to the active item. Non-active nav links are weight 400 (default). This is correct behavior — only active nav link gets 500, consistent with Supabase's pattern.

The `SidebarGroupLabel` (module headers in collapsible) uses default Tailwind styles. These may need to be weight-500 as well since they act as nav category headers. [ASSUMED] — confirm whether group labels should also be weight-500.

**Application method (Claude's discretion):** The CVA in `sidebar.tsx` is the right place — no separate CSS utility needed. The existing `data-[active=true]:font-medium` pattern is correct.

[VERIFIED: sidebar.tsx read, lines 534-554]

### Toast / Sonner Theming

`sonner.tsx` already wires to semantic tokens via `classNames`:

```typescript
toast: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg'
```

The `shadow-lg` on toast is intentional (per DESIGN.md: "Focus states use `rgba(0, 0, 0, 0.1) 0px 4px 12px` — minimal, functional") — toasts are elevated UI elements. However, in light mode this shadow will be visible. The shadow should remain but will be subtle with the light palette's lower contrast.

The semantic tokens (`--background`, `--foreground`, `--border`) will automatically update when the light palette is applied — no changes to `sonner.tsx` required beyond ensuring the semantic tokens are correctly set. [VERIFIED: sonner.tsx read]

### Card Shadow Removal (COMP-06)

`card.tsx` currently has no `shadow-xs` — it uses only `bg-card text-card-foreground rounded-lg border`. This is already correct (border-defined, no shadow). [VERIFIED: card.tsx read]

The `:root` shadow nullification (extending the `.dark` pattern to also apply in `:root`) is still recommended for defense — any component added later will inherit no-shadow behavior.

### Links (COMP-07)

`--supabase-green-link: oklch(71.2% 0.184 160)` is already defined in `:root` and is theme-agnostic. Per D-04, the light mode green should be darker — the link token may need a light-mode override.

Strategy: Add a `.dark` override for link token if the light value differs, or define a new `--link-color` semantic token wired to the green at appropriate intensity per theme. The simplest approach (Claude's discretion): apply link colors via a `@layer base a { color: var(--supabase-green-link) }` or define a utility class `text-link` mapping to the token.

---

## Architecture Patterns

### Recommended Task Sequence

```
Wave 0: Spec
  └─ Update DESIGN.md with complete light palette section

Wave 1: CSS Tokens (no component changes)
  ├─ Override :root in shadcn-ui.css with Supabase light palette
  ├─ Override :root sidebar-* tokens for light sidebar (D-02)
  └─ Add :root shadow nullification to global.css

Wave 2: Component Changes
  ├─ Remove shadow-xs from all 14 component files
  ├─ Add pill variant to button.tsx CVA (D-05)
  └─ Override TabsList/TabsTrigger to pill shape (D-06)

Wave 3: Verification
  ├─ WCAG AA contrast check for light palette (FOUND-10)
  └─ Toggle test: dark → light → system (FOUND-11)
```

### Anti-Patterns to Avoid

- **Hardcoded colors in TSX:** Never use hex/oklch values directly in component class strings — only semantic Tailwind classes (`bg-background`, etc.) or CSS variable references
- **Adding `.light` class variants:** Don't create a `.light` CSS class to mirror `.dark` — Tailwind's dark variant is the only mechanism; `:root` is the light state
- **Conditional className logic for themes:** Don't add `dark:` prefixes to override palette values in components — palette values are set exclusively via `:root`/`.dark` tokens
- **Breaking TabsList API:** The pill shape override changes classes in the component default; callers passing `className` will still be able to override. But don't add a new prop — D-06 says global override, no variant prop needed
- **Overriding `--shadow-xs` token globally to `none`:** While tempting, this would break focus-ring behavior since `focus-visible:ring-1` uses `--ring`, not `--shadow-*`. Only override explicit `--shadow` Tailwind tokens

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG contrast checking | Manual ratio calculations | Browser DevTools accessibility checker or online oklch contrast tools | Error-prone by hand for oklch values |
| Pill shape | Custom CSS class | Tailwind `rounded-full` utility | Already in Tailwind, applies `border-radius: 9999px` |
| Font weight 500 | Custom CSS utility | Tailwind `font-medium` | Already standard; CVA already uses it |
| Theme-scoped tokens | Separate CSS files per theme | `:root` / `.dark` in one file | Established pattern; splitting adds complexity |

**Key insight:** This phase is almost entirely token substitution in one CSS file plus targeted class string edits in tsx files. There is no algorithmic complexity — the risk is scope (14 files, correct values) not technique.

---

## Common Pitfalls

### Pitfall 1: Light Mode Shadows Still Visible

**What goes wrong:** Dark theme shadow-nullification lives in `.dark { --shadow: none; ... }`. The light theme (`:root`) has no equivalent override. After Phase 1, all components still render shadow-xs in light mode.

**Why it happens:** Phase 1 only targeted dark theme; light theme shadow removal was deferred to Phase 2.

**How to avoid:** Add identical shadow nullification to `:root` in `global.css`:
```css
:root {
  --shadow: none;
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-xl: none;
  --shadow-2xl: none;
}
```
AND remove `shadow-xs` from component tsx files per D-09.

**Warning signs:** Opening app in light mode and seeing subtle box-shadows on buttons, inputs, or cards.

### Pitfall 2: Green Focus Ring Too Dark on Light Backgrounds

**What goes wrong:** The dark mode uses `--ring: oklch(73.5% 0.158 162)` (a bright green). In light mode, the same high-lightness green may be too light for WCAG-compliant focus visibility on white backgrounds.

**Why it happens:** Focus ring contrast requirement is different from text contrast — the ring must be 3:1 against both the surrounding background AND the element's own background.

**How to avoid:** Use a darker green for `--ring` in `:root`, approximately `oklch(47% 0.165 160)` (darker, more saturated green). Test focus rings on white backgrounds.

**Warning signs:** Focus ring passes WCAG AA for text but fails for UI component (3:1) criterion.

### Pitfall 3: Sidebar Accent Not Visible on Light Background

**What goes wrong:** `--sidebar-accent` in dark mode is `oklch(23.53% 0 none)` (dark gray on dark background = visible contrast). In light mode with a near-white sidebar, `--sidebar-accent` must be a noticeable lighter-gray/green-tinted surface — if left as the dark value, the active nav item will appear nearly black.

**Why it happens:** `SidebarMenuButton` uses `data-[active=true]:bg-sidebar-accent` — the background token needs inversion for the light sidebar.

**How to avoid:** Set `--sidebar-accent` in `:root` to a very subtle green wash (`oklch(95% 0.01 160)`) that reads as the "selected" state against a near-white sidebar background.

**Warning signs:** Active nav items appear as black rectangles in light mode.

### Pitfall 4: Tabs Active State Uses Wrong Token

**What goes wrong:** The current `TabsTrigger` uses `data-[state=active]:bg-background`. For pill tabs, the active tab should stand out — but `bg-background` in light mode is near-white, nearly identical to the `bg-muted` TabsList background.

**Why it happens:** Stock Shadcn tabs are designed for a light/dark surface swap, not green active states.

**How to avoid:** Change `data-[state=active]:bg-background` to `data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground` — using the green token directly. This makes the active pill green.

**Warning signs:** Pill tabs render in light mode with an active tab that is invisible or barely distinguishable from the inactive tabs.

### Pitfall 5: oklch Values Shift on Different Displays

**What goes wrong:** oklch colors in P3 gamut look different on wide-gamut displays vs sRGB. Very high chroma greens (C > 0.2) may be outside sRGB gamut on some older displays.

**Why it happens:** oklch natively works in perceptual color space; browsers clamp to sRGB if the display doesn't support P3.

**How to avoid:** Keep chroma values below 0.20 for all greens (existing values are already safe: C 0.158–0.184). Test on standard sRGB display as the baseline. [VERIFIED: existing green tokens in shadcn-ui.css are C 0.158–0.184, within sRGB gamut]

### Pitfall 6: FOUC on System Theme with SSR

**What goes wrong:** User has system theme set to light. On SSR, next-themes renders without theme class, then client JS adds/removes `.dark`. This causes a flash.

**Why it happens:** `suppressHydrationWarning` was added in Phase 1 but only suppresses React's hydration mismatch warning — it does not prevent the visual flash if the server-rendered HTML and client-resolved theme differ.

**How to avoid:** next-themes handles this via a script tag injected in `<head>` that sets the class before first paint. This is built-in behavior — no additional changes needed as long as `ThemeProvider` is correctly configured. [VERIFIED: Phase 1 already completed this; FOUND-06 is marked complete]

**Warning signs:** Flash of unstyled/light content before dark theme applies on page load in dark system preference.

---

## Code Examples

### Light Palette `:root` Override Structure

```css
/* Source: app/styles/shadcn-ui.css — mirroring .dark pattern */
@layer base {
  :root {
    /* ... font tokens preserved ... */

    /* Supabase light palette */
    --background: oklch(99% 0 none);
    --foreground: oklch(12% 0 none);

    --card: oklch(100% 0 none);
    --card-foreground: oklch(12% 0 none);

    --popover: oklch(100% 0 none);
    --popover-foreground: oklch(12% 0 none);

    --primary: oklch(12% 0 none);
    --primary-foreground: oklch(99% 0 none);

    --secondary: oklch(96% 0 none);
    --secondary-foreground: oklch(12% 0 none);

    --muted: oklch(96% 0 none);
    --muted-foreground: oklch(45% 0 none);

    --accent: oklch(96% 0 none);
    --accent-foreground: oklch(12% 0 none);

    --destructive: var(--color-red-600);
    --destructive-foreground: var(--color-white);

    --border: oklch(89% 0 none);
    --input: oklch(85% 0 none);
    --ring: oklch(47% 0.165 160);

    /* Light sidebar tokens */
    --sidebar-background: oklch(99% 0 none);
    --sidebar-foreground: oklch(35% 0 none);
    --sidebar-primary: oklch(47% 0.165 160);
    --sidebar-primary-foreground: oklch(99% 0 none);
    --sidebar-accent: oklch(95% 0.01 160);
    --sidebar-accent-foreground: oklch(30% 0 none);
    --sidebar-border: oklch(89% 0 none);
    --sidebar-ring: oklch(47% 0.165 160);
  }
}
```

### Pill Button CVA Addition

```typescript
// Source: packages/ui/src/shadcn/button.tsx — extend variants.variant
variant: {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  // ... other existing variants without shadow-xs ...
  pill: 'rounded-full bg-primary text-primary-foreground border border-primary-foreground/20 px-8 font-medium hover:bg-primary/90',
},
```

### Pill Tabs Override

```typescript
// Source: packages/ui/src/shadcn/tabs.tsx

// TabsList: rounded-md → rounded-full
className={cn(
  'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-full p-1',
  className,
)}

// TabsTrigger: remove shadow-xs, add rounded-full, green active
className={cn(
  'ring-offset-background focus-visible:ring-ring data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  className,
)}
```

### Shadow Nullification in `:root`

```css
/* Source: app/styles/global.css — extend @layer base */
@layer base {
  :root {
    --shadow: none;
    --shadow-sm: none;
    --shadow-md: none;
    --shadow-lg: none;
    --shadow-xl: none;
    --shadow-2xl: none;
  }
  /* .dark block already present */
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL color tokens | oklch color tokens | Tailwind CSS 4 (2024) | oklch is perceptually uniform; use throughout |
| Box-shadow depth | Border-contrast depth | Phase 1 established | No shadows on surfaces; borders define elevation |
| `rounded-full` via one-off classes | CVA variant `pill` | This phase | Consistent pill button without per-usage class juggling |

**Deprecated/outdated:**
- `shadow-xs` on form inputs: Remove in this phase — Supabase Studio does not use shadows on inputs
- `rounded-md` on TabsList/TabsTrigger: Replace with `rounded-full` globally per D-06
- Stock Shadcn `:root` values (`var(--color-white)`, `var(--color-gray-100)`, etc.): Replace with explicit oklch values matching Supabase light palette

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Exact light palette oklch values (--background: oklch(99% 0 none), --border: oklch(89% 0 none), etc.) | Light Palette Token Derivation | Wrong visual values; requires iteration. Low execution risk — values are easily adjusted in one file |
| A2 | --sidebar-accent in light mode should be `oklch(95% 0.01 160)` (subtle green wash) | Sidebar Light Theme Tokens | Active nav items may not be visible enough; adjust to plain gray if green wash is too strong |
| A3 | Darker green `oklch(47% 0.165 160)` is correct for light-mode green accents | Light Palette Token Derivation | May fail WCAG AA (3:1 on white); test and adjust |
| A4 | SidebarGroupLabel (module headers) should remain weight-400 | Component Change Map — Nav Weight | If headers should be weight-500, add `font-medium` to SidebarGroupLabel class |
| A5 | Toast `shadow-lg` should be preserved on light theme | Toast / Sonner Theming | If client disagrees, remove shadow-lg from sonner.tsx classNames; currently no explicit decision |

---

## Open Questions

1. **Light-mode Supabase green exact value**
   - What we know: Dark mode uses `oklch(73.5% 0.158 162)` (≈ `#3ecf8e`); Supabase Studio uses a darker green in light mode
   - What's unclear: The exact L value for the light-mode green — could be anywhere from oklch(40%–55% ...) depending on WCAG target
   - Recommendation: Set `oklch(47% 0.165 160)` as initial value; verify 4.5:1 contrast ratio against white background before merging

2. **Sidebar light mode — same bg as page or slightly differentiated?**
   - What we know: D-02 says "light sidebar in light mode"; Supabase Studio's light sidebar has a very subtle off-white differentiation from the main canvas
   - What's unclear: Should `--sidebar-background` be `oklch(99% 0 none)` (same as page) or `oklch(97% 0 none)` (barely-visible separator effect)?
   - Recommendation: Use `oklch(97% 0 none)` for a barely-visible differentiation matching Supabase Studio behavior

3. **Link styling mechanism**
   - What we know: `--supabase-green-link` token exists; no `a { color: ... }` global rule exists
   - What's unclear: Apply globally via `@layer base a { }` or require explicit `text-link` utility class?
   - Recommendation: Global base rule is appropriate for an ERP where most links should be branded; reduces per-component effort

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely CSS token overrides and TSX class string edits. No external tools, services, or CLI utilities beyond the project's own build system are required.

---

## Validation Architecture

`nyquist_validation: false` in `.planning/config.json` — this section is SKIPPED per configuration.

---

## Security Domain

`security_enforcement` is not set in `.planning/config.json`. However, this phase is entirely CSS variables and component class strings — no data handling, no auth, no user input processing. ASVS categories V2/V3/V4/V6 do not apply. V5 (Input Validation) does not apply. No security domain concerns for a pure theming phase.

---

## Project Constraints (from CLAUDE.md)

Directives the planner must verify compliance with:

| Directive | Impact on This Phase |
|-----------|---------------------|
| No new UI libraries | Confirmed — zero new packages; CSS + tsx only |
| Tailwind CSS 4 + Shadcn UI only | Confirmed — all changes use existing system |
| No `any` TypeScript | Not applicable — no new TypeScript logic |
| `useEffect` is a code smell | Not applicable — CSS phase |
| Prefer implicit type inference | Not applicable |
| Run `pnpm typecheck` after changes | Required after tsx file edits (shadow-xs removal, CVA additions) |
| Run `pnpm lint:fix` and `pnpm format:fix` after task | Required after each tsx file batch |
| kebab-case filenames | Not applicable — no new files |
| `font-medium` = weight 500 for nav/buttons only | CVA pill variant must use `font-medium`; base button variants should not add it |
| WCAG AA contrast in both themes | FOUND-10: must be verified before phase complete |
| Preserve next-themes infrastructure | Confirmed — no changes to ThemeProvider or toggle mechanism |
| No breaking changes to component props or usage patterns | Shadow removal and class string changes are non-breaking; no prop API changes |

---

## Sources

### Primary (HIGH confidence)
- Direct file reads: `app/styles/shadcn-ui.css`, `app/styles/global.css`, `app/styles/theme.css` — verified current state of CSS token system
- Direct file reads: `packages/ui/src/shadcn/button.tsx`, `tabs.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `sonner.tsx`, `card.tsx`, `table.tsx`, `radio-group.tsx`, `sidebar.tsx` — verified all component classes
- Direct file read: `app/components/sidebar/workspace-sidebar.tsx`, `module-sidebar-navigation.tsx` — verified sidebar structure
- `.planning/phases/02-light-theme-component-theming/02-CONTEXT.md` — locked decisions
- `.planning/REQUIREMENTS.md` — acceptance criteria
- `DESIGN.md` — visual specification
- Grep: `shadow-xs` in shadcn components — verified 14 occurrences and their files

### Secondary (MEDIUM confidence)
- Phase 1 CONTEXT.md and established dark theme patterns — informs light theme approach
- Tailwind CSS 4 documentation [ASSUMED: oklch support, shadow token naming `--shadow-xs`] — core behavior verified via existing code

### Tertiary (LOW confidence)
- Supabase Studio light theme exact values — inferred from dark palette inversions and Supabase's known design system; must be confirmed visually before DESIGN.md spec is finalized [A1, A2, A3]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; established codebase
- Architecture: HIGH — three-layer CSS system fully verified; patterns established in Phase 1
- Light palette values: LOW — exact oklch values are approximations; need visual validation against Supabase Studio
- Component changes: HIGH — all files verified; shadow-xs locations confirmed by grep; CVA pattern confirmed
- Pitfalls: HIGH — all identified from direct code inspection

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable CSS/Tailwind stack; 30-day window)
