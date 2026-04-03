# Aloha Supabase Theme

## What This Is

A comprehensive retheme of the Aloha agricultural ERP adopting a Supabase-inspired design system. Dark-mode-native aesthetic with emerald green accents, border-based depth, and geometric typography (Geist/Geist Mono) applied to all Shadcn UI components, plus a matching light theme. Purely visual/CSS layer — no business logic, framework, or library changes.

## Core Value

Every screen in Aloha looks and feels like a premium Supabase-quality product — cohesive, professional, and consistent across both dark and light themes.

## Requirements

### Validated

- ✓ Geist font installed as primary sans-serif via `--font-sans` — v1.0
- ✓ Geist Mono font installed as monospace via `--font-mono` — v1.0
- ✓ All Shadcn semantic CSS tokens overridden with Supabase dark palette (oklch) — v1.0
- ✓ All Shadcn semantic CSS tokens overridden with Supabase light palette (oklch) — v1.0
- ✓ Light theme palette values defined in DESIGN.md — v1.0
- ✓ `suppressHydrationWarning` added to `<html>` element — v1.0
- ✓ Border-based depth system replacing box-shadows — v1.0
- ✓ Supabase green accent tokens defined — v1.0
- ✓ WCAG AA contrast verified for dark theme — v1.0
- ✓ WCAG AA contrast verified for light theme — v1.0
- ✓ No theme flicker (FOUC) on page load — v1.0
- ✓ Sidebar themed with dark background, green accents, weight-500 — v1.0
- ✓ Form inputs themed (text, select, checkbox, radio, textarea) — v1.0
- ✓ Data tables themed (headers, rows, borders, hover) — v1.0
- ✓ Pill button variant (9999px radius) added — v1.0
- ✓ Pill tab indicator added — v1.0
- ✓ Cards and containers use border-defined edges, no shadows — v1.0
- ✓ Links styled per Supabase palette — v1.0
- ✓ Toast notifications (Sonner) themed — v1.0
- ✓ Translucent surface tokens for overlays (oklch-with-alpha) — v1.0
- ✓ Typography weight restraint (400 body, 500 nav/buttons) — v1.0
- ✓ Negative letter-spacing (-0.16px) on card titles — v1.0
- ✓ Monospace technical label utility — v1.0
- ✓ Radix 12-step semantic color scale for alerts/badges — v1.0
- ✓ Supabase neutral gray scale tokens — v1.0

### Active

- [ ] Per-tenant brand color customization (ADV-01)
- [ ] Custom scrollbar styling — progressive enhancement (ADV-02)
- [ ] Smooth CSS transitions on theme toggle button icon (ADV-03)

### Out of Scope

- CSS animations on theme switch — causes FOUC-like flash on SSR navigation
- Per-module color accents — conflicts with "emerald is identity" principle
- Runtime theme customization UI — requires CSS-in-JS architecture change
- Business logic changes — purely visual project
- New components or features — only restyle existing
- Mobile-specific responsive redesign — preserve existing responsive behavior
- Custom icon set — continue using Lucide React

## Context

Shipped v1.0 with 72,698 lines across 527 files modified over 20 days.
Tech stack: Shadcn UI + Tailwind CSS 4 + Radix + next-themes.
CSS architecture: primitives in `:root`, semantics in `:root`/`.dark`, `@theme` uses only `var()` references.
All color values use oklch format. Geist fonts via `@fontsource-variable`.
Design spec in `DESIGN.md` at project root.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Geist over Circular | Circular is proprietary; Geist is free, geometric, similar feel | ✓ Good |
| CSS variables over Tailwind theme | Shadcn already uses CSS variables; minimal migration surface | ✓ Good |
| Border depth over shadows | Core Supabase design principle; reduces visual complexity | ✓ Good |
| Both dark + light themes | ERP users need both; dark-only would limit adoption | ✓ Good |
| @fontsource-variable/geist (not geist npm) | Vite compatible variable font distribution | ✓ Good |
| oklch for all custom tokens | Modern color space with perceptual uniformity | ✓ Good |
| --primary stays neutral, --sidebar-primary gets green | Preserves Shadcn component hierarchy | ✓ Good |
| Split green: darker in light, brighter in dark | Ensures contrast on both backgrounds | ✓ Good |
| Pill variant additive to CVA | Backward compatible, no call-site changes | ✓ Good |
| Tabs global override (no variant) | All instances get pill shape automatically | ✓ Good |
| Semantic colors as CSS vars + @theme entries | Enables Tailwind first-class usage without arbitrary values | ✓ Good |
| Headings use font-normal (400) | Supabase aesthetic: hierarchy via size/tracking, not boldness | ✓ Good |

## Constraints

- **Tech stack**: Shadcn UI + Tailwind CSS 4 + Radix — no new UI libraries
- **Font licensing**: Must use free fonts (Geist is MIT-licensed)
- **Theme toggle**: Must preserve existing next-themes infrastructure
- **Component API**: No breaking changes to component props or usage patterns
- **Accessibility**: Color contrast ratios must meet WCAG AA in both themes

---
*Last updated: 2026-04-02 after v1.0 milestone*
