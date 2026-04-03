# Phase 2: Light Theme + Component Theming - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the Supabase light palette, add pill variants to Button and Tabs, and theme all structural components (sidebar, forms, tables, toasts, links) in Supabase style across both dark and light themes. DESIGN.md light palette spec must be completed before CSS implementation begins.

</domain>

<decisions>
## Implementation Decisions

### Light palette strategy
- **D-01:** Mirror Supabase Studio's dashboard light theme as the reference for all light palette values
- **D-02:** Light sidebar in light theme — matching Supabase Studio behavior (sidebar goes light in light mode, not permanently dark)
- **D-03:** Update DESIGN.md with complete light palette spec before touching any CSS — spec-first approach
- **D-04:** Use different green intensities per theme: lighter green in light mode, darker green in dark mode (matching Supabase's pattern)

### Pill variants
- **D-05:** Add `variant: 'pill'` to Button CVA — new variant with 9999px radius and Supabase CTA styling, separate from existing variants
- **D-06:** Override default TabsList/TabsTrigger to pill shape globally — all tabs in the app get pill styling with rounded-full, no variant prop needed

### Form & table styling
- **D-07:** Form inputs match Supabase Studio style — subtle border, no shadow, adjusted border/focus tokens in CSS with minimal component changes
- **D-08:** Data tables themed via token overrides + minimal class changes — border-defined rows, subtle hover states, no zebra striping
- **D-09:** Global removal of `shadow-xs` from all Shadcn component files (button, input, select, etc.) — consistent with border-depth system, no shadows except focus rings

### Claude's Discretion
- Exact green oklch values per theme (lighter for light mode, darker for dark mode) — research Supabase Studio and pick closest equivalents, document in DESIGN.md
- Nav weight-500 application method — Claude decides how to apply font-weight to sidebar nav links (Tailwind classes vs CSS utility)
- Toast/Sonner theming approach — token overrides to match palette
- Link color token definitions per DESIGN.md link hierarchy (green branded, primary light, secondary, muted)
- Exact light theme token values for all Shadcn semantic variables (--background, --foreground, --card, --muted, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design specification
- `DESIGN.md` — Complete design system spec. S2 (Color Palette & Roles) has dark values; light palette section to be added before implementation. S4 (Component Stylings) defines button, card, tab, link, and nav styling. S6 (Depth & Elevation) defines border-depth system.
- `DESIGN.md` S4 — Component Stylings: pill button spec (9999px, padding, border), tab spec (pill, green active), link color hierarchy, navigation styling

### Current theme infrastructure
- `app/styles/shadcn-ui.css` — Shadcn CSS variable definitions. `:root` block (lines 10-76) has light defaults to override. `.dark` block (lines 78-121) already has Supabase dark palette from Phase 1.
- `app/styles/theme.css` — Tailwind `@theme` block mapping Shadcn variables to Tailwind color tokens
- `app/styles/global.css` — CSS import order, Tailwind setup, base layer styles

### Component files to modify
- `packages/ui/src/shadcn/button.tsx` — CVA variants; add pill variant, remove shadow-xs from default/destructive/outline/secondary
- `packages/ui/src/shadcn/tabs.tsx` — TabsList/TabsTrigger; change to pill shape globally, remove shadow-xs
- `packages/ui/src/shadcn/input.tsx` — Remove shadow-xs, adjust border/focus styling
- `app/components/sidebar/` — 7 sidebar components for nav weight and light theme sidebar tokens

### Requirements
- `.planning/REQUIREMENTS.md` — FOUND-04, FOUND-05, FOUND-10, FOUND-11, COMP-01 through COMP-08 define acceptance criteria for this phase

### Phase 1 context
- `.planning/phases/01-foundation-dark-theme/01-CONTEXT.md` — Prior decisions: oklch format (D-01), --primary stays neutral (D-08), --sidebar-primary gets green (D-09), shadow removal via CSS tokens (D-10-D-12)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/styles/shadcn-ui.css`: `:root` block ready for light palette override — same pattern used for `.dark` in Phase 1
- `packages/ui/src/shadcn/button.tsx`: CVA already structured for adding new variants — just extend the `variants.variant` object
- `packages/ui/src/shadcn/tabs.tsx`: TabsList/TabsTrigger classes can be modified in-place for pill styling
- Supabase green tokens (`--supabase-green`, `--supabase-green-link`, `--supabase-green-border`) already defined in `:root` — available for both themes
- `--sidebar-*` tokens already wired in both `:root` and `.dark` blocks

### Established Patterns
- **Three-layer CSS architecture**: `shadcn-ui.css` (primitives) → `theme.css` (@theme mapping) → components (Tailwind classes). Light palette follows same pattern as dark.
- **oklch format**: All custom tokens use oklch() — Phase 1 established this; light palette continues it
- **Token-driven theming**: Components consume CSS variables via Tailwind semantic classes (bg-background, text-foreground, etc.) — changing tokens automatically updates all components
- **CVA for variants**: Button uses class-variance-authority — pill variant follows existing pattern

### Integration Points
- `app/styles/shadcn-ui.css:10-76` — `:root` block where all light palette overrides go
- `app/styles/shadcn-ui.css:68-76` — `--sidebar-*` tokens in `:root` need light theme values
- `packages/ui/src/shadcn/` — All Shadcn components where shadow-xs needs global removal
- `app/components/sidebar/navigation-menu.tsx` — Nav link elements for weight-500 application

</code_context>

<specifics>
## Specific Ideas

- Supabase Studio's actual dashboard is the visual target for both themes — not the marketing site
- Supabase uses lighter green in light mode and darker green in dark mode — per-theme green intensity is intentional
- Supabase Studio has a light sidebar in light mode (corrected from initial assumption of dark sidebar in both)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-light-theme-component-theming*
*Context gathered: 2026-04-02*
