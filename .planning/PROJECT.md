# Aloha Supabase Theme

## What This Is

A comprehensive retheme of the Aloha agricultural ERP to adopt a Supabase-inspired design system. The work applies a dark-mode-native aesthetic with emerald green accents, border-based depth, and geometric typography (Geist/Geist Mono) to all existing Shadcn UI components — plus adds a matching light theme. This is purely a visual/CSS layer project; no business logic, framework, or library changes.

## Core Value

Every screen in Aloha looks and feels like a premium Supabase-quality product — cohesive, professional, and consistent across both dark and light themes.

## Requirements

### Validated

- ✓ Shadcn UI component library with Radix primitives — existing
- ✓ Tailwind CSS 4 with utility-first styling — existing
- ✓ next-themes dark/light/system theme toggle — existing
- ✓ Existing app layout: sidebar navigation, workspace chrome — existing
- ✓ DESIGN.md dark theme specification — existing

### Active

- [ ] Complete light theme values in DESIGN.md
- [ ] Override Shadcn CSS variables with Supabase dark palette
- [ ] Override Shadcn CSS variables with Supabase light palette
- [ ] Install and configure Geist + Geist Mono fonts
- [ ] Add pill button variant (9999px radius) to Shadcn Button
- [ ] Implement border-based depth system (no box-shadows)
- [ ] Add Supabase color tokens as custom CSS variables (HSL-based with alpha)
- [ ] Theme sidebar navigation (dark background, green accents, weight 500 nav links)
- [ ] Theme cards and containers (border-defined edges, no shadows)
- [ ] Theme tabs (pill shape, green active state)
- [ ] Theme form inputs and controls
- [ ] Theme data tables
- [ ] Ensure theme toggle works correctly between dark/light/system

### Out of Scope

- Business logic changes — this is purely visual
- New components or features — only restyle existing ones
- Framework or library upgrades — current stack maps perfectly
- Marketing/landing pages — ERP workspace screens only
- Mobile-specific responsive redesign — preserve existing responsive behavior
- Custom icon set — continue using Lucide React

## Context

- **Design spec:** `DESIGN.md` at project root — comprehensive Supabase dark theme specification adapted from VoltAgent/awesome-design-md format
- **Current theming:** Shadcn default theme with next-themes toggle already wired up
- **CSS architecture:** Shadcn uses CSS custom properties (--background, --foreground, --primary, etc.) scoped to `:root` and `.dark` — overriding these is the primary mechanism
- **Tailwind CSS 4:** Theme configuration via CSS-first approach, not tailwind.config.js
- **Font substitution:** Geist replaces Supabase's proprietary Circular font; Geist Mono replaces Source Code Pro
- **Codebase mapped:** `.planning/codebase/` contains 7 analysis docs covering architecture, stack, conventions, structure, integrations, testing, and concerns

## Constraints

- **Tech stack**: Shadcn UI + Tailwind CSS 4 + Radix — no new UI libraries
- **Font licensing**: Must use free fonts (Geist is MIT-licensed, good to go)
- **Theme toggle**: Must preserve existing next-themes infrastructure
- **Component API**: No breaking changes to component props or usage patterns
- **Accessibility**: Color contrast ratios must meet WCAG AA in both themes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Geist over Circular | Circular is proprietary; Geist is free, geometric, similar feel | — Pending |
| CSS variables over Tailwind theme | Shadcn already uses CSS variables; minimal migration surface | — Pending |
| Border depth over shadows | Core Supabase design principle; reduces visual complexity | — Pending |
| Both dark + light themes | ERP users need both; dark-only would limit adoption | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after initialization*
