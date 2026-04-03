# Stack Research

**Domain:** Custom design system theme on Shadcn UI + Tailwind CSS 4
**Researched:** 2026-04-02
**Confidence:** HIGH

## Context

This is a theming milestone, not a new project. The core stack (React Router 7, Shadcn UI, Tailwind CSS 4, next-themes, Radix UI) is fixed and non-negotiable. This research covers only the additive technologies needed to implement the Supabase-inspired theme: font loading, CSS variable patterns, and component variant extension.

---

## Recommended Stack

### Core Technologies (Already Installed — No Changes)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Tailwind CSS | 4.1.18 | Utility-first CSS; CSS-first config via `@theme` | Locked |
| Shadcn UI | (vendored) | Component library; owned source in `packages/ui/src/shadcn/` | Locked |
| next-themes | 0.4.6 | Dark/light/system theme toggle via `.dark` class on `<html>` | Locked |
| class-variance-authority | 0.7.1 | Type-safe component variant composition for button extensions | Locked |

### New Packages to Install

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@fontsource-variable/geist` | 5.2.8 | Self-hosted Geist Sans variable font (weights 100–900) | Vite-compatible; WOFF2 variable font bundled via npm; full glyph support + `font-feature-settings`; MIT licensed. The official `geist` npm package uses Next.js-specific APIs and breaks in Vite projects. |
| `@fontsource-variable/geist-mono` | 5.2.7 | Self-hosted Geist Mono variable font | Same rationale as above; monospace companion for code labels. |

### Supporting Libraries (Already Installed — Referenced Here)

| Library | Version | Purpose |
|---------|---------|---------|
| `tailwind-merge` | 3.4.0 | Merges Tailwind classes without conflicts; critical for CVA variants |
| `clsx` | 2.1.1 | Conditional class composition; used in `cn()` utility |

---

## Installation

```bash
# Geist fonts (new — the only packages to install)
pnpm add @fontsource-variable/geist @fontsource-variable/geist-mono
```

---

## CSS Variable Pattern (Tailwind CSS 4 + Shadcn)

The existing codebase already uses the correct architecture. Understanding the full pattern is critical to overriding it correctly.

### How It Works Now

Three CSS files cooperate:

1. **`app/styles/shadcn-ui.css`** — Defines semantic token values in `:root` and `.dark` using `@layer base`. This is where color values live (background, foreground, primary, etc.). Currently uses Tailwind's built-in `var(--color-neutral-*)` references and oklch values.

2. **`app/styles/theme.css`** — Uses `@theme { }` (Tailwind CSS 4's CSS-first config) to expose the CSS variables as Tailwind utility tokens. For example, `--color-background: var(--background)` creates the `bg-background` utility. This file should NOT be modified for the theme work — it is already wired correctly.

3. **`app/styles/global.css`** — Imports chain; defines `@variant dark (&:where(.dark, .dark *))` which makes `dark:*` utilities respond to the `.dark` class. This is already correct for next-themes.

### What "Override the Theme" Means

Overriding the theme means replacing the **values** in `shadcn-ui.css` for both `:root` (light) and `.dark` (dark) — nothing else. The `@theme` wiring in `theme.css` and the import chain in `global.css` remain untouched.

### Color Format: oklch vs hsl vs hex

The existing `shadcn-ui.css` uses a mix: oklch values (from Shadcn's Tailwind v4 migration) and `var(--color-neutral-*)` Tailwind built-in references. The Supabase design system uses hex and `rgba()`.

**Recommendation: Use oklch throughout the override.**

- Tailwind CSS 4 + Shadcn's native format is oklch
- oklch values are perceptually uniform — lightness at 0.10 is actually dark regardless of hue
- Converters are trivial (use [oklch.com](https://oklch.com) or CSS Color 4 values)
- Consistency with the existing codebase reduces cognitive overhead for future maintainers

**Conversion guidance:**
- `#171717` (dark page background) → `oklch(0.10 0 0)` approximately
- `#3ecf8e` (Supabase green) → `oklch(0.79 0.17 162)` approximately
- For translucent rgba values (e.g., `rgba(62, 207, 142, 0.3)`), use `oklch(0.79 0.17 162 / 0.3)` — oklch supports `/` alpha notation natively

**Exception:** Supabase-specific brand tokens (the extra custom variables beyond Shadcn's standard set) can be defined using the exact hex/rgba from `DESIGN.md` and converted once. This is a one-time cost.

### Adding Custom Supabase Tokens

The Supabase design uses colors beyond Shadcn's standard token set (e.g., the full gray scale, border hierarchy, green accent variants). These go in `shadcn-ui.css` as additional `:root`/`.dark` variables AND need corresponding `@theme` entries in `theme.css` to become usable as Tailwind utilities.

Pattern:
```css
/* In shadcn-ui.css :root */
--sb-green: oklch(0.79 0.17 162);
--sb-green-link: oklch(0.75 0.19 156);
--sb-border-default: oklch(0.18 0 0);

/* In theme.css @theme block */
--color-sb-green: var(--sb-green);
--color-sb-green-link: var(--sb-green-link);
--color-sb-border-default: var(--sb-border-default);
```

This creates `bg-sb-green`, `text-sb-green-link`, `border-sb-border-default` utilities automatically.

### Dark Mode Toggle (Already Working)

`global.css` line 23: `@variant dark (&:where(.dark, .dark *))` — this is the Tailwind CSS 4 syntax for class-based dark mode. next-themes toggles the `.dark` class on `<html>`. No changes needed here.

---

## Font Loading Strategy

### Why Fontsource Over Alternatives

| Option | Status | Why |
|--------|--------|-----|
| `@fontsource-variable/geist` | **Use this** | Vite-compatible; WOFF2 + variable font; CSS import; MIT |
| `geist` (official npm) | Do NOT use | Uses `next/font/local` API; crashes Vite builds |
| Google Fonts CDN for Geist | Avoid | Limited glyph support; no `font-feature-settings`; external CDN dependency |
| Manual WOFF2 files in `/public` | Acceptable fallback | Works but requires manual updates; fontsource handles this via npm |

### Integration Pattern

```ts
// In app/entry.client.tsx or root.tsx (client-side import)
import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
```

Or via CSS import in `global.css`:
```css
@import '@fontsource-variable/geist/wght.css';
@import '@fontsource-variable/geist-mono/wght.css';
```

Both work with Vite. The CSS import approach keeps all font loading in the stylesheet chain, which is the pattern this project already follows.

Then in `shadcn-ui.css`:
```css
:root {
  --font-sans: 'Geist Variable', Helvetica Neue, Helvetica, Arial, sans-serif;
  --font-mono: 'Geist Mono Variable', 'Source Code Pro', Menlo, monospace;
}
```

And in `theme.css`, the existing wiring already maps `--font-sans` to `--font-sans` and `--font-heading` is also available. Add:
```css
@theme {
  --font-mono: var(--font-mono);
}
```

---

## Component Variant Extension (Pill Button)

The Supabase design requires a `pill` button variant (9999px radius). The Shadcn Button component lives in `packages/ui/src/shadcn/button.tsx` and is owned code (not from an external package). It uses CVA.

### Pattern: Add to Existing CVA Definition

```ts
// In packages/ui/src/shadcn/button.tsx
const buttonVariants = cva(
  '...base classes...',
  {
    variants: {
      variant: {
        // existing variants...
        pill: 'rounded-full border border-foreground bg-background text-foreground px-8 py-2 font-medium',
        'pill-muted': 'rounded-full border border-border bg-background text-foreground opacity-80 px-8 py-2',
      },
      // ...
    },
  },
);
```

Because the component is vendored (owned source), direct modification is correct. No wrapper component needed. TypeScript auto-completes the new variant name via `VariantProps<typeof buttonVariants>`.

---

## Tooling

| Tool | Purpose | Notes |
|------|---------|-------|
| [tweakcn.com](https://tweakcn.com) | Visual theme generator for Shadcn/Tailwind v4 | Useful for generating initial oklch values from hex; output is copy-pasteable CSS variable blocks. Not installed — used as a web tool during design. |
| [oklch.com](https://oklch.com) | Convert hex/hsl to oklch | One-time conversion during token mapping. |
| Browser DevTools | Verify CSS variable values in dark/light | Standard debugging; no install needed. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Font loading | `@fontsource-variable/geist` | `geist` official npm package | `geist` uses Next.js-specific `next/font/local`; causes RollupError in Vite builds |
| Font loading | `@fontsource-variable/geist` | Google Fonts CDN | External dependency; no `font-feature-settings`; glyph coverage limited |
| Color format | oklch | hsl with space-separated values | Tailwind CSS 4 requires explicit `hsl()` function calls on v3-style space-separated values; oklch is the native format and already used in the codebase |
| Color format | oklch | Raw hex values | Hex works in CSS variables but doesn't compose with Tailwind's opacity modifier (`/50`) — `bg-primary/50` only works with oklch/hsl |
| Button pill variant | CVA extension in button.tsx | Wrapper component | Owned source; direct modification is simpler and maintains type safety |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `geist` npm package | Uses `next/font/local`; RollupError in Vite/React Router | `@fontsource-variable/geist` |
| New UI libraries (daisyUI, etc.) | Breaks existing Shadcn component API; out of scope per PROJECT.md constraints | Style existing Shadcn components via CSS variables |
| `box-shadow` for depth | Contradicts Supabase design principle; shadows make dark UI look dated | Border-based depth: `#2e2e2e` → `#363636` hierarchy |
| Bold (700) font weight | Not in Supabase design system; reserved for nothing | Weight 400 body, weight 500 buttons/nav only |
| `tailwind.config.js` | Tailwind CSS 4 is CSS-first; no JS config file in this project | `@theme` block in `theme.css` |
| Hardcoded colors in components | Defeats the theming system; breaks dark/light switching | CSS variable tokens via `bg-background`, `text-foreground`, etc. |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@fontsource-variable/geist@5.2.8` | Vite 7.x, pnpm 10.x | Confirmed Vite-compatible; no special config required |
| `@fontsource-variable/geist-mono@5.2.7` | Vite 7.x, pnpm 10.x | Same package family; same compatibility |
| `class-variance-authority@0.7.1` | Already installed | No version change needed |
| `next-themes@0.4.6` | Tailwind CSS 4 `@variant dark` | Already configured correctly; `@variant dark (&:where(.dark, .dark *))` in global.css |

---

## Sources

- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — `@theme inline` pattern, color format migration (MEDIUM confidence — official docs, verified)
- [shadcn/ui Theming docs](https://ui.shadcn.com/docs/theming) — CSS variable token system, semantic pairs (HIGH confidence — official docs)
- [Tailwind CSS v4 Dark Mode docs](https://tailwindcss.com/docs/dark-mode) — `@custom-variant` / `@variant` syntax (HIGH confidence — official docs)
- [Fontsource Geist install](https://fontsource.org/fonts/geist/install) — `@fontsource-variable/geist` package, import syntax (HIGH confidence — official Fontsource docs)
- [Fontsource Geist Mono install](https://fontsource.org/fonts/geist-mono/install) — `@fontsource-variable/geist-mono` package (HIGH confidence — official Fontsource docs)
- npm registry — `@fontsource-variable/geist@5.2.8`, `@fontsource-variable/geist-mono@5.2.7` (HIGH confidence — live npm query)
- [vercel/geist-font Issue #107](https://github.com/vercel/geist-font/issues/107) — Confirmation that official `geist` package breaks Vite/Remix (MEDIUM confidence — GitHub issue)
- Codebase inspection — `app/styles/shadcn-ui.css`, `app/styles/theme.css`, `app/styles/global.css`, `packages/ui/src/shadcn/button.tsx` — confirmed existing architecture (HIGH confidence — source of truth)

---

*Stack research for: Supabase-inspired theme on Shadcn UI + Tailwind CSS 4*
*Researched: 2026-04-02*
