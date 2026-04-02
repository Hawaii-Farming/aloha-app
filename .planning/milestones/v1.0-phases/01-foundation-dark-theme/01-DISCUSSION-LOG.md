# Phase 1: Foundation + Dark Theme - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 01-Foundation + Dark Theme
**Mode:** auto (all decisions auto-selected)
**Areas discussed:** Token format, Font installation, Green accent wiring, Shadow removal strategy

---

## Token Format

| Option | Description | Selected |
|--------|-------------|----------|
| oklch | Native to Tailwind CSS 4, already in use in shadcn-ui.css | :heavy_check_mark: |
| HSL with alpha | Matches DESIGN.md Supabase spec literally | |
| Hex | Simplest but no alpha support | |

**User's choice:** oklch (auto-selected — recommended default)
**Notes:** Existing codebase already uses oklch for custom values in shadcn-ui.css. Tailwind 4 processes oklch natively. DESIGN.md hex values will be converted.

---

## Font Installation

| Option | Description | Selected |
|--------|-------------|----------|
| @fontsource-variable packages | Vite-compatible, self-hosted, tree-shakeable | :heavy_check_mark: |
| CDN (Google Fonts) | No package install, but external dependency | |
| Local font files in public/ | Full control, no package dependency | |

**User's choice:** @fontsource-variable packages (auto-selected — pre-decided in STATE.md)
**Notes:** STATE.md already recorded this decision: "Use @fontsource-variable/geist and @fontsource-variable/geist-mono — NOT the geist npm package (Vite incompatible)"

---

## Green Accent Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Separate --supabase-green tokens | Keep --primary neutral, add green as supplementary tokens | :heavy_check_mark: |
| Replace --primary with green | Green becomes the primary color across all components | |
| Green as --accent only | Override --accent token with green | |

**User's choice:** Separate tokens (auto-selected — recommended default)
**Notes:** DESIGN.md specifies green as identity marker used sparingly, not as primary UI color. Sidebar primary accent will use green; general --primary stays neutral.

---

## Shadow Removal Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| CSS variable overrides + border depth | Override at token level, depth via borders | :heavy_check_mark: |
| Global box-shadow: none reset | Blanket shadow removal in base layer | |
| Per-component shadow removal | Find and remove shadow utilities individually | |

**User's choice:** CSS variable overrides + border depth (auto-selected — recommended default)
**Notes:** Shadcn components already consume CSS variables. Overriding tokens gives clean separation. Focus state shadows retained per DESIGN.md.

---

## Claude's Discretion

- Exact oklch conversion values for hex/HSL colors
- Supabase-specific token naming prefix
- CSS file organization for supplementary tokens
- Font fallback chain specifics

## Deferred Ideas

None — all auto-selected decisions stayed within phase scope.
