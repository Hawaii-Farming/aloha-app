# Architecture Research

**Domain:** Design system theming — Shadcn UI + Tailwind CSS 4, Supabase-inspired dark/light theme
**Researched:** 2026-04-02
**Confidence:** HIGH (verified against official Shadcn docs, Tailwind v4 docs, and existing codebase)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RUNTIME: Browser + SSR                           │
│                                                                         │
│  next-themes ThemeProvider → applies .dark class to <html>              │
│  root.tsx loader → reads theme cookie → sends className to <html>       │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        LAYER 4: Component Tokens                        │
│                                                                         │
│  packages/ui/src/shadcn/button.tsx   (adds `pill` variant)              │
│  packages/ui/src/shadcn/tabs.tsx     (pill shape overrides)             │
│  packages/ui/src/shadcn/*.tsx        (component-level class adjustments)│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        LAYER 3: Tailwind Theme Bridge                   │
│                                                                         │
│  app/styles/theme.css                                                   │
│  @theme { --color-background: var(--background); ... }                  │
│  Maps semantic vars → Tailwind utilities (bg-background, text-primary)  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        LAYER 2: Semantic Design Tokens                  │
│                                                                         │
│  app/styles/shadcn-ui.css                                               │
│  :root { --background: ...; --primary: ...; }  ← light theme           │
│  .dark { --background: ...; --primary: ...; }  ← dark theme            │
│                                                                         │
│  Shadcn tokens: background, foreground, card, popover, primary,        │
│  secondary, muted, accent, destructive, border, input, ring,           │
│  sidebar-*, chart-1..5, radius                                          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        LAYER 1: Primitive Color Tokens                  │
│                                                                         │
│  app/styles/shadcn-ui.css (added section)                               │
│  :root {                                                                │
│    --supabase-green: #3ecf8e;                                           │
│    --supabase-green-link: #00c573;                                      │
│    --supabase-green-border: rgba(62, 207, 142, 0.3);                    │
│    --surface-dark: #171717;                                             │
│    --border-dark: #2e2e2e; ...                                          │
│  }                                                                      │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        LAYER 0: Font + Base Reset                       │
│                                                                         │
│  app/styles/global.css                                                  │
│  @import '@fontsource-variable/geist/wght.css';                         │
│  @import '@fontsource-variable/geist-mono/wght.css';                    │
│  app/styles/shadcn-ui.css: --font-sans: 'Geist Variable', ...          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `shadcn-ui.css` | Semantic token values for both `:root` (light) and `.dark` | `app/styles/shadcn-ui.css` |
| `theme.css` | `@theme` bridge: maps `--background` → `--color-background` for Tailwind utility classes | `app/styles/theme.css` |
| `global.css` | Import order and `@variant dark` declaration; font imports | `app/styles/global.css` |
| `kit.css` | App-level structural styles (sidebar gradient, Radix popper fixes) | `app/styles/kit.css` |
| `button.tsx` | CVA variant definition — add `pill` variant with `rounded-full` | `packages/ui/src/shadcn/button.tsx` |
| `root.tsx` / `root-providers.tsx` | SSR theme cookie read + ThemeProvider; no changes needed | existing |

## Recommended Project Structure

```
app/styles/
├── global.css              # Import hub (font imports added here)
├── shadcn-ui.css           # ALL token values: primitives + semantic + dark overrides
├── theme.css               # @theme bridge for Tailwind (already correct structure)
├── theme.utilities.css     # Custom @utility definitions (container, etc.)
└── kit.css                 # Structural/Radix overrides

packages/ui/src/shadcn/
├── button.tsx              # Add `pill` variant via CVA
└── tabs.tsx                # Optionally: pill shape override
```

### Structure Rationale

- **shadcn-ui.css as the single source of truth:** All token values — primitive Supabase color palette, semantic Shadcn variables, and dark overrides — live in one file. This mirrors the official Shadcn pattern and makes it trivial to inspect the full design system.
- **theme.css unchanged (mostly):** The `@theme {}` bridge block already maps `var(--background)` → `--color-background`. This file needs a font variable addition only, not restructuring.
- **global.css as import hub:** Font `@import` statements belong here alongside `@import 'tailwindcss'` — this is the Tailwind v4 CSS-first convention.
- **No new CSS files:** Adding files increases cognitive load. The existing four-file structure is sufficient for the full theme.

## Architectural Patterns

### Pattern 1: Two-Layer Token System (Primitives → Semantics)

**What:** Define raw Supabase brand colors as primitive tokens (`--supabase-green: #3ecf8e`), then reference them in semantic tokens (`--accent: var(--supabase-green)`). Never use raw hex values in semantic tokens.

**When to use:** Always. This is the correct pattern for design tokens.

**Trade-offs:** Adds one level of indirection. Pays off when primitive values need to change globally (e.g., if green shifts to `#40d493` — only one line changes).

**Example:**
```css
/* Layer 1: Primitives in :root (always visible, never theme-conditional) */
:root {
  --supabase-green: #3ecf8e;
  --supabase-green-link: #00c573;
  --supabase-green-border: rgba(62, 207, 142, 0.3);
  --surface-base: #171717;
  --surface-deep: #0f0f0f;
  --border-subtle: #2e2e2e;
  --border-standard: #363636;
  --border-prominent: #393939;
  --text-primary: #fafafa;
  --text-secondary: #b4b4b4;
  --text-muted: #898989;
}

/* Layer 2: Semantics reference primitives */
:root {
  --primary: var(--supabase-green);
  --accent: var(--supabase-green);
  --border: var(--border-subtle);
}

.dark {
  --background: var(--surface-base);
  --foreground: var(--text-primary);
  --border: var(--border-subtle);
  --primary: var(--supabase-green);
}
```

### Pattern 2: Tailwind v4 @theme Inline Bridge

**What:** Tailwind CSS 4 uses a CSS-first config. The `@theme {}` block in `theme.css` bridges raw CSS variables to Tailwind utility classes. The existing bridge in `theme.css` is already correct — it maps `var(--background)` → `--color-background`, enabling `bg-background` utilities.

**When to use:** This pattern already exists and should not be changed. Adding new custom Tailwind utilities for Supabase-specific colors follows the same pattern.

**Trade-offs:** Adds `--color-` prefixed aliases for every token. This is required — Tailwind v4 reads `--color-*` variables to generate utilities.

**Example:**
```css
/* theme.css — extend the existing @theme block */
@theme {
  /* existing mappings ... */

  /* Add Supabase brand colors as Tailwind utilities */
  --color-supabase-green: var(--supabase-green);
  --color-supabase-green-link: var(--supabase-green-link);

  /* Font swap */
  --font-sans: 'Geist Variable', Helvetica Neue, Helvetica, Arial, sans-serif;
  --font-mono: 'Geist Mono Variable', Source Code Pro, Menlo, monospace;
}
```

### Pattern 3: CVA Variant Extension for Pill Buttons

**What:** Add a `pill` variant to the Shadcn Button component's CVA definition. This is a non-breaking addition — existing `variant` and `size` props are unchanged, and callers opt into `pill` explicitly.

**When to use:** Any CTA that should be pill-shaped. In Supabase design: primary and secondary CTAs.

**Trade-offs:** Modifying `packages/ui/src/shadcn/button.tsx` directly (Shadcn's "own your components" philosophy). The component is already owned — there's no upstream sync concern.

**Example:**
```tsx
// packages/ui/src/shadcn/button.tsx — extend buttonVariants CVA
const buttonVariants = cva(
  'inline-flex items-center justify-center ...',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground ...',
        // ... existing variants ...
        pill: 'bg-primary text-primary-foreground rounded-full px-8 py-2 border border-foreground font-medium',
        'pill-ghost': 'bg-primary text-primary-foreground rounded-full px-8 py-2 border border-border/40 opacity-80',
      },
      // ... existing size variants ...
    },
  }
);
```

### Pattern 4: SSR-Safe Dark Mode via Cookie (Already Implemented)

**What:** The existing app already handles SSR-safe theming correctly. `root.tsx` reads the theme cookie server-side, applies the `dark` class to `<html>` before streaming, and `next-themes` `ThemeProvider` with `attribute="class"` takes over on the client. No changes needed to this flow.

**When to use:** No action required — this is already correct.

**Trade-offs:** The cookie-based approach eliminates hydration mismatch. The existing implementation uses `themeCookie.parse()` in the loader and applies via `cn('...', { dark })` on the `<html>` element.

**Data flow (existing, no changes needed):**
```
Request → root.tsx loader → reads theme cookie
       → applies className="dark" to <html>
       → server streams HTML with correct class
       → ThemeProvider hydrates on client
       → user can toggle via mode-toggle component
```

## Data Flow

### Theme Resolution Flow

```
Browser Request
    ↓
root.tsx loader (server)
    ↓
themeCookie.parse(request) → 'dark' | 'light' | 'system'
    ↓
getClassName(theme) → cn('bg-background ...', { dark: theme === 'dark' })
    ↓
<html className="dark bg-background ...">
    ↓
CSS: .dark { --background: #171717; ... }
    ↓
Tailwind: bg-background → background-color: var(--background) → #171717
    ↓
ThemeProvider hydrates → next-themes handles client-side toggle
```

### Token Resolution Flow

```
Component: <Button className="bg-primary">
    ↓
Tailwind resolves: bg-primary → background-color: var(--color-primary)
    ↓
theme.css @theme: --color-primary: var(--primary)
    ↓
shadcn-ui.css: .dark { --primary: var(--supabase-green) }
              :root { --primary: var(--supabase-green) }
    ↓
shadcn-ui.css primitive: --supabase-green: #3ecf8e
    ↓
Rendered: background-color: #3ecf8e
```

### Font Loading Flow

```
global.css: @import '@fontsource-variable/geist/wght.css'
    ↓
Browser loads WOFF2 from /node_modules asset (Vite serves)
    ↓
shadcn-ui.css: :root { --font-sans: 'Geist Variable', ... }
    ↓
theme.css @theme: --font-sans: var(--font-sans) → (already mapped)
    ↓
global.css @layer base: body { font-family: theme(--font-sans) }
    ↓
All app text: Geist Variable
```

## Scaling Considerations

This is a pure CSS/visual layer project with no scalability concerns in the traditional sense. The relevant scaling dimension is design system maintainability:

| Concern | Approach |
|---------|----------|
| Adding a new theme color | Define primitive in `:root`, reference in semantic token — one place |
| Updating a component's themed style | Modify the semantic token — propagates everywhere |
| Supporting a third theme (e.g., "farm" high-contrast) | Add `.farm {}` selector block in `shadcn-ui.css`, extend ThemeProvider |
| Adding a new component | Use existing `--color-*` tokens from theme.css — no new CSS needed |
| Changing the brand green globally | Update `--supabase-green` primitive — ripples to all semantic usages |

## Anti-Patterns

### Anti-Pattern 1: Hardcoding Colors in Component Classes

**What people do:** Write `className="bg-[#3ecf8e]"` or `className="border-[#2e2e2e]"` directly in component TSX files.

**Why it's wrong:** The value is frozen in the component. When the theme changes (dark vs light) or the brand color shifts, every component must be hunted down and updated. Defeats the entire purpose of the token system.

**Do this instead:** Define the color as a primitive token in `shadcn-ui.css`, expose it via `@theme` in `theme.css`, and use the semantic Tailwind utility (`border-border`, `bg-accent`). For Supabase brand colors that don't map to Shadcn semantics, add `--color-supabase-green` to `theme.css` and use `bg-supabase-green`.

### Anti-Pattern 2: Duplicating Token Values Between :root and .dark

**What people do:** Copy-paste the same color value into both `:root` and `.dark` blocks to "make sure it applies."

**Why it's wrong:** Creates silent divergence when one is updated and the other is forgotten. Also masks intent — if a token has the same value in both themes, it should use a primitive that both reference.

**Do this instead:** If a color is the same in both themes (e.g., `--supabase-green`), define it only once in `:root` at the primitive layer. Both `:root` and `.dark` semantic blocks reference `var(--supabase-green)` — it's inherited from `:root` automatically in `.dark` since CSS variables cascade.

### Anti-Pattern 3: Replacing theme.css @theme Block

**What people do:** Delete the existing `@theme {}` block in `theme.css` and rewrite it with hardcoded values.

**Why it's wrong:** The existing bridge between `var(--background)` and `--color-background` is correct and already works. Hardcoding values in `@theme` breaks the connection between CSS variable overrides (`:root`, `.dark`) and Tailwind utilities — dark mode stops working for those utilities.

**Do this instead:** Extend the existing `@theme {}` block by adding new `--color-supabase-*` entries. Never remove existing mappings.

### Anti-Pattern 4: Modifying Shadcn Component Inline Styles Instead of Variants

**What people do:** Add `style={{ borderRadius: '9999px' }}` or inline `className` overrides at every call site to achieve pill shape.

**Why it's wrong:** Pill shape becomes scattered across dozens of call sites. If the design spec changes to 8px radius for buttons, every call site must change.

**Do this instead:** Add a `pill` variant to `buttonVariants` in `button.tsx`. Call sites use `<Button variant="pill">` — one change propagates everywhere.

### Anti-Pattern 5: Using @layer base for Semantic Token Values

**What people do:** Put `:root` and `.dark` blocks inside `@layer base {}`.

**Why it's wrong:** Shadcn's Tailwind v4 documentation explicitly states: "Move `:root` and `.dark` out of the `@layer base`." CSS custom properties inside `@layer` have lower specificity in Tailwind v4's cascade and can be overridden unexpectedly by `@theme` values.

**Do this instead:** Keep `:root` and `.dark` at the top level, outside any `@layer`. Only place structural resets (like `body { @apply bg-background; }`) inside `@layer base`. The existing `shadcn-ui.css` already has this pattern — preserve it.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `shadcn-ui.css` → `theme.css` | CSS variable references (`var(--background)`) | theme.css reads what shadcn-ui.css defines |
| `theme.css` → Tailwind utilities | `@theme {}` block generates `bg-background`, `text-primary`, etc. | Tailwind v4 CSS-first — no tailwind.config.js needed |
| `global.css` → all styles | `@import` order determines cascade priority | kit.css imports last, highest priority for structural overrides |
| `shadcn-ui.css` → component TSX | Semantic class names (`bg-primary`, `border-border`) | Components never import CSS directly — they use Tailwind utilities |
| `packages/ui/src/shadcn/button.tsx` → consumers | CVA `buttonVariants` export | Adding variants is non-breaking; no consumer changes needed unless they opt into new variants |
| `next-themes ThemeProvider` → CSS | Adds/removes `.dark` class on `<html>` | `global.css` declares `@variant dark (&:where(.dark, .dark *))` — this is already correct |

### Font Integration

| Step | File | Action |
|------|------|--------|
| Install packages | package.json | `pnpm add @fontsource-variable/geist @fontsource-variable/geist-mono` |
| Import font CSS | `app/styles/global.css` | Add `@import '@fontsource-variable/geist/wght.css'` before `@import 'tailwindcss'` |
| Set font variable | `app/styles/shadcn-ui.css` | Replace `--font-sans` value in `:root` block |
| Bridge to Tailwind | `app/styles/theme.css` | `--font-sans` already bridged — no change needed |
| Remove Google Fonts | `app/components/root-head.tsx` | Remove `dns-prefetch` and `preconnect` for fonts.googleapis.com |

## Build Order Implications

The CSS layers have strict dependency ordering for implementation:

```
Phase 1 (Foundation — no visual risk, all subsequent work depends on this)
  1. Install @fontsource-variable/geist + geist-mono
  2. Add font @import to global.css
  3. Add Supabase primitive tokens to :root in shadcn-ui.css
  4. Update --font-sans in :root
  5. Add --color-supabase-* entries to @theme in theme.css

Phase 2 (Dark theme semantic overrides — replace .dark block in shadcn-ui.css)
  6. Override all .dark {} Shadcn tokens with Supabase dark palette
  7. Update sidebar-* tokens for dark theme

Phase 3 (Light theme semantic overrides — replace :root semantic block)
  8. Override all :root {} Shadcn tokens with Supabase light palette
  9. Update sidebar-* tokens for light theme

Phase 4 (Component variants — isolated to packages/ui)
  10. Add `pill` and `pill-ghost` to buttonVariants in button.tsx
  11. Theme tabs for pill shape

Phase 5 (Structural / Depth — app-level component adjustments)
  12. Update border-based depth in cards, containers
  13. Theme sidebar navigation (color + weight + accent)
  14. Remove shadow utilities, ensure none remain

Phase 6 (Verification)
  15. WCAG AA contrast check both themes
  16. Toggle dark/light/system end-to-end
```

**Critical dependency:** Steps 1-5 (font + primitives) must complete before any component-level work. If primitive tokens don't exist, component classes that reference them silently fall back to browser defaults.

**Safe order for dark-first:** Complete dark theme (Steps 6-7) and verify before starting light theme (Steps 8-9). Dark is the primary theme per DESIGN.md — light can be iterated.

## Sources

- [Shadcn UI Theming Documentation](https://ui.shadcn.com/docs/theming) — HIGH confidence (official)
- [Shadcn UI Tailwind v4 Migration Guide](https://ui.shadcn.com/docs/tailwind-v4) — HIGH confidence (official)
- [Shadcnblocks Tailwind v4 Theming Guide](https://www.shadcnblocks.com/blog/tailwind4-shadcn-themeing/) — MEDIUM confidence (verified against official)
- [Fontsource Geist Install](https://fontsource.org/fonts/geist/install) — HIGH confidence (official fontsource docs)
- [Fontsource Geist Mono](https://fontsource.org/fonts/geist-mono/install) — HIGH confidence (official fontsource docs)
- Existing codebase analysis: `app/styles/`, `packages/ui/src/shadcn/button.tsx`, `app/root.tsx`, `app/components/root-providers.tsx` — HIGH confidence (direct inspection)

---
*Architecture research for: Supabase-inspired Shadcn UI + Tailwind CSS 4 theming*
*Researched: 2026-04-02*
