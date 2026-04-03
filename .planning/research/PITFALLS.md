# Pitfalls Research

**Domain:** Shadcn UI theming with custom design system (Supabase-inspired dark/light)
**Researched:** 2026-04-02
**Confidence:** HIGH (verified via official Shadcn docs, Tailwind GitHub discussions, codebase inspection)

---

## Critical Pitfalls

### Pitfall 1: @theme vs @theme inline — Dark Mode CSS Variables Don't Update

**What goes wrong:**
When `@theme inline` is used (as the codebase already does in `app/styles/theme.css`), Tailwind bakes color values into generated utility classes at build time. When `.dark` overrides the underlying CSS variables at runtime, the baked utility values do NOT update — they still reference the original light-mode values. Dark mode appears to do nothing visually, or partially works for some properties but not others.

**Why it happens:**
Tailwind v4's `@theme inline` bakes variable values into utilities rather than keeping them as live CSS variable references. Developers assume "define variable, override in .dark, done" — but `@theme inline` breaks the live reference chain. The non-inline `@theme` block preserves the live reference but introduces different tradeoffs (global variable pollution).

**How to avoid:**
The codebase's current pattern is correct: use `@theme` (without `inline`) for the `--color-*` mappings in `theme.css`, which keeps live references. Then define actual color values in `shadcn-ui.css` under `:root` and `.dark`. When adding new Supabase color tokens, follow this same two-file split:
- Define raw values in `shadcn-ui.css` under `:root { }` and `.dark { }`
- Map to Tailwind utilities in `theme.css` using `@theme { --color-*: var(--*); }`
- Do NOT move raw hex/oklch values into `@theme` blocks directly

**Warning signs:**
- Dark mode toggle changes the `.dark` class on `<html>` but component colors don't visually change
- `bg-background` shows white in dark mode
- DevTools shows CSS variables updating but rendered background color unchanged

**Phase to address:** Foundation phase (CSS variable architecture) — must be locked down before any color values are defined.

---

### Pitfall 2: Missing suppressHydrationWarning on the html Element

**What goes wrong:**
The app uses server-side theme detection (reads a cookie in the root loader, applies `.dark` class server-side). During hydration, React may warn about a mismatch if the server-rendered `className` on `<html>` doesn't exactly match what the client hydrates with. More critically: if a user has `system` theme and the server guesses wrong (or the default theme differs from the user's OS preference), there will be a flash of the wrong theme on first load before client-side correction.

**Why it happens:**
`next-themes` (and this app's equivalent SSR theme mechanism) cannot read `prefers-color-scheme` on the server. The server applies whatever the cookie says, or falls back to the app's default theme. If the client theme differs, React's hydration sees a className mismatch on `<html>`.

**How to avoid:**
Add `suppressHydrationWarning` to the `<html>` element in `app/root.tsx`. This is the established pattern for SSR theming and does not suppress meaningful errors — it only silences the expected theme-class mismatch. The current `root.tsx` does not have this attribute; it must be added as part of the theme foundation phase.

Additionally: use `disableTransitionOnChange` in the ThemeProvider to prevent color transition flicker during theme switches. This is already common practice but easy to forget.

**Warning signs:**
- Browser console shows React hydration warning mentioning `className` on `<html>` or `<body>`
- Brief white flash when loading the app in dark mode (light-mode CSS applied before client corrects it)
- Theme toggle triggers visible CSS transition across all elements simultaneously (jarring)

**Phase to address:** Foundation phase — before any theme values are defined. suppressHydrationWarning is a one-line fix with outsized impact.

---

### Pitfall 3: Geist Font Loaded via next/font in a Non-Next.js Project

**What goes wrong:**
The official Geist npm package (`geist`) requires `next/font` and will throw a module-not-found error when imported in a Vite/React Router project. Developers copy installation instructions from the Vercel docs and get an immediate build failure.

**Why it happens:**
Vercel documented Geist primarily for their own Next.js ecosystem. The `geist` package's default exports rely on `next/font/google` internals. This is a known issue (GitHub: `vercel/geist-font#62`).

**How to avoid:**
Use `@fontsource/geist` and `@fontsource/geist-mono` instead — these are standard Fontsource packages that work in any bundler. Import specific weight CSS files in the app entry or global CSS:

```css
/* In global.css or a dedicated fonts.css */
@import '@fontsource/geist/400.css';
@import '@fontsource/geist/500.css';
@import '@fontsource/geist-mono/400.css';
```

Then update `shadcn-ui.css` to set `--font-sans: 'Geist', ...` and `theme.css` to map it via `@theme`. Alternatively, use the `non.geist` package which is explicitly designed for non-Next.js environments.

**Warning signs:**
- Build error: `Cannot find module 'next/font'` or `Cannot find module 'next/font/google'`
- Font appears to load in dev (might work coincidentally) but fails in production build

**Phase to address:** Font installation phase — verify the package choice before writing any font-family CSS.

---

### Pitfall 4: FOUT (Flash of Unstyled Text) with Font Swap in SSR

**What goes wrong:**
When Geist is loaded via CSS `@import` with default `font-display: swap`, users see a brief flash of the system fallback font (typically Helvetica or Arial) before Geist loads. On an agricultural ERP where users are session-heavy, this happens on every hard reload. The visual jump is more noticeable with geometric sans-serifs because the x-height and metrics differ significantly from system fonts.

**Why it happens:**
`font-display: swap` is correct for performance (avoids invisible text) but causes layout shift as fallback metrics differ from Geist metrics. Without `size-adjust` and `ascent-override` on the fallback, the text reflowing is visible.

**How to avoid:**
Preload Geist 400 and 500 weight woff2 files via `<link rel="preload">` in `RootHead`. Fontsource packages include woff2 files; add explicit preload links in `app/components/root-head.tsx`. Also add font metric overrides on the fallback font-face declaration:

```css
@font-face {
  font-family: 'Geist Fallback';
  src: local('Helvetica Neue');
  size-adjust: 100%;  /* tune to match Geist metrics */
  ascent-override: 95%;
}
```

**Warning signs:**
- Text visibly reflows 50-200ms after page load on hard refresh
- Lighthouse "Cumulative Layout Shift" score degrades after font installation
- Monospace code labels jump in width when Geist Mono swaps in

**Phase to address:** Font installation phase — address alongside font package selection.

---

### Pitfall 5: Color Contrast Failures on Muted Text in Both Themes

**What goes wrong:**
The Supabase dark palette uses `#898989` for muted text on `#171717` backgrounds. This combination (`#898989` on `#171717`) has a contrast ratio of approximately 4.6:1 — barely above the WCAG AA threshold of 4.5:1 for normal text. Small rounding differences, monitor calibration, or slightly different hex values can push this below 4.5:1. The light theme is equally risky: the design spec does not yet have complete light theme values, so light-mode muted text is undefined and likely to be copied from dark values without re-checking contrast.

**Why it happens:**
Designers verify contrast at design time on a calibrated monitor. Developers copy hex values without re-running contrast checks. Supabase's own palette is optimized for their marketing site at specific font sizes; applying it to dense ERP tables and form labels (smaller text, more muted states) breaks the threshold.

**How to avoid:**
Run WCAG AA contrast checks (4.5:1 for normal text, 3:1 for large text) against every text/background pairing before finalizing tokens — specifically:
- `--muted-foreground` on `--background`
- `--muted-foreground` on `--card`
- `--sidebar-foreground` on `--sidebar-background`
- `--color-mid-gray` (#898989) on any surface
- Green accent (`#00c573`) on near-black — this combination fails WCAG AA (ratio ~3.5:1 for small text)

Use the WebAIM Contrast Checker or the browser's built-in DevTools accessibility panel. The green accent should only be used for decorative elements, borders, and large interactive targets — never for body text.

**Warning signs:**
- Any muted text below 14px (0.875rem) using `#898989` on `#171717`
- Green color (`#00c573`, `#3ecf8e`) used for text at small sizes
- DevTools accessibility audit flags low-contrast elements
- `--muted-foreground` value copied from dark to light theme unchanged

**Phase to address:** Color token definition phase — verify all text/bg pairs before committing CSS variables. Revisit during light theme phase.

---

### Pitfall 6: CSS Variable Naming Conflicts Between Supabase Tokens and Shadcn Tokens

**What goes wrong:**
Adding new Supabase-specific tokens (e.g., `--supabase-green`, `--border-dark`, `--glass-dark`) to the same `:root` scope as Shadcn's existing variables creates a flat namespace. If a custom token name accidentally collides with a Tailwind internal or a future Shadcn update (e.g., Shadcn already defines `--border`), the custom value silently overrides component behavior or the component override silently overwrites the custom value, depending on import order.

**Why it happens:**
CSS custom properties are globally scoped to the element. There is no module system. Developers add new tokens without auditing existing names.

**How to avoid:**
Namespace all Supabase-specific tokens with a prefix: `--sb-green`, `--sb-border-dark`, `--sb-glass-dark`. Map them to Shadcn tokens explicitly:
```css
:root {
  --sb-green: #3ecf8e;
  --sb-green-link: #00c573;
  --sb-border-dark: #2e2e2e;
  /* Map to Shadcn tokens */
  --ring: var(--sb-green);
  --border: var(--sb-border-dark);
}
```
Keep the `--sb-*` tokens available for direct use in one-off utilities.

**Warning signs:**
- A component's border color changes unexpectedly after adding a new color token
- `--border` in `shadcn-ui.css` stops working after adding Supabase tokens
- Two variables with similar names for different purposes (e.g., `--border` vs `--border-dark`)

**Phase to address:** Color token definition phase — establish naming convention before writing any token values.

---

### Pitfall 7: Removing Box-Shadows Breaks Focus Indicators

**What goes wrong:**
The DESIGN.md "no box-shadows" philosophy is correct for depth/elevation — but Shadcn components use `box-shadow` for focus rings (the `focus-visible:ring-1 focus-visible:ring-ring` pattern in the Button component). Wholesale removing box-shadows (via CSS override or browser default reset) eliminates keyboard focus indicators, failing WCAG 2.4.7 (Focus Visible).

**Why it happens:**
Developers conflate "no elevation shadows" with "no shadows at all." The Supabase design uses `outline` for focus states, not `box-shadow`. The migration from box-shadow focus rings to outline focus rings requires per-component updates, not a global shadow removal.

**How to avoid:**
Do not add `box-shadow: none` globally. Instead:
1. Keep the existing `focus-visible:ring-1 focus-visible:ring-ring` on interactive components — just update `--ring` to the Supabase green
2. For pill buttons specifically, switch to `outline` with `outline-offset: 2px` to work correctly with `border-radius: 9999px` (box-shadow focus rings clip at extreme radii in some browsers)
3. The depth system replacement (border colors instead of elevation shadows) only applies to card/container/surface `box-shadow` declarations, not focus rings

**Warning signs:**
- Keyboard tabbing through the UI shows no visible focus indicator
- DevTools accessibility audit flags "focusable element has no focus indicator"
- All interactive elements look the same focused vs unfocused

**Phase to address:** Component theming phase — document the distinction between "elevation shadows (remove)" and "focus ring shadows (preserve/replace with outline)" as an explicit design rule before touching component CSS.

---

### Pitfall 8: Pill Button Variant Conflicts with Existing Size Modifiers

**What goes wrong:**
Adding a `pill` variant (or `rounded-full` to an existing variant) to the Button component conflicts with the `sm` and `lg` size variants that hardcode `rounded-md`. The CVA `cva()` definition in `packages/ui/src/shadcn/button.tsx` applies radius in the size variants (`sm: 'h-8 rounded-md px-3 text-xs'`), not the base — so adding `rounded-full` to a new `pill` variant produces classes `rounded-full rounded-md` where whichever comes last in Tailwind's generated output wins.

**Why it happens:**
`cva` merges classes by concatenation; it does not resolve conflicting Tailwind utilities. The `cn()` utility (built on `tailwind-merge`) does resolve conflicts, but only when used explicitly.

**How to avoid:**
Two clean approaches:
1. Add `rounded-full` to the CVA base for the pill variant AND remove `rounded-md` from size variants for pill: use a compound variant: `compoundVariants: [{ variant: 'pill', size: 'sm', class: 'rounded-full' }]` etc.
2. Separate pill radius from variant: make `rounded` a distinct CVA dimension (`rounded: { default: 'rounded-md', full: 'rounded-full' }`) so it composes cleanly with any size.

Option 2 is more future-proof for a design system that uses both pill and standard shapes.

**Warning signs:**
- Pill button appears with slightly rounded corners rather than fully round
- Button size changes when adding `variant="pill"` — radius class order is wrong
- `tailwind-merge` warnings in console about conflicting border-radius classes

**Phase to address:** Component variant phase — test with all combinations of size + variant before finalizing the pill variant API.

---

### Pitfall 9: Hardcoded Colors in kit.css Break Under the New Theme

**What goes wrong:**
`app/styles/kit.css` contains hardcoded hex values and non-semantic colors (`rgba(255, 255, 255, .10)`, `var(--color-gray-200)`) for the `.site-header` and `.site-footer` gradient decorations. When the Supabase dark palette replaces `--color-gray-200` with dark border tokens, these gradient decorations will either become invisible or produce wrong colors. Hardcoded `rgba(255, 255, 255, .10)` on a dark background will look fine, but on the light theme will appear as a low-contrast white-on-white decoration.

**Why it happens:**
`kit.css` uses raw CSS with `.dark` class scoping rather than semantic token references. Developers write direct hex or rgba values for one-off decorative elements without considering that theme changes will affect them.

**How to avoid:**
Audit `kit.css` during the foundation phase. Replace `var(--color-gray-200)` with `var(--border)` and define a semantic `--header-gradient-color` token that both themes override. The existing `.dark` override in `kit.css` should use CSS variable references rather than raw rgba values.

**Warning signs:**
- Header/footer gradient looks wrong in light theme (white glow on white background)
- Header decoration disappears in dark mode after palette swap
- Any CSS file containing `#`, `rgb(`, or `rgba(` outside of token definitions

**Phase to address:** Foundation phase — audit all existing CSS files for hardcoded values before writing new theme tokens.

---

### Pitfall 10: @theme Block Does Not Live-Update for Dark Mode Without Proper Variable Scoping

**What goes wrong:**
The `@theme` block in `theme.css` maps `--color-background: var(--background)`. This works for dark mode only because `global.css` defines `@variant dark (&:where(.dark, .dark *))` — which means Tailwind's `dark:` utilities work. BUT if someone adds new Supabase color tokens to `@theme` with hardcoded values (e.g., `--color-sb-border: #2e2e2e`) instead of variable references, those utilities will NOT change for light mode. The light theme will use dark border colors everywhere.

**Why it happens:**
Developers see the `@theme` block and treat it as a configuration file, adding values directly. They don't realize that for dual-theme support, every color in `@theme` must reference a CSS variable defined in the `:root`/`.dark` scope, not be hardcoded.

**How to avoid:**
Enforce a strict rule: `@theme` blocks contain ONLY `var()` references. Raw color values (hex, oklch, rgba) belong exclusively in `shadcn-ui.css` under `:root` and `.dark`. Document this rule in a comment at the top of both files:
```css
/* theme.css: Tailwind utility mappings ONLY. No raw color values. */
/* shadcn-ui.css: Raw color values ONLY. One entry per token per theme. */
```

**Warning signs:**
- Light theme uses dark palette colors (borders are dark gray on white background)
- Toggling between dark/light changes some colors but not others
- `@theme` block contains any hex values, oklch literals, or rgba values

**Phase to address:** Foundation phase — establish and document this rule before any token values are written.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Adding hardcoded hex to `@theme` block | Works immediately | Light theme breaks; can't override per-theme | Never |
| Using `!important` to override Shadcn component colors | Fixes specificity conflict fast | Makes future updates impossible; breaks cn() merge | Never |
| Copying dark palette values to light theme placeholder | Gets something visible quickly | Unreadable light mode; contrast failures | Only as temporary development scaffolding |
| Using `--color-neutral-900` etc. (Tailwind palette tokens) in `shadcn-ui.css` | Ties to existing Tailwind scale | If Tailwind palette changes, theme breaks silently | Acceptable for non-semantic colors; prefer oklch literals for semantic ones |
| Setting global `box-shadow: none` to remove all shadows | Clean slate for border depth system | Destroys keyboard focus indicators; WCAG failure | Never |
| Using `geist` npm package instead of `@fontsource/geist` | Matches official Vercel docs | Build fails in non-Next.js projects | Never in this project |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| next-themes + React Router SSR | Not adding `suppressHydrationWarning` to `<html>` — causes React hydration warnings | Add `suppressHydrationWarning` to `<html lang={language} className={className} suppressHydrationWarning>` in `root.tsx` |
| Tailwind v4 `@theme` + dark mode | Putting raw color values in `@theme` instead of CSS variable references | `@theme` maps vars; `:root`/`.dark` defines raw values |
| Shadcn Button cva + pill shape | Using `rounded-full` in the same CVA dimension as `rounded-md` size variants | Use compound variants or a separate `rounded` CVA dimension |
| `@fontsource/geist` + Tailwind v4 | Defining font-family in `@theme` without CSS variable indirection | Set `--font-sans: 'Geist', ...` in `:root`, then `@theme { --font-sans: var(--font-sans); }` |
| Supabase green (#3ecf8e, #00c573) + text | Using green for body text or small labels | Green is identity-only: borders, pill active state, large interactive targets; never small text |
| `kit.css` decorative gradients | Hardcoded `rgba` values don't respond to theme switch | Replace with semantic CSS variables overridden per theme |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all Fontsource weights (100-900) | Slow first load, large CSS bundle | Import only weights 400 and 500 (the only two used in DESIGN.md) | Immediately — 7 weights = 7x the font CSS |
| No font preloading | FOUT on every hard page load | Add `<link rel="preload">` for woff2 files for weights 400 and 500 | Every SSR page load |
| CSS variable chain depth > 3 | CSS recalculation overhead; debugging difficulty | Keep chains shallow: raw value → semantic token → Tailwind utility (max 2 hops) | Not a performance issue at this scale; maintainability issue immediately |
| Importing full `react-day-picker` styles alongside new theme | Stylesheet conflicts on date pickers | Audit third-party CSS imports that hardcode colors | When theme differs from react-day-picker defaults |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Theme toggle shows transition flash across all elements | Jarring color shift of entire screen | Add `disableTransitionOnChange` to ThemeProvider, or use `transition: none` on `:root` during theme switch |
| Green accent used on active sidebar items as background | High contrast is visually loud; Supabase uses green for borders/accents only | Use lighter surface (`--sidebar-accent`) for active state background; reserve green for left border indicator or text |
| Muted gray text at 12px on dark background | Fails WCAG contrast at small sizes even if 14px passes | Use `--muted-foreground` only at 14px+; at 12px use a lighter token |
| Pill tabs without min-width on short labels | Single-character labels become very small circles | Set minimum padding (`px-3`) on pill tab trigger regardless of content length |
| Geist Mono uppercase labels with 1.2px letter-spacing in table cells | Wide columns for technical identifiers | Limit Geist Mono uppercase to badges/tags; do not use in table column data cells |

---

## "Looks Done But Isn't" Checklist

- [ ] **Dark theme complete:** Verify all Shadcn component variants (destructive, outline, ghost, secondary) are themed — not just the default variant. The destructive variant uses `--destructive` which defaults to Tailwind red; it must be explicitly mapped.
- [ ] **Light theme complete:** Confirm every token in `.dark {}` has a corresponding and tested `:root {}` value. Missing light tokens silently inherit the browser default.
- [ ] **Both themes toggle correctly:** Test theme toggle at every major component — sidebar, modal/dialog, data table, form inputs, select dropdowns (Radix portals), toast notifications (Sonner). Radix portals render at `document.body` level and inherit `.dark` correctly only if the variant selector uses `(&:where(.dark, .dark *))` — which the codebase already has.
- [ ] **Font actually loaded:** Verify Geist renders in browser DevTools (Network tab: woff2 requests; Computed style: font-family shows Geist, not Helvetica). Dev builds often succeed while production builds fail due to missing font asset paths.
- [ ] **Focus rings visible in both themes:** Tab through all interactive elements in both dark and light themes. Ring color `--ring` must have sufficient contrast against both `--background` and `--card` backgrounds.
- [ ] **Sidebar accent and active states:** Sidebar uses dedicated `--sidebar-*` tokens, not the main `--accent` token. Verify the sidebar tokens are updated for both themes — they are defined separately in `shadcn-ui.css`.
- [ ] **Chart colors not broken:** `shadcn-ui.css` defines `--chart-1` through `--chart-5`. If these are updated for the Supabase palette, verify `recharts` components that reference `hsl(var(--chart-1))` still parse correctly (they should, since values wrap in `hsl()` at the `:root` level).
- [ ] **Sonner toasts themed:** The Sonner library uses its own `data-sonner-toaster` and `data-type` attributes for theming. It respects the `theme` prop passed to `<Toaster>` — verify the Toaster receives the active theme.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| @theme inline used for raw colors — dark mode broken | MEDIUM | Move raw values out of `@theme` into `:root`/`.dark` blocks; update `@theme` to reference vars |
| Geist font package wrong — build fails | LOW | Swap `geist` for `@fontsource/geist`; update import in global.css; no other changes needed |
| Contrast failures found post-implementation | MEDIUM | Identify failing pairs via WebAIM checker; adjust token values in `shadcn-ui.css` only (no component changes) |
| Missing suppressHydrationWarning — hydration warnings flooding console | LOW | One-line add to `root.tsx` `<html>` element |
| Pill button radius conflicts with size variants | LOW | Refactor CVA definition; no external API change if variant prop name is preserved |
| Box-shadow removal broke focus indicators | HIGH | Audit all interactive components; add explicit `outline`-based focus styles per component; requires visual QA pass |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| @theme vs @theme inline dark mode | Foundation: CSS architecture | Dark mode toggle changes all surface colors |
| Missing suppressHydrationWarning | Foundation: root.tsx setup | No React hydration warnings in console |
| Wrong Geist font package | Foundation: font installation | `pnpm build` succeeds; font loaded in prod build |
| FOUT font flash | Foundation: font preloading | Lighthouse CLS score unchanged after font addition |
| Muted text contrast failures | Color tokens: both themes | WebAIM checker passes 4.5:1 for all text tokens |
| CSS variable naming conflicts | Color tokens: naming convention | Search for duplicate token names across all CSS files |
| Removing box-shadows breaks focus | Component theming: interactive states | Keyboard tabbing shows visible focus in both themes |
| Pill button CVA conflicts | Component theming: button variants | All size + variant combinations render correct border-radius |
| Hardcoded colors in kit.css | Foundation: CSS audit | No hex or rgba literals outside of `:root`/`.dark` blocks |
| @theme raw values for dual-theme | Foundation: CSS architecture | Light theme uses distinct values from dark theme for all tokens |

---

## Sources

- [Shadcn UI Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — official CSS variable format for v4, OKLCH migration, @theme inline pattern — HIGH confidence
- [Shadcnblocks: Tailwind 4 + Shadcn Theming](https://www.shadcnblocks.com/blog/tailwind4-shadcn-themeing/) — breaking changes, border color removal, cursor removal — MEDIUM confidence
- [Tailwind GitHub Discussion #15083](https://github.com/tailwindlabs/tailwindcss/discussions/15083) — CSS variables and dark mode detection coupling problem — HIGH confidence
- [Tailwind GitHub Discussion #18560](https://github.com/tailwindlabs/tailwindcss/discussions/18560) — @theme vs @theme inline behavior differences — HIGH confidence
- [Tailwind GitHub Discussion #16730](https://github.com/tailwindlabs/tailwindcss/discussions/16730) — dark-mode-specific CSS variables in Tailwind 4 — HIGH confidence
- [Geist font GitHub Issue #62](https://github.com/vercel/geist-font/issues/62) — Geist only works in Next.js by default — HIGH confidence
- [@fontsource/geist npm](https://www.npmjs.com/package/@fontsource/geist) — non-Next.js font solution — HIGH confidence
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — WCAG contrast ratio standards — HIGH confidence
- [next-themes README](https://github.com/pacocoursey/next-themes) — suppressHydrationWarning, SSR hydration patterns — HIGH confidence
- Codebase inspection: `app/styles/theme.css`, `app/styles/shadcn-ui.css`, `app/styles/global.css`, `app/styles/kit.css`, `app/root.tsx`, `packages/ui/src/shadcn/button.tsx` — direct verification of existing patterns and risk areas — HIGH confidence

---

*Pitfalls research for: Shadcn UI theming with Supabase-inspired design system (dark + light)*
*Researched: 2026-04-02*
