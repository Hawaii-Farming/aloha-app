# Feature Research

**Domain:** Design system theming — Shadcn UI + Tailwind CSS 4 + next-themes, Supabase-inspired dark/light
**Researched:** 2026-04-02
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must be present. Missing any of these makes the theme feel broken or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| CSS variable overrides for Shadcn tokens | Shadcn's entire theming model is built on `--background`, `--foreground`, `--primary`, etc. Overriding these in `:root` and `.dark` is the only correct entry point | LOW | Modify `globals.css` only; no component changes needed |
| Dark theme palette applied to all Shadcn defaults | Users will open every screen — any component that didn't receive the override looks obviously broken | MEDIUM | ~20 semantic tokens; must map Supabase neutrals to Shadcn names |
| Light theme palette applied to all Shadcn defaults | next-themes is already wired; leaving light theme as Shadcn default creates jarring inconsistency when users switch | MEDIUM | Requires the light palette spec to be finalized first (marked as active in PROJECT.md) |
| System preference respects OS dark/light | Standard browser behavior since 2020; any app that ignores `prefers-color-scheme` feels broken to 80%+ of users who use OS dark mode | LOW | next-themes `defaultTheme="system"` + `enableSystem` already in codebase; just needs correct CSS variables |
| Three-way theme toggle (dark / light / system) | Users who care about theme control expect to pin it or let it float with OS | LOW | Toggle component already exists; no new infrastructure needed |
| No theme flicker on page load | FOUC (Flash of Unstyled Content) on reload is visually jarring and signals poor quality | LOW | next-themes injects an inline script that reads localStorage before first paint; this is automatic if ThemeProvider is set up correctly with `suppressHydrationWarning` |
| WCAG AA contrast in both themes | Legal compliance baseline (4.5:1 normal text, 3:1 large text); failure makes the app unusable for ~8% of users with low vision | MEDIUM | Supabase dark palette easily meets AA; light theme needs manual contrast checks |
| Geist font installed and applied globally | The entire type system in DESIGN.md is specced around Geist. Without it, every size/weight ratio looks wrong | LOW | Free MIT font via `next/font` or CDN; one `font-family` CSS variable change propagates everywhere |
| Geist Mono applied to code/technical labels | Monospace companion for technical labels is part of the identity; without it the "developer console" aesthetic is absent | LOW | Add alongside Geist; apply only to `--font-mono` CSS variable |
| Border-based depth (no box-shadows on cards/containers) | Supabase's identity is border-first depth; keeping default Shadcn shadows produces a hybrid that looks unintentional | LOW | Add `box-shadow: none` overrides in the CSS variable layer for card and container components |
| Sidebar themed to match (dark bg, green accents, weight-500 nav links) | The sidebar is the most visible chrome element; a mismatched sidebar immediately breaks cohesion | MEDIUM | Requires targeted CSS for the sidebar layout component; not covered by Shadcn tokens alone |
| Form inputs, select, checkbox, radio themed | Data entry is the primary activity in an ERP; mismatched form controls are noticed immediately | MEDIUM | Covered by Shadcn's `--input`, `--ring`, `--border` tokens; some Radix internals may need extra selectors |
| Data table themed | Tables are the primary read surface in every ERP module | MEDIUM | TanStack Table renders plain HTML; styling is via Shadcn's `Table` component tokens + direct Tailwind classes |

### Differentiators (Competitive Advantage)

Features that elevate the result beyond "it's dark now" to "this feels like Supabase."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Pill button variant (9999px radius) added to Shadcn Button | The pill shape is the single most recognizable Supabase UI element; it signals that this is a deliberate design choice, not a default theme | LOW | Add a `pill` variant via CVA inside `button.tsx`; does not break existing `default`/`outline`/`ghost` variants |
| Pill-shaped tab indicator (active state) | Tabs with pill active states are Supabase's UX signature for navigation; standard rectangular tabs look generic | LOW | Override Shadcn Tabs CSS or create a `pill` variant in the Tabs component |
| Emerald green used precisely and sparingly | Green as identity marker (not decoration) is what makes Supabase feel intentional; overusing it makes it look like a green-themed app | LOW | Discipline: apply `--primary` green only to active nav, CTA buttons, focus rings, and border accents |
| HSL-with-alpha token layer for translucent surfaces | Enables glass-like overlays, subtle washes, and context-sensitive depth without new components | MEDIUM | Add Supabase's `--colors-slateA12`, `--colors-indigo-A2`, etc. as supplementary CSS variables alongside Shadcn's semantic tokens |
| Radix color scale integration (12-step) | Provides precise semantic semantic colors for alerts, badges, and status indicators that match Supabase's approach | MEDIUM | `@radix-ui/colors` is likely already a transitive dep via Shadcn; expose the needed scales as CSS variables |
| Monospace technical labels with uppercase + 1.2px letter-spacing | Adds the "developer console" identity that distinguishes the ERP from generic SaaS | LOW | Utility class or CSS variable applied to specific label components; not a global change |
| Focused typography weight restraint (400 body, 500 nav/buttons only) | Supabase's hierarchy is built on size, not weight; "no bold in the UI" is unusual enough to be instantly recognizable | LOW | Audit existing components for `font-bold` / `font-semibold` Tailwind classes; replace with `font-medium` (500) or `font-normal` (400) per DESIGN.md spec |
| Negative letter-spacing on card titles (-0.16px) | Tight tracking on card titles is a subtle Supabase detail that most theme ports miss; it creates a "finished" feeling | LOW | Single CSS custom property on card heading elements |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| CSS animations and transitions on theme switch | "Polish" — smooth fade between dark and light feels fancy | SSR + next-themes = the theme class is applied before first paint. Adding a CSS transition causes elements to visibly animate on every page load, not just on toggle. This creates a guaranteed FOUC-like flash on every navigation. | Add `transition-colors` only to the toggle button icon itself; never to `body` or high-level containers |
| Custom scrollbar styling per theme | Consistent branded scrollbars look finished | Cross-browser inconsistency: only Webkit supports `::-webkit-scrollbar`. Firefox uses `scrollbar-color` with limited control. On Windows, scrollbars overlay content differently. A broken scrollbar is more noticeable than a default one. | Skip custom scrollbars in v1; add only if users specifically request and only as a progressive enhancement |
| Per-module color accents (growing = green, packing = blue, etc.) | Agricultural ERP modules have semantic color meaning; color-coding aids orientation | Directly conflicts with the "emerald is identity, not decoration" principle from DESIGN.md. Multiple accent colors destroy the Supabase aesthetic immediately. Requires rethinking the entire token system. | Use icon shape, text labels, and sidebar section grouping for module navigation; keep green as the single accent |
| Dark-only mode (skip light theme) | Supabase itself is dark-native; light theme requires extra work | ERP users work in bright environments (offices, warehouses, packing facilities). Forcing dark-only limits adoption. Light theme is already 50% specced in DESIGN.md. | Build both; default to system preference |
| Inline `style` overrides per component | Quick local fixes for specific components | Breaks the CSS variable system, makes theme switching unreliable, defeats the point of semantic tokens, and creates maintenance debt across 91 tables' worth of screens | All color decisions go through CSS variables; use `className` with Tailwind utilities if a component-level override is genuinely needed |
| Third-party theme preset libraries (shadcn-theme-generator, etc.) | Faster start | These tools generate a fixed set of tokens for a specific palette. The Supabase palette has 20+ bespoke tokens including alpha-channel HSL values that no generic generator produces. Output would need so much correction it's slower than writing it directly. | Write the CSS variable block directly from DESIGN.md spec; it's ~80 lines and you control every value |
| CSS `@layer` for every Shadcn override | "Best practice" for Tailwind CSS 4 | Shadcn's CSS variables are declared in `@layer base`; overriding them in a different layer causes specificity ordering issues. Override in the same `@layer base` block or outside any layer with `:root {}` and `.dark {}` selectors. | Override in `globals.css` in `@layer base`, matching how Shadcn scaffolds the initial variable block |
| Runtime theme customization UI (user-facing theme picker with multiple palettes) | "Flexibility" for users | This is a multi-tenant ERP; tenant-level branding is a separate, larger project. A per-user color picker within the current theming model is scope creep that requires a completely different token architecture (CSS-in-JS or runtime CSS variable injection). | Ship the two-palette system (dark + light); defer tenant branding to a future milestone |

## Feature Dependencies

```
Geist font installed
    └──required-by──> Typography weight restraint
    └──required-by──> Monospace technical labels (Geist Mono)
    └──required-by──> Negative letter-spacing on card titles

CSS variables: Dark theme palette
    └──required-by──> Sidebar dark theme
    └──required-by──> Form inputs themed
    └──required-by──> Data table themed
    └──required-by──> Border-based depth

CSS variables: Light theme palette
    └──required-by──> Light theme all components
    └──required-by──> Three-way toggle (system preference)

WCAG contrast check: Dark
    └──required-by──> Dark theme palette (verified)

WCAG contrast check: Light
    └──required-by──> Light theme palette (verified)

Pill button variant (CVA)
    └──required-by──> Pill tab variant (same pattern)

HSL-with-alpha supplementary tokens
    └──enables──> Translucent surface effects
    └──enables──> Radix color scale integration
```

### Dependency Notes

- **Geist font required before typography spec is meaningful:** Font size and line-height values in DESIGN.md are calibrated for Geist's metrics. Installing a fallback font and calling the typography "done" will look wrong.
- **Dark theme must precede light theme in build order:** Dark is specced completely in DESIGN.md; light palette has a gap (marked "Active" in PROJECT.md). Build dark first, use it as the reference when speccing light.
- **Pill button variant enables pill tab variant:** Both use the same `border-radius: 9999px` pattern and the same CVA approach; doing them together in one pass is more efficient.
- **HSL-with-alpha tokens are supplementary, not blocking:** Shadcn's semantic tokens are sufficient to ship a working theme. Alpha tokens are an enhancement layer added after base tokens are verified.
- **WCAG contrast check is a gate, not a feature:** Contrast must be verified before any palette is considered "done." It is not optional — it is a launch blocker for both themes.

## MVP Definition

### Launch With (v1)

Minimum viable theme that makes every existing screen look intentionally Supabase-styled.

- [ ] CSS variables: Complete dark theme palette overriding all Shadcn tokens — without this, nothing looks right
- [ ] CSS variables: Complete light theme palette overriding all Shadcn tokens — three-way toggle is broken without it
- [ ] Geist + Geist Mono fonts installed and applied — typography is the most immediately visible change
- [ ] Border-based depth (box-shadow removal on cards/containers) — essential to the Supabase aesthetic
- [ ] Pill button variant added to Button component — single highest-recognition Supabase element
- [ ] Sidebar themed (dark bg, green nav accents, weight-500 links) — most visible chrome
- [ ] Form inputs themed — primary interaction surface in an ERP
- [ ] Data table themed — primary read surface in an ERP
- [ ] WCAG AA contrast verified for both themes — non-negotiable for production
- [ ] No theme flicker on page load (verify next-themes setup is correct) — quality signal

### Add After Validation (v1.x)

- [ ] Pill tab variant — add when core theme is verified stable; low-complexity follow-on
- [ ] HSL-with-alpha supplementary color tokens — enables richer surface layering; add when base palette is finalized
- [ ] Radix color scale integration — adds semantic alert/badge/status colors; defer until a module uses them
- [ ] Monospace technical label utility — add when the first module uses a code/technical label surface

### Future Consideration (v2+)

- [ ] Negative letter-spacing on card titles — subtle detail; defer until main palette work is done and being tested in real modules
- [ ] Typography weight audit across all screens — requires going screen-by-screen; high value but high effort; separate milestone

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| CSS variables: dark palette | HIGH | LOW | P1 |
| CSS variables: light palette | HIGH | MEDIUM | P1 |
| Geist + Geist Mono fonts | HIGH | LOW | P1 |
| Border-based depth (no shadows) | HIGH | LOW | P1 |
| Sidebar themed | HIGH | MEDIUM | P1 |
| Form inputs themed | HIGH | MEDIUM | P1 |
| Data table themed | HIGH | MEDIUM | P1 |
| WCAG contrast check | HIGH | LOW | P1 |
| No theme flicker | HIGH | LOW | P1 |
| Pill button variant | MEDIUM | LOW | P1 |
| Three-way toggle | MEDIUM | LOW | P1 |
| Pill tab variant | MEDIUM | LOW | P2 |
| HSL-with-alpha tokens | MEDIUM | MEDIUM | P2 |
| Radix color scale | MEDIUM | MEDIUM | P2 |
| Monospace technical labels | LOW | LOW | P2 |
| Negative letter-spacing | LOW | LOW | P3 |
| Typography weight audit | HIGH | HIGH | P3 (own milestone) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

This is not a competitive product — it's a design system migration. The "competitors" are other Shadcn-based dark themes and the Supabase reference itself.

| Feature | Default Shadcn Theme | Generic Dark Theme Presets | Supabase Reference | Our Approach |
|---------|---------------------|---------------------------|-------------------|--------------|
| Color depth model | Shadows-based | Shadows-based | Border-based (no shadows) | Border-based, matching Supabase |
| Accent color | Blue (zinc-based) | Varies | Emerald green, used sparingly | Emerald green, same restraint rules |
| Button shape | Rounded (6px) | Rounded | Pill (9999px) primary + 6px secondary | Add pill variant; keep default intact |
| Typography | Inter / system-ui | Varies | Circular/Geist, weight 400 dominant | Geist, weight 400/500 only |
| Dark palette | Zinc grays | Generic dark grays | Near-black (#171717) + precise gray scale | Supabase neutrals mapped to Shadcn tokens |
| Tab indicator | Underline or solid | Varies | Pill-shaped | Pill variant on Tabs component |
| Token architecture | Semantic flat | Semantic flat | Primitive + semantic + alpha | Semantic + supplementary alpha layer |
| WCAG compliance | Verified by Shadcn | Not always checked | Verified | Mandatory gate before shipping |

## Sources

- [Shadcn UI Theming — Official Docs](https://ui.shadcn.com/docs/theming) — HIGH confidence
- [Shadcn UI Dark Mode — Official Docs](https://ui.shadcn.com/docs/dark-mode) — HIGH confidence
- [Tailwind CSS v4 Theme Variables — Official Docs](https://tailwindcss.com/docs/theme) — HIGH confidence
- [Design Tokens That Scale — Tailwind v4 + CSS Variables](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026) — MEDIUM confidence
- [Supabase Design System and UI Library (DeepWiki)](https://deepwiki.com/supabase/supabase/2.5-design-system-and-ui-library) — MEDIUM confidence
- [Dark Mode Design Best Practices 2026](https://kyady.com/en/blog/dark-mode-2026-best-practices-elegant-interfaces) — MEDIUM confidence
- [Complete Accessibility Guide for Dark Mode — WCAG 2.1 AA](https://blog.greeden.me/en/2026/02/23/complete-accessibility-guide-for-dark-mode-and-high-contrast-color-design-contrast-validation-respecting-os-settings-icons-images-and-focus-visibility-wcag-2-1-aa/) — HIGH confidence
- [Fixing Dark Mode FOUC in React — next-themes](https://notanumber.in/blog/fixing-react-dark-mode-flickering) — HIGH confidence
- [Design Token System — Three-tier architecture](https://www.contentful.com/blog/design-token-system/) — HIGH confidence
- [Customizing Shadcn UI Themes Without Breaking Updates](https://medium.com/@sureshdotariya/customizing-shadcn-ui-themes-without-breaking-updates-a3140726ca1e) — MEDIUM confidence

---
*Feature research for: Supabase-inspired dark/light theme — Aloha agricultural ERP*
*Researched: 2026-04-02*
