# Phase 2: Light Theme + Component Theming - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 02-light-theme-component-theming
**Areas discussed:** Light palette strategy, Pill variants, Sidebar theming, Form & table styling

---

## Light Palette Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror Supabase dashboard | Use Supabase Studio/dashboard light theme as reference | ✓ |
| Invert the dark scale | Systematically invert dark neutral scale | |
| Shadcn defaults + green accents | Keep Shadcn light palette, add green tokens | |

**User's choice:** Mirror Supabase dashboard
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Light sidebar in light theme | Match Supabase Studio — sidebar goes light in light mode | ✓ |
| Dark sidebar in both themes | Keep dark sidebar regardless of theme | |
| You decide | Claude picks | |

**User's choice:** Light sidebar in light theme
**Notes:** User corrected initial assumption — Supabase Studio does NOT keep dark sidebar in light mode

| Option | Description | Selected |
|--------|-------------|----------|
| Derive during implementation | Define oklch values directly in CSS | |
| Update DESIGN.md first | Complete light palette spec before CSS | ✓ |
| Both — implement then backfill | Implement then document | |

**User's choice:** Update DESIGN.md first

---

## Pill Variants

| Option | Description | Selected |
|--------|-------------|----------|
| New variant: 'pill' | Add variant to CVA with 9999px radius | ✓ |
| New size: 'pill' | Add as size option, combinable with variants | |
| Both variant + size | Pill variant for CTA + pill size for combinations | |

**User's choice:** New variant: 'pill'
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Override default TabsList styling | Change default tabs to pill shape globally | ✓ |
| Add pill as variant prop | Keep defaults, add variant="pill" option | |
| You decide | Claude picks | |

**User's choice:** Override default TabsList styling
**Notes:** None

---

## Sidebar Theming

| Option | Description | Selected |
|--------|-------------|----------|
| Match Supabase pattern | Lighter green for light, darker for dark | |
| You decide the exact values | Claude researches and picks | ✓ |

**User's choice:** You decide the exact values
**Notes:** User confirmed Supabase uses lighter green in light mode and darker green in dark mode. Claude to research exact values.

| Option | Description | Selected |
|--------|-------------|----------|
| CSS token approach | Add font-medium Tailwind classes to nav links | |
| Global nav link utility | Create reusable utility class | |

**User's choice:** Claude decides (user said "claude decides" for both sidebar questions)

---

## Form & Table Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Studio style | Match Studio input look — subtle border, no shadow | ✓ |
| Just token overrides | Only change CSS token values | |
| You decide | Claude picks | |

**User's choice:** Supabase Studio style
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Token + minimal class changes | Override tokens + add hover/header classes | ✓ |
| Pure CSS token approach | Zero component file changes | |
| You decide | Claude picks | |

**User's choice:** Token + minimal class changes
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Global removal | Remove shadow-xs from all Shadcn components | ✓ |
| Case by case | Review each component individually | |
| CSS override only | Override shadow-xs to none in CSS | |

**User's choice:** Global removal
**Notes:** None

---

## Claude's Discretion

- Exact green oklch values per theme (lighter for light, darker for dark)
- Nav weight-500 application method
- Toast/Sonner theming approach
- Link color token definitions
- Exact light theme token values for all Shadcn semantic variables

## Deferred Ideas

None — discussion stayed within phase scope.
