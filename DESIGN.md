# Design System: Aloha

## 1. Visual Theme & Atmosphere

Aloha is a polished farm-operations ERP. The design system is **light-first** — a soft slate-100 canvas (`#f1f5f9`) with clean white cards, subtle slate borders, and quiet shadows that give just enough depth to feel modern without pulling attention away from data. It is built for office supervisors at a desktop and field supervisors on a laptop or tablet in a bright outdoor environment, so the default mode favors high luminance, calm neutrals, and unambiguous contrast.

The brand moment is a **green gradient** — `linear-gradient(135deg, #22c55e, #059669)` (green-500 → emerald-600) — reserved for the primary CTA, the active sidebar pill, the Aloha logo wordmark, and the top-navbar brand surface. Everywhere else the palette stays disciplined slate/white with sparing green-50/green-100 washes for hover and active states. The effect is "fresh farm" without ever feeling like a marketing site.

Typography is **Inter Variable** at a 16px base with weights 400/500/600 for prose. No display-weight drama for headings — hierarchy comes from size, not stroke weight. Table/grid column headers are a single deliberate exception: weight 700 substitutes for the sort/filter UI chrome intentionally stripped from AG Grid (see `UI-RULES.md §Tables`). Geist Mono Variable is retained for the occasional code/numeric label. Corners are soft: `--radius = 1rem` (rounded-2xl) is the base, derived sm/md/lg keep Shadcn primitives proportional. Shadows are a soft **slate-900 alpha scale** — generous around floating surfaces (popovers, the sheet/panel), minimal on flat cards.

Dark mode is **hand-authored** against the Kimbie Dark palette — warm earth tones inspired by the Kimbie Dark VS Code theme (Heiko Cavelier). Backgrounds drop to a deep warm brown (`#15100a`) with slightly lifted card surfaces (`#1e1710`) and muted cocoa borders (`#332618`); foreground text is a warm cream (`#d3af86`) and muted copy a softer tan (`#a57a4c`). The Aloha brand moment is preserved intentionally: `--primary`, `--primary-foreground`, `--ring`, and `--gradient-primary` stay at their emerald values (`#4ade80` / green-950 / gradient `#4ade80 → #10b981`) so the brand CTA still reads as Aloha green on the Kimbie warm canvas. Every foundation token pair is re-verified against WCAG AA (4.5:1 normal text, 3:1 UI components); any new miss is documented in §9.1.

**Key characteristics:**
- Light-first, slate-100 canvas (`#f1f5f9`), white cards, slate-200 borders
- Green gradient brand moment (`#22c55e → #059669`) reserved for primary CTA / active pill / brand surfaces
- Inter Variable 16px body, 400/500/600 weights — no bold display headings
- `--radius: 1rem` (rounded-2xl) base; derived sm/md/lg via `calc()`
- Soft slate-900 alpha shadow scale (sm/md/lg/xl/2xl) — not none, not loud
- Hand-authored Kimbie Dark palette (warm `#15100a` / `#1e1710` / `#332618` earth tones, preserved emerald `#4ade80` brand) with WCAG AA re-verified pairs — see §9
- Geist Mono Variable retained for `--font-mono`
- Legacy scaffolding tokens (glass surface, slate alpha wash, prior-era brand tokens) are removed wholesale

> **Companion document:** `UI-RULES.md` covers app-wide **behavior and structure** rules (tables, search, filters, detail views, form fields, layout). This file (`DESIGN.md`) covers **tokens** — colors, typography, radius, shadows. Read both when working on UI.

## 2. Color Palette & Roles

### Brand

| Role | Hex | Usage |
|------|-----|-------|
| Primary (light) | `#22c55e` (green-500) | `--primary` solid, `--ring`, active chip fill |
| Primary (dark)  | `#4ade80` (green-400) | `--primary` solid in `.dark`, focus rings, sidebar pill |
| Gradient start (light) | `#22c55e` (green-500) | `--gradient-primary` stop 0 |
| Gradient end (light)   | `#059669` (emerald-600) | `--gradient-primary` stop 100 |
| Gradient start (dark)  | `#4ade80` (green-400) | `--gradient-primary` stop 0 in `.dark` |
| Gradient end (dark)    | `#10b981` (emerald-500) | `--gradient-primary` stop 100 in `.dark` |
| Primary gradient | `linear-gradient(135deg, #22c55e, #059669)` | Signature CTA / logo / active-item surface |

The gradient is exposed as a dedicated CSS custom property `--gradient-primary` so Phase 8 button work can write `background: var(--gradient-primary)` without duplicating the formula. **`--primary` itself stays solid green-500** (light) / green-400 (dark) — that preserves compatibility with every Shadcn primitive that expects a single color token for `bg-primary` / `text-primary` / `ring-primary`.

### Neutrals — Slate scale

Every neutral in Aloha maps to the Tailwind `slate` scale (hex values throughout — no wide-gamut color specifiers).

| Token | Hex | Typical role |
|-------|-----|--------------|
| slate-50  | `#f8fafc` | `--foreground` (dark), lightest elevated surface |
| slate-100 | `#f1f5f9` | `--background` (light), quiet muted surface |
| slate-200 | `#e2e8f0` | `--border` (light), sidebar right edge |
| slate-300 | `#cbd5e1` | `--input` border (light), scrollbar thumb |
| slate-400 | `#94a3b8` | `--muted-foreground` (dark), scrollbar hover |
| slate-500 | `#64748b` | `--muted-foreground` (light), secondary copy |
| slate-600 | `#475569` | `--sidebar-foreground` (light), strong copy |
| slate-700 | `#334155` | `--secondary`/`--accent` (dark), `--border` (dark) |
| slate-800 | `#1e293b` | `--card` (dark), `--muted` (dark), `--sidebar-border` (dark) |
| slate-900 | `#0f172a` | `--foreground` (light), `--background` (dark) |

> **Dark-mode exception:** As of the Kimbie Dark adoption (quick-260420-kd0), the `.dark` foundation tokens use a Kimbie warm-earth palette instead of the slate scale. The slate hex values in the table above apply to `:root` (light mode) only. See the "Dark mode foundation tokens" table below for the Kimbie values.

### Semantic colors (bg/fg/border triples)

Light values are Tailwind default 50/600/100 triples. Dark values use 14-18% alpha washes of the Kimbie accent hue plus a brightened foreground. The red foreground is held at Tailwind red-400 (`#f87171`) instead of Kimbie's own `#dc3958` because `#dc3958` on its self-wash is low-contrast; all others use the Kimbie accent directly. The green foreground brightens Kimbie olive (`#889b4a → #a7c05a`) for legibility on the warm canvas.

| Semantic | Light bg | Light fg | Light border | Dark bg | Dark fg | Dark border |
|----------|----------|----------|--------------|---------|---------|-------------|
| red      | `#fef2f2` | `#dc2626` | `#fee2e2` | `rgb(220 57 88 / 0.15)` | `#f87171` | `rgb(220 57 88 / 0.30)` |
| amber    | `#fffbeb` | `#d97706` | `#fef3c7` | `rgb(247 154 50 / 0.15)` | `#f79a32` | `rgb(247 154 50 / 0.30)` |
| green    | `#f0fdf4` | `#16a34a` | `#dcfce7` | `rgb(136 155 74 / 0.18)` | `#a7c05a` | `rgb(136 155 74 / 0.35)` |
| blue     | `#eff6ff` | `#2563eb` | `#dbeafe` | `rgb(81 189 178 / 0.14)` | `#51bdb2` | `rgb(81 189 178 / 0.30)` |

> **Scope:** These semantic tokens are used for alerts, toasts, and inline form errors. Status values rendered in tables are always neutral plain text — see `UI-RULES.md §Tables`.

### Light mode foundation tokens

| Token | Value | Notes |
|-------|-------|-------|
| `--background` | `#f1f5f9` | slate-100 — canonical page canvas (matches prototype `body`) |
| `--foreground` | `#0f172a` | slate-900 body text |
| `--card` | `#ffffff` | pure white cards |
| `--card-foreground` | `#0f172a` | slate-900 |
| `--popover` | `#ffffff` | pure white popovers / dropdowns |
| `--popover-foreground` | `#0f172a` | slate-900 |
| `--primary` | `#22c55e` | green-500 solid (see §Gradient for CTA surface) |
| `--primary-foreground` | `#ffffff` | white label (see caveat §9) |
| `--secondary` | `#f1f5f9` | slate-100 |
| `--secondary-foreground` | `#0f172a` | slate-900 |
| `--muted` | `#f1f5f9` | slate-100 |
| `--muted-foreground` | `#64748b` | slate-500 |
| `--accent` | `#f1f5f9` | slate-100 |
| `--accent-foreground` | `#0f172a` | slate-900 |
| `--destructive` | `#dc2626` | red-600 |
| `--destructive-foreground` | `#ffffff` | white |
| `--border` | `#e2e8f0` | slate-200 |
| `--input` | `#cbd5e1` | slate-300 |
| `--ring` | `#22c55e` | green-500 |
| `--radius` | `1rem` | rounded-2xl base |
| `--gradient-primary` | `linear-gradient(135deg, #22c55e, #059669)` | signature brand gradient |
| `--sidebar-background` | `#ffffff` | white sidebar on slate-100 canvas |
| `--sidebar-foreground` | `#475569` | slate-600 |
| `--sidebar-primary` | `#22c55e` | green-500 |
| `--sidebar-primary-foreground` | `#ffffff` | white |
| `--sidebar-accent` | `#f0fdf4` | green-50 — hover/active wash |
| `--sidebar-accent-foreground` | `#15803d` | green-700 |
| `--sidebar-border` | `#e2e8f0` | slate-200 |
| `--sidebar-ring` | `#22c55e` | green-500 |

### Dark mode foundation tokens

Adopted from the Kimbie Dark palette (quick-260420-kd0). Rows tagged **PRESERVED** are intentionally held at their Aloha brand values across the palette swap — they are not repalettized so the brand CTA still reads as emerald on the Kimbie warm canvas.

| Token | Value | Notes |
|-------|-------|-------|
| `--background` | `#15100a` | Kimbie deep warm brown — canonical page canvas |
| `--foreground` | `#d3af86` | Kimbie cream body text |
| `--card` | `#1e1710` | Slightly lifted warm surface |
| `--card-foreground` | `#d3af86` | Kimbie cream |
| `--popover` | `#1e1710` | Matches `--card` |
| `--popover-foreground` | `#d3af86` | Kimbie cream |
| `--primary` | `#4ade80` | green-400 — **PRESERVED** brand emerald |
| `--primary-foreground` | `#052e16` | green-950 — **PRESERVED** |
| `--secondary` | `#332618` | Kimbie muted cocoa — elevated secondary surface |
| `--secondary-foreground` | `#d3af86` | Kimbie cream |
| `--muted` | `#1e1710` | Matches `--card` |
| `--muted-foreground` | `#a57a4c` | Kimbie tan — secondary copy |
| `--accent` | `#332618` | Kimbie muted cocoa |
| `--accent-foreground` | `#d3af86` | Kimbie cream |
| `--destructive` | `#dc3958` | Kimbie red |
| `--destructive-foreground` | `#ffffff` | White |
| `--border` | `#332618` | Kimbie muted cocoa hairline |
| `--input` | `#4a3620` | Kimbie border-strong — input outline |
| `--ring` | `#4ade80` | green-400 — **PRESERVED** focus ring |
| `--gradient-primary` | `linear-gradient(135deg, #4ade80, #10b981)` | **PRESERVED** brand gradient |
| `--sidebar-background` | `#15100a` | Kimbie deep warm brown — cohesive with canvas |
| `--sidebar-foreground` | `#a57a4c` | Kimbie tan |
| `--sidebar-primary` | `#4ade80` | green-400 — **PRESERVED** |
| `--sidebar-primary-foreground` | `#052e16` | green-950 — **PRESERVED** |
| `--sidebar-accent` | `#332618` | Kimbie muted cocoa — hover/active wash |
| `--sidebar-accent-foreground` | `#d3af86` | Kimbie cream |
| `--sidebar-border` | `#1e1710` | Matches `--card` — subtle lift edge |
| `--sidebar-ring` | `#4ade80` | green-400 — **PRESERVED** |

> **Chart tokens (dark mode):** `--chart-1: #4ade80` (emerald), `--chart-2: #10b981` (emerald-500, gradient end), `--chart-3: #51bdb2` (Kimbie teal), `--chart-4: #f79a32` (Kimbie yellow-orange), `--chart-5: #d3af86` (Kimbie cream). Repalettized so chart surfaces stay native to the Kimbie canvas instead of snapping back to the slate-cool defaults. Light-mode chart tokens are unchanged.

> **AG Grid dark theme exception:** AG Grid v35's `themeQuartz.withParams()` does not resolve CSS vars, so its dark theme hex values are hardcoded in `app/components/ag-grid/ag-grid-theme.ts` and asserted by a Vitest test. quick-260420-kd0 intentionally did NOT sync those values, so AG Grid tables continue to render slate-based chrome (`#1e293b` / `#0f172a` / `#334155`) while the rest of the app renders Kimbie warm earth. Tracked as follow-up `kd0-aggrid-dark-sync`. See `UI-RULES.md §Tables > Table theme` for the companion note.

## 3. Typography

### Font families

- **Primary (body + heading):** `'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Monospace:** `'Geist Mono Variable', 'Source Code Pro', Menlo, monospace` (retained)

Inter is loaded via `@fontsource-variable/inter` (self-hosted woff2, full `wght` axis). Geist Mono remains via `@fontsource-variable/geist-mono`.

### Scale

Base size is 16px (`html { font-size: 16px }`). Weights: 400 (body), 500 (nav / buttons / labels), 600 (section headings), 700 (table/grid headers — see `UI-RULES.md §Tables`).

| Role | Size | Weight | Line height | Notes |
|------|------|--------|-------------|-------|
| Display | 3rem (48px) | 600 | 1.15 | Dashboard hero stat — rarely used |
| H1      | 2rem (32px) | 600 | 1.2  | Page title |
| H2      | 1.5rem (24px) | 600 | 1.25 | Section heading |
| H3      | 1.25rem (20px) | 600 | 1.3 | Sub-section |
| Body    | 1rem (16px) | 400 | 1.5 | Default |
| Small   | 0.875rem (14px) | 400 | 1.5 | Secondary copy, captions, table cells |
| Label   | 0.875rem (14px) | 500 | 1.4 | Form labels, nav items, button labels |
| Mono    | 0.875rem (14px) | 400 | 1.5 | Numeric / code snippets (Geist Mono Variable) |
| Table header | 0.8125rem (13px) | 700 | 1.2 | AG Grid column headers — flat emphasis substitutes for stripped sort/filter chrome |

## 4. Radius

Base `--radius: 1rem` (16px — Tailwind's `rounded-2xl`). Derived values preserve the Shadcn primitive contract:

| Token | Formula | Resolved |
|-------|---------|----------|
| `--radius-sm` | `calc(var(--radius) - 4px)` | 12px |
| `--radius-md` | `calc(var(--radius) - 2px)` | 14px |
| `--radius-lg` | `var(--radius)`             | 16px |

`rounded-2xl` remains the go-to explicit utility for cards and primary buttons in Phase 8.

## 5. Shadows

Phase 7 exposes a soft slate-900 alpha shadow scale. Light mode uses `rgb(15 23 42 / ...)` (slate-900 alpha) for a subtle bluish-cool shadow that sits well on the slate-100 canvas. Dark mode drops to `rgb(0 0 0 / ...)` at higher alpha so shadows remain visible on slate-900 surfaces without washing out.

Light:

```css
--shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.05);
--shadow:    0 1px 3px 0 rgb(15 23 42 / 0.10), 0 1px 2px -1px rgb(15 23 42 / 0.10);
--shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.10), 0 2px 4px -2px rgb(15 23 42 / 0.10);
--shadow-lg: 0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.10);
--shadow-xl: 0 20px 25px -5px rgb(15 23 42 / 0.10), 0 8px 10px -6px rgb(15 23 42 / 0.10);
--shadow-2xl: 0 25px 50px -12px rgb(15 23 42 / 0.25);
```

Dark:

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.30);
--shadow:    0 1px 3px 0 rgb(0 0 0 / 0.40), 0 1px 2px -1px rgb(0 0 0 / 0.40);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.40), 0 2px 4px -2px rgb(0 0 0 / 0.40);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.45), 0 4px 6px -4px rgb(0 0 0 / 0.45);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.50), 0 8px 10px -6px rgb(0 0 0 / 0.50);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.60);
```

> These tokens are not added to `shadcn-ui.css` in Plan 7-01 — they arrive in Plan 7-02 (global.css unlock + theme.css mapping). This section documents the target values so Plan 7-02 has a single source of truth to copy from.

The green-tinted primary-button glow (`shadow-lg shadow-green-500/25`) stays a Phase 8 button-level utility, **not** a global token.

## 6. Component Stylings

Primitive restyle (Button, Card, Input, Textarea, Select, Badge, Avatar, Sheet) is **Phase 8** — this document is the token foundation only. Two notes carry forward:

- **Primary CTA signature:** Phase 8 will apply `background: var(--gradient-primary)` plus `shadow-lg shadow-green-500/25` directly on the `Button` primary variant. This is a button-level pattern, not a global `--primary` override. The solid `--primary` stays green-500 so `ring-primary`, `border-primary`, `text-primary`, and badge primary styles keep working untouched.
- **Active sidebar pill:** Same gradient + shadow applies to the active module pill (Phase 9).

## 7. Layout Principles

Hints carried into Phase 9 (shell) and Phase 10 (grid):

- **Top navbar:** 72px tall, gradient Aloha logo left, command-palette-style search center, avatar right.
- **Sidebar:** 220px expanded / 68px collapsed, accordion sub-items, `PanelLeft` toggle. White sidebar surface in light, slate-900 in dark.
- **Inputs / buttons:** `py-3` vertical padding — generous, touch-friendly for field users.
- **Table rows (AG Grid):** `py-4` equivalent row height — comfortable scan density.
- **Mobile:** Full-screen drawer sliding from left with backdrop (Framer Motion) replaces sidebar below `md`.

## 8. Dark Mode

Dark is **hand-authored** against the Kimbie Dark palette, not runtime-derived. Derivation rules applied when writing the `.dark` block (emerald brand tokens are explicitly preserved — see the **PRESERVED** rows below):

| `:root` role | `.dark` adaptation |
|--------------|--------------------|
| Backgrounds (slate-50/100 canvas, white cards) | Kimbie deep warm brown (`#15100a`) canvas, warm cocoa cards (`#1e1710`) |
| Body text (slate-900) | Kimbie cream (`#d3af86`) |
| Muted text (slate-500) | Kimbie tan (`#a57a4c`) |
| Primary (green-500 solid) | **PRESERVED** green-400 `#4ade80` — brand identity held across palette swap |
| Primary gradient (`#22c55e → #059669`) | **PRESERVED** `#4ade80 → #10b981` |
| Primary foreground (white) | **PRESERVED** green-950 (`#052e16`) |
| Borders (slate-200/300) | Kimbie muted cocoa `#332618`, border-strong `#4a3620` |
| Sidebar surfaces (white, green-50 accent) | Kimbie canvas `#15100a`, muted cocoa accent `#332618`, cream accent-fg `#d3af86` |
| Destructive (red-600) | Kimbie red `#dc3958` |
| Semantic bg tiles (e.g. red-50) | 14-18% alpha washes of Kimbie accent hues (see §2 Semantic colors) |

Every foundation pair is re-verified against WCAG AA — see §9 for the recomputed Kimbie ratios.

## 9. WCAG AA Verification

Foundation token pairs are verified against WCAG 2.2 AA thresholds: 4.5:1 for normal body text, 3:1 for large text and UI component boundaries. Full shell + AG Grid contrast pass is deferred to Phase 10.

Verified via `node scripts/verify-wcag.mjs` on 2026-04-10. Dark-mode rows recomputed 2026-04-20 against the Kimbie Dark palette (quick-260420-kd0); light rows unchanged. 18 PASS / 6 FAIL (same count as pre-Kimbie — no PASS↔FAIL flips; the only remaining dark failure is `border/background` at 1.29:1, same decorative-hairline caveat as the prior 1.72:1 slate value, §9.1 item 3). See §9.1 Failure Register for open items escalated to the human reviewer.

| Pair | Theme | Ratio | Min | Status |
|------|-------|-------|-----|--------|
| foreground/background | light | 16.30:1 | 4.5:1 | PASS |
| card-foreground/card | light | 17.85:1 | 4.5:1 | PASS |
| popover-foreground/popover | light | 17.85:1 | 4.5:1 | PASS |
| primary-foreground/primary | light | 2.28:1 | 3.0:1 | FAIL |
| secondary-foreground/secondary | light | 16.30:1 | 4.5:1 | PASS |
| muted-foreground/background | light | 4.34:1 | 4.5:1 | FAIL |
| muted-foreground/muted | light | 4.34:1 | 4.5:1 | FAIL |
| accent-foreground/accent | light | 16.30:1 | 4.5:1 | PASS |
| destructive-foreground/destructive | light | 4.83:1 | 3.0:1 | PASS |
| border/background | light | 1.13:1 | 3.0:1 | FAIL |
| ring/background | light | 2.08:1 | 3.0:1 | FAIL |
| sidebar-foreground/sidebar-background | light | 7.58:1 | 4.5:1 | PASS |
| foreground/background | dark | 9.23:1 | 4.5:1 | PASS |
| card-foreground/card | dark | 8.64:1 | 4.5:1 | PASS |
| popover-foreground/popover | dark | 8.64:1 | 4.5:1 | PASS |
| primary-foreground/primary | dark | 8.55:1 | 3.0:1 | PASS |
| secondary-foreground/secondary | dark | 7.16:1 | 4.5:1 | PASS |
| muted-foreground/background | dark | 4.94:1 | 4.5:1 | PASS |
| muted-foreground/muted | dark | 4.63:1 | 4.5:1 | PASS |
| accent-foreground/accent | dark | 7.16:1 | 4.5:1 | PASS |
| destructive-foreground/destructive | dark | 4.40:1 | 3.0:1 | PASS |
| border/background | dark | 1.29:1 | 3.0:1 | FAIL |
| ring/background | dark | 10.85:1 | 3.0:1 | PASS |
| sidebar-foreground/sidebar-background | dark | 4.94:1 | 4.5:1 | PASS |

> **Kimbie adoption note (2026-04-20, quick-260420-kd0):** All dark-mode rows above were recomputed after the Kimbie Dark palette swap. The `--primary` / `--primary-foreground` / `--ring` pairs are UNCHANGED because those tokens were preserved. Net delta vs. the prior slate-based dark mode: the `muted-foreground/background` pair tightens from 6.96:1 to 4.94:1 (still passing but much closer to the 4.5:1 threshold — flagged for monitoring), `muted-foreground/muted` tightens from 5.71:1 to 4.63:1 (tight pass), `sidebar-foreground/sidebar-background` tightens from 12.02:1 to 4.94:1 (was slate-300 on slate-900 — now Kimbie tan on the canvas, still passing but much tighter — flagged for monitoring), and `border/background` continues to fail 3:1 (prior 1.72:1 → new 1.29:1), carrying the existing §9.1 item 3 caveat (decorative hairline exemption under WCAG 1.4.11). No new hard failures introduced. Ratios computed via `scripts/verify-wcag.mjs` formula (wcag-contrast package, WCAG 2.x relative luminance).

### 9.1 Failure Register (escalated to human review)

Six assertions flagged. Phase 7 does NOT silently retune palette values to clear them — any change requires explicit human approval because the palette was locked in Plan 7-01 against the prototype and the research doc.

1. **`primary-foreground/primary` light — 2.28:1 (needs 3.0:1)**
   White (`#ffffff`) on green-500 (`#22c55e`). Research A1 estimated ~2.75:1; actual is lower. Per D-14 Option C, the solid `--primary` is used as a color-of-record for rings/badges/borders (all of which fail independently — see pairs 10/11) and the interactive primary button face uses the **gradient** (green-500 → emerald-600), whose effective luminance is darker than green-500 alone. White button labels on the gradient are the real user-visible surface and should be re-measured in Phase 8 against the gradient midpoint, not against the solid token. Open decision: either (a) darken `--primary` to emerald-600 `#059669` (clears 3:1, changes brand feel), (b) switch `--primary-foreground` to a dark green (e.g. green-950 `#052e16` which already works in dark), or (c) accept that the solid `--primary` token is for UI decoration only and that text-on-primary rendering is always via the gradient button variant. Dark mode passes comfortably (8.55:1).

2. **`muted-foreground/background` and `muted-foreground/muted` light — 4.34:1 (needs 4.5:1)**
   Slate-500 (`#64748b`) on slate-100 (`#f1f5f9`). Near-miss body-text failure (0.16 short). Options: darken `--muted-foreground` to slate-600 `#475569` (clears 7+:1 but changes "muted" feel), or accept the 4.34:1 miss for Phase 7 and revisit when Phase 8 touches form labels. Dark mode still passes post-Kimbie (4.94:1 / 4.63:1 on the Kimbie tan `#a57a4c`) but both pairs are now tight passes within 0.5 of the 4.5:1 threshold — flagged for monitoring.

3. **`border/background` light — 1.13:1 and dark — 1.29:1 (needs 3.0:1)**
   Slate-200 on slate-100 (light); post-Kimbie (quick-260420-kd0) the dark pair is Kimbie muted cocoa `#332618` on deep warm brown `#15100a` at 1.29:1 (was slate-700 on slate-900 at 1.72:1). WCAG 1.4.11 requires 3:1 for UI components whose presence must be perceivable to understand the UI — decorative hairline borders on cards are generally exempt because they are not the only affordance indicating a card. However, if borders carry semantic weight (e.g., input field outlines), they need 3:1. The threshold was set to 3.0 in Plan 7-03 because the plan author wanted to catch any hidden reliance on borders as the sole affordance. Recommendation: reclassify these as decorative (drop to informational in the script) once Phase 8 confirms inputs do not rely solely on `--border` for affordance, OR bump `--border` to slate-300 (light) / Kimbie border-strong `#4a3620` (dark).

4. **`ring/background` light — 2.08:1 (needs 3.0:1)**
   Green-500 (`#22c55e`) on slate-100 (`#f1f5f9`). The focus ring is a real UI component (WCAG 2.4.7 visible focus) and must meet 3:1. This is a genuine failure that needs a palette tweak. Options: darken `--ring` to emerald-600 `#059669` (clears 3:1), add a slate-900 outer halo ring around the green inner ring (composite technique), or accept a brighter green like `#16a34a` (green-600). Dark still passes comfortably post-Kimbie (10.85:1, was 10.25:1) — green-400 on the darker Kimbie canvas `#15100a` is marginally higher than on slate-900.

Plan 7-03 exits with 6 WCAG failures and is marked **PLAN COMPLETE WITH WARNINGS**. Resolution is a Phase 8 decision point.

### `--primary-foreground` caveat (Option C)

White (`#ffffff`) on green-500 (`#22c55e`) was estimated at ~2.75:1 in research; the measured value is 2.28:1. This falls below both the 4.5:1 body-text threshold and the 3:1 UI threshold. Aloha's Option C resolution:

- The solid `--primary` (`#22c55e` light / `#4ade80` dark) is the color-of-record for rings, focus outlines, badges, chips, and borders — usages that only need to satisfy the 3:1 UI-component threshold. (Note: the light `--ring` and `--border` derived from `--primary`/slate-200 still fail — see §9.1.)
- The interactive **primary button face uses the gradient** (`var(--gradient-primary)`), whose effective background luminance is darker than green-500 alone. White button labels on the gradient should re-measure against the gradient midpoint and not the solid token — Phase 8 captures this explicitly.
- The foundation WCAG scope evaluates the `--primary`/`--primary-foreground` pair at the **3:1 UI threshold**, not 4.5:1 body text, because no body text renders on `--primary` in the Aloha design.

Dark mode clears this pair at 8.55:1. The light-mode FAIL is tracked in §9.1 item 1 for Phase 8 resolution.

## 10. Do's and Don'ts

### Do

- Use the slate-100 canvas (`#f1f5f9`) as the default page background in light mode.
- Use the green gradient (`var(--gradient-primary)`) **only** on the primary CTA, the Aloha logo wordmark, the active sidebar pill, and the brand surface of the top navbar.
- Keep `--primary` solid (green-500 / green-400) so Shadcn primitives that expect a single color token keep working.
- Use soft shadows (`shadow-sm` / `shadow` / `shadow-md`) on cards and floating surfaces; reserve `shadow-lg` / `shadow-xl` for popovers and the side panel.
- Use Inter Variable at weight 400 for body text and weight 500 for labels / buttons / nav items.
- Keep dark mode hand-authored — when adjusting a light value, re-check its dark counterpart in the table above, don't algorithmically derive it.

### Don't

- Don't paint large surfaces bold green. The gradient is a moment, not a wash — no full-bleed green sections, no green sidebars, no green cards.
- Don't apply `shadow-2xl` to interactive elements. That scale is reserved for modal / backdrop elevation.
- Don't use bold (700) for display headings — the design uses 600 as the top weight for prose hierarchy and relies on size. Table/grid column headers are the sole exception: 700 substitutes for the sort/filter chrome intentionally stripped from AG Grid (see `UI-RULES.md §Tables`).
- Don't reintroduce legacy scaffolding tokens (glass-surface, slate-alpha-wash, prior-era brand tokens). They are deleted; any component still consuming them should be rewritten to the Aloha equivalents.
- Don't specify neutral colors with wide-gamut specifiers. Aloha uses hex values throughout to match the prototype exactly.
- Don't add new top-level color scales (teal, violet, pink, etc.) to `@theme` during Phase 7. New accents belong to a future milestone, not the foundation retheme.
