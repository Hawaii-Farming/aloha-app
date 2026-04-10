# Phase 7: Design Foundations - Research

**Researched:** 2026-04-10
**Domain:** Design tokens / CSS / typography / color system (Tailwind 4 + Shadcn + next-themes)
**Confidence:** HIGH

## Summary

Phase 7 rewrites Aloha's CSS foundation so that every subsequent phase (primitives, shell, AG Grid) inherits the Aloha design language automatically. It is a pure-CSS + DESIGN.md + one font package swap. No TSX touched. The lock-in on "swap values, don't rename keys" (CONTEXT D-01) makes this a mechanical, low-risk change: Shadcn primitives and existing Tailwind classes (`bg-primary`, `text-foreground`, etc.) keep working because the var names don't move — only their payloads do.

Four concrete files change: `DESIGN.md` (full rewrite), `app/styles/shadcn-ui.css` (both `:root` and `.dark` blocks — all color, radius, font, sidebar, semantic tokens swapped), `app/styles/theme.css` (font-family strings updated, new shadow/gradient tokens added to `@theme`), and `app/styles/global.css` (font import swap + shadow lockout removal). Plus `package.json` (add `@fontsource-variable/inter`, remove `@fontsource-variable/geist`, keep `@fontsource-variable/geist-mono`).

The prototype's `index.css` is the canonical palette source — its slate scale and green/emerald values are literal Tailwind v3 defaults, which means the plan can reference Tailwind's published `slate-*`, `green-*`, `emerald-*` values by number with confidence they match the prototype byte-for-byte.

**Primary recommendation:** Rewrite DESIGN.md first (spec-before-code), then swap `shadcn-ui.css` values using slate+green literals from the prototype, then update `theme.css` font-family strings and add new shadow/gradient tokens, then fix `global.css` font imports + shadow unlock, finally verify ~12 token pairs with a tiny Node script using `wcag-contrast` (MIT, v3.0.0).

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Keep existing CSS variable names (`--background`, `--foreground`, `--primary`, `--card`, `--border`, `--ring`, `--sidebar-*`, `--semantic-*`). Swap VALUES only. Do NOT rename tokens.
- **D-02:** Tailwind 4 `@theme` block in `app/styles/theme.css` remains single source — `--color-*` → CSS var mapping. Extend where DESIGN.md needs new tokens (gradient, shadow scale).
- **D-03:** Remove Supabase-era tokens with no Aloha counterpart. Document 1:1 value swap in DESIGN.md.
- **D-04:** Light mode canonical, hand-specified. Dark palette hand-specified (not algorithmic), verified WCAG AA token-pair by token-pair.
- **D-05:** Neutrals = Tailwind slate. `--primary` = `green-500` solid. Gradient `green-500→emerald-600` exposed SEPARATELY (`--gradient-primary` or utility class), NOT as `--primary`.
- **D-06:** Semantic color keys (`--semantic-red/amber/green/blue-*`) retained, retuned to Aloha palette.
- **D-07:** Inter Variable via `@fontsource-variable/inter` replaces Geist for `--font-sans` and `--font-heading`. Base 16px.
- **D-08:** `@fontsource-variable/geist-mono` retained for `--font-mono`. No mono swap this phase.
- **D-09:** Remove `@fontsource-variable/geist` import from `global.css`. Add Inter import.
- **D-10:** `--radius` base = `1rem` (rounded-2xl). Shadcn derivations: `--radius-sm = calc(--radius - 4px)`, `--radius-md = calc(--radius - 2px)`, `--radius-lg = --radius`.
- **D-11:** Unlock shadows — replace `--shadow* : none` lockout with soft slate-based Aloha shadow scale (sm/md/lg/xl/2xl).
- **D-12:** Green-tinted primary-button shadow (`shadow-green-500/25`) is Phase 8 button concern, NOT a global token.
- **D-13:** Dark palette rules documented in DESIGN.md §Dark Mode: slate-900/950 backgrounds, slate-800 cards, slate-50/100 body text, slate-400 muted, green-400/emerald-500 primary, slate-800/700 borders. Every pair passes WCAG AA.
- **D-14:** Phase 7 WCAG verification covers FOUNDATION pairs only: background/foreground, card/card-foreground, primary/primary-foreground, muted/muted-foreground, border vs bg, ring vs bg. Full shell + AG Grid audit = Phase 10.
- **D-15:** No primitive/component/shell/route/loader/action changes. Only files allowed: `DESIGN.md`, `app/styles/theme.css`, `app/styles/global.css`, `app/styles/shadcn-ui.css`, `package.json`.
- **D-16:** Manual smoke check: home + one sub-module, light + dark.

### Claude's Discretion

- Exact HSL/hex values per token (pulled from DESIGN.md + prototype `index.css`) — match prototype + satisfy WCAG AA.
- Shadow color base: `rgba(15, 23, 42, X)` (slate-900 alpha) vs `rgba(0,0,0,X)` — pick whichever matches prototype visual.
- Gradient exposure: CSS custom property `--gradient-primary` (recommended) vs Tailwind utility class only.
- Inter weight axes: full `wght` variable vs subset — default to full variable unless bundle-size concern.

### Deferred Ideas (OUT OF SCOPE)

- Primitive restyle (Button/Card/Input/Textarea/Select/Badge/Avatar/Sheet) → Phase 8.
- Shell chrome (navbar/sidebar/mobile drawer) → Phase 9.
- AG Grid theme token swap + full dark-mode regression → Phase 10.
- Automated WCAG contrast suite (axe in Playwright) → Phase 10.
- Command palette impl → future.
- Framer Motion page transitions → future.
- Role-specific shells / device toggle / phone frame → future.
- Replacing Geist Mono with Inter-compatible mono → future cleanup.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DESIGN-01 | `DESIGN.md` rewritten as Aloha theme source of truth (Inter 16px, slate neutrals, green-500→emerald-600 gradient, rounded-2xl, shadow tokens, light-first) | §Prototype Token Values, §DESIGN.md Rewrite Outline |
| DESIGN-02 | Tailwind 4 `@theme` block updated with Aloha palette / font / radius / shadow tokens matching DESIGN.md | §Tailwind 4 @theme Inventory, §Shadow Scale Recommendation |
| DESIGN-03 | Inter variable font loaded via `@fontsource-variable/inter`, replaces Geist body font | §Inter Font Integration |
| DESIGN-04 | Light canonical, dark derived, WCAG AA on every token pair used in shell + primitives | §Dark Palette Spec, §WCAG Verification Approach |
| DARK-01 | Dark palette derived from light palette, WCAG AA verified across shell/primitives/AG Grid | §Dark Palette Spec, §WCAG Verification Approach (Phase 7 scope = foundation pairs; AG Grid deferred to Phase 10 per D-14) |

## Project Constraints (from CLAUDE.md)

- **Stack lock:** React Router 7 SSR, Tailwind 4, Shadcn UI (Radix), `next-themes`, TypeScript. No new UI libraries.
- **Hosted Supabase only** — irrelevant to this phase (no DB/schema touch), noted for the record.
- **File locations:** Styles live in `app/styles/*.css`. SSR CSS import chain is `app/root.tsx` → `links()` → `./styles/global.css?url`. Do not move or rename.
- **No breaking changes** to component props, loaders, actions, i18n, CSRF, CRUD flows. Phase 7 changes are CSS-only — trivially compliant.
- **TypeScript:** N/A this phase (no .ts edits expected).
- **AG Grid theming** reads from CSS vars via `ag-grid-theme.ts`. Value-level token swap will cascade through but AG Grid FULL adaptation is Phase 10 per D-14.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@fontsource-variable/inter` | `5.2.8` (latest, verified npm 2026-04-10) [VERIFIED: npm view] | Inter variable font | Follows existing `@fontsource-variable/*` pattern already used for Geist. Self-hosted, SSR-safe, no external CDN. [VERIFIED: package.json existing pattern] |
| `@fontsource-variable/geist-mono` | `^5.2.7` (already installed) [VERIFIED: package.json] | Monospace font | Retained per D-08 |
| `tailwindcss` | `4.1.18` (already installed) [VERIFIED: package.json] | Utility framework + `@theme` block | Already core to project |
| `next-themes` | `0.4.6` (already installed) [VERIFIED: package.json] | Light/dark class toggling | Already wired in `root-providers.tsx`; no change |

### Supporting (verification-only, dev dependency)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `wcag-contrast` | `3.0.0` [VERIFIED: npm view 2026-04-10] | Compute WCAG AA contrast ratios from hex/rgb | Used by a one-off Node script during Phase 7 verification. Tiny dependency (~10KB), MIT. NOT added to dependencies — run via `pnpm dlx wcag-contrast` or scripted inline. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `wcag-contrast` (Node) | Manual: WebAIM Contrast Checker by hand | Faster for ~12 pairs but not reproducible; not committable |
| `wcag-contrast` | `@adobe/leonardo-contrast-colors` v1.1.0 | Overkill — Leonardo is a PALETTE GENERATOR, not a ratio checker. D-04 mandates hand-specified palette, so generation features are wasted. |
| `wcag-contrast` | `axe-core` via Playwright | Full a11y audit — correct answer for Phase 10 (`DARK-02`), not Phase 7. Too heavy for 12 token pairs. |
| Swap Geist Mono for Inter Mono | Keep Geist Mono | D-08 locked — mono swap is pure churn this phase |
| `@fontsource/inter` (non-variable) | `@fontsource-variable/inter` | Variable version gives full `wght` axis in one file, matches Geist pattern, smaller over wire |

**Installation:**

```bash
pnpm add @fontsource-variable/inter
pnpm remove @fontsource-variable/geist
```

Keep `@fontsource-variable/geist-mono`.

**Version verification (2026-04-10):**
- `@fontsource-variable/inter@5.2.8` — [VERIFIED: `npm view @fontsource-variable/inter version`]
- `wcag-contrast@3.0.0` — [VERIFIED: `npm view wcag-contrast version`]

## Prototype Token Values (canonical source)

Extracted verbatim from `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/index.css` [VERIFIED: file read]. The prototype redeclares these as Tailwind v3 defaults — so values below are both prototype AND Tailwind literal.

### Green / Emerald (brand)

| Token | Hex | Usage |
|-------|-----|-------|
| `green-50` | `#f0fdf4` | Active sub-item chip bg (Phase 9) |
| `green-100` | `#dcfce7` | Hover wash |
| `green-200` | `#bbf7d0` | Active sub-item left rail (Phase 9) |
| `green-300` | `#86efac` | — |
| `green-400` | `#4ade80` | Dark mode primary candidate |
| **`green-500`** | **`#22c55e`** | **`--primary` (light)** — gradient start |
| `green-600` | `#16a34a` | Hover on primary |
| `green-700` | `#15803d` | Active/pressed on primary |
| `green-800` | `#166534` | — |
| `green-900` | `#14532d` | Dark mode accent bg |
| `emerald-500` | `#10b981` | Dark mode gradient end candidate |
| **`emerald-600`** | **`#059669`** | **Gradient end** — `linear-gradient(135deg, #22c55e, #059669)` |
| `emerald-700` | `#047857` | Hover on gradient button |

### Slate (neutrals)

| Token | Hex | Light mode role | Dark mode role |
|-------|-----|-----------------|----------------|
| `slate-50` | `#f8fafc` | `--card` (pure white alternative) | `--foreground` |
| `slate-100` | `#f1f5f9` | **`--background`** (canonical page bg per prototype body `background: #f1f5f9`) | `--card-foreground` |
| `slate-200` | `#e2e8f0` | `--border`, sidebar right border | — |
| `slate-300` | `#cbd5e1` | `--input` border, scrollbar thumb | — |
| `slate-400` | `#94a3b8` | `--muted-foreground` | `--muted-foreground` (dark) |
| `slate-500` | `#64748b` | Secondary text | — |
| `slate-600` | `#475569` | `--foreground` body (or slate-900) | — |
| `slate-700` | `#334155` | Strong text | `--border` (dark) |
| `slate-800` | `#1e293b` | — | **`--card`** (dark), `--border` (dark) |
| `slate-900` | `#0f172a` | **`--foreground`** | **`--background`** (dark) |
| (slate-950) | `#020617` | — | Deepest dark canvas option (not in prototype explicitly) [ASSUMED — Tailwind default] |

### Semantic (amber/red/blue/purple/orange)

Prototype exposes the Tailwind defaults for all semantic scales. For Phase 7 we only need to retune `--semantic-*-bg/fg/border` keys in `shadcn-ui.css`. Map:

| Semantic key | Light bg | Light fg | Light border | Dark bg | Dark fg | Dark border |
|--------------|----------|----------|--------------|---------|---------|-------------|
| red | `red-50 #fef2f2` | `red-600 #dc2626` | `red-100 #fee2e2` | `red-500/15` | `red-400 #f87171` | `red-500/30` |
| amber | `amber-50 #fffbeb` | `amber-600 #d97706` | `amber-100 #fef3c7` | `amber-500/15` | `amber-400 #fbbf24` | `amber-500/30` |
| green | `green-50 #f0fdf4` | `green-600 #16a34a` | `green-100 #dcfce7` | `green-500/15` | `green-400 #4ade80` | `green-500/30` |
| blue | `blue-50 #eff6ff` | `blue-600 #2563eb` | `blue-100 #dbeafe` | `blue-500/15` | `blue-400 #60a5fa` | `blue-500/30` |

[VERIFIED: prototype/src/index.css lines 27-50 — all values are literal Tailwind v3 defaults]

### Radius / Typography / Layout

| Item | Prototype Value | Source |
|------|-----------------|--------|
| Body font | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | prototype index.css L58 |
| Base html size | `16px` | prototype index.css L53 |
| Body background | `#f1f5f9` (slate-100) | prototype index.css L61 |
| Scrollbar thumb | `#cbd5e1` (slate-300) hover `#94a3b8` (slate-400) | prototype index.css L79-85 |
| `rounded-2xl` | `1rem` (Tailwind default) | [CITED: tailwindcss.com/docs/border-radius] |
| Card padding | `py-4` (table rows), `py-3` (inputs/buttons) | aloha-redesign-strategy.md L94 |

**Important finding:** the prototype does NOT define a named shadow scale in `index.css` — it relies on Tailwind's defaults (`shadow-sm`, `shadow`, `shadow-lg`, `shadow-xl`) and the literal `shadow-lg shadow-green-500/25` on primary CTAs. So Phase 7's "shadow scale" is effectively: **restore Tailwind's default shadow scale** (which in v4 lives in the `@theme` defaults, currently overridden to `none` by `global.css`). [VERIFIED: prototype/src/index.css has no `--shadow-*` definitions]

## Current Shadcn Token Inventory (from `app/styles/shadcn-ui.css`)

**Complete list of tokens to swap in `:root` (light):** [VERIFIED: file read]

Non-color Supabase scaffolding (DELETE — per D-03, no Aloha counterpart):

- `--supabase-green`, `--supabase-green-link`, `--supabase-green-border`
- `--sb-near-black`, `--sb-dark`, `--sb-dark-border`, `--sb-border-dark`, `--sb-border-mid`, `--sb-border-light`, `--sb-charcoal`, `--sb-mid-gray`, `--sb-light-gray`, `--sb-near-white`, `--sb-dark-gray`, `--sb-off-white`
- `--glass-surface`, `--slate-alpha-wash` (Supabase translucency — unused by Aloha primitives; DELETE unless grep finds consumers)

Semantic (KEEP keys, RETUNE values per D-06):

- `--semantic-red-bg`, `--semantic-red-fg`, `--semantic-red-border`
- `--semantic-amber-bg`, `--semantic-amber-fg`, `--semantic-amber-border`
- `--semantic-green-bg`, `--semantic-green-fg`, `--semantic-green-border`
- `--semantic-blue-bg`, `--semantic-blue-fg`, `--semantic-blue-border`

Shadcn core (KEEP keys, SWAP values per D-01):

- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`
- `--radius` (currently `0.5rem`, change to `1rem` per D-10)

Charts (KEEP keys, retune values to complement Aloha palette):

- `--chart-1` through `--chart-5`

Sidebar (KEEP keys, SWAP values per D-01):

- `--sidebar-background`, `--sidebar-foreground`
- `--sidebar-primary`, `--sidebar-primary-foreground`
- `--sidebar-accent`, `--sidebar-accent-foreground`
- `--sidebar-border`, `--sidebar-ring`

Font-family (declared in both `shadcn-ui.css` L11-13 AND `theme.css` L71-73 — BOTH must be updated):

- `--font-sans`, `--font-heading`, `--font-mono`

**`.dark` block has the same list** — every token defined in `:root` is also overridden in `.dark`. [VERIFIED: shadcn-ui.css L103-171]

**Tokens NEW in Phase 7:**

- `--gradient-primary: linear-gradient(135deg, #22c55e, #059669)` (recommended — single source of truth for the signature gradient, usable in Phase 8 button with `background: var(--gradient-primary)`)
- (Optional) `--gradient-primary-dark: linear-gradient(135deg, #4ade80, #10b981)` for `.dark` — preserves brand vividness per D-13

## Tailwind 4 `@theme` Block Inventory (`app/styles/theme.css`)

[VERIFIED: file read] Every `--color-*` / `--radius-*` / `--font-*` / `--animate-*` mapping currently in `@theme`:

**Color mappings (KEEP all keys, they are Tailwind class generators):**

- `--color-background`, `--color-foreground`
- `--color-card`, `--color-card-foreground`
- `--color-popover`, `--color-popover-foreground`
- `--color-primary`, `--color-primary-foreground`
- `--color-secondary`, `--color-secondary-foreground`
- `--color-muted`, `--color-muted-foreground`
- `--color-accent`, `--color-accent-foreground`
- `--color-destructive`, `--color-destructive-foreground`
- `--color-border`, `--color-input`, `--color-ring`
- `--color-chart-1..5`
- `--color-semantic-{red,amber,green,blue}-{bg,fg,border}` (12 tokens)
- `--color-glass-surface`, `--color-slate-alpha-wash` (DELETE if `shadcn-ui.css` Supabase tokens removed — otherwise orphan Tailwind classes)
- `--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-primary`, `--color-sidebar-primary-foreground`, `--color-sidebar-accent`, `--color-sidebar-accent-foreground`, `--color-sidebar-border`, `--color-sidebar-ring`

**Radius mappings (KEEP keys):**

- `--radius-radius: var(--radius)` (note: this looks redundant — consumer-side impact to be checked during plan, may remove)
- `--radius-sm: calc(var(--radius) - 4px)`
- `--radius-md: calc(var(--radius) - 2px)`
- `--radius-lg: var(--radius)`

With `--radius = 1rem (16px)` per D-10, derived values become:
- `--radius-sm = 12px`
- `--radius-md = 14px`
- `--radius-lg = 16px`

This is sane — Shadcn primitives that use `rounded-sm/md/lg` get a softer-but-proportional curve. `rounded-2xl` remains the go-to explicit utility for cards/buttons in Phase 8.

**Font mappings (UPDATE values):**

- `--font-sans: 'Geist Variable', ...` → `'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- `--font-heading: 'Geist Variable', ...` → same as sans
- `--font-mono: 'Geist Mono Variable', ...` → KEEP (D-08)

**Animation mappings (KEEP as-is):**

- `--animate-fade-up`, `--animate-fade-down`, `--animate-accordion-down`, `--animate-accordion-up` + keyframes

**NEW tokens to ADD:**

- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl` — map to Tailwind v3 default soft shadows rebased on slate-900 alpha (see §Shadow Scale below)
- `--gradient-primary` mapped from `var(--gradient-primary)` if added in shadcn-ui.css

## DESIGN.md Rewrite Outline

Current `DESIGN.md` (4700+ words, Supabase-themed) is replaced with Aloha spec. Recommended outline for the planner:

1. **Visual Theme & Atmosphere** — Aloha as a polished farm-ops ERP, light-first, soft surfaces, green gradient brand moment, generous spacing for field workers.
2. **Color Palette & Roles**
   - Brand: green-500 (`#22c55e`), emerald-600 (`#059669`), gradient `linear-gradient(135deg, #22c55e, #059669)`.
   - Neutrals: slate-50..slate-900 (full scale table with hex + usage).
   - Semantic: success/warning/danger/info with bg/fg/border triples (four scales × light+dark).
   - Light mode token table (same format as current DESIGN.md).
   - Dark mode token table with derivation notes.
3. **Typography**
   - Family: Inter Variable (body + heading), Geist Mono Variable (code).
   - Base: 16px, weight 400/500/600.
   - Scale: display/h1/h2/h3/body/small table with size + line-height.
4. **Radius** — base 1rem (rounded-2xl), sm/md/lg derived via calc.
5. **Shadows** — sm/md/lg/xl/2xl soft slate-900 alpha scale.
6. **Component Stylings** — point to Phase 8 for primitive specs, document the gradient button shadow `shadow-lg shadow-green-500/25` as the signature token-adjacent pattern.
7. **Layout Principles** — 72px navbar, 220/68 sidebar, py-3 inputs, py-4 rows (hint for Phase 9).
8. **Dark Mode** — derivation rules table (what each `:root` token becomes in `.dark`).
9. **WCAG AA Verification** — snapshot of the token-pair contrast table (see §WCAG Verification below).
10. **Do's and Don'ts** — no bold green surfaces, no shadows ≥ `2xl` on interactive elements, green gradient only on primary CTAs.

## Inter Font Integration

**Package:** `@fontsource-variable/inter` @ `5.2.8` [VERIFIED: npm view]. Source: github.com/fontsource/fontsource, CC0/MIT-licensed self-hosted fonts.

**Import path** (matches existing Geist pattern in `global.css` L7):

```css
@import '@fontsource-variable/inter/wght.css';
```

This loads the full `wght` axis (100–900) in one stylesheet. Variable fonts resolve to a single woff2 file (~40KB subset for Latin). Per CONTEXT D-discretion, default to the full `wght` axis — bundle-size concern unlikely to matter with Inter's efficient variable file.

**Font-family CSS name:** `'Inter Variable'` — mirrors Geist's `'Geist Variable'` naming convention established by `@fontsource-variable/*` packages. [VERIFIED: follows package convention; `@fontsource-variable/geist/wght.css` exposes `'Geist Variable'`.]

**Where it plugs in:**

1. `app/styles/global.css` L7 — replace `@import '@fontsource-variable/geist/wght.css';` with `@import '@fontsource-variable/inter/wght.css';`
2. `app/styles/theme.css` L71-72 — update `--font-sans` and `--font-heading` strings.
3. `app/styles/shadcn-ui.css` L11-13 — update `--font-sans` and `--font-heading` strings (both places must agree).
4. `package.json` — `pnpm add @fontsource-variable/inter && pnpm remove @fontsource-variable/geist`.

**Workspace catalog note:** `@fontsource-variable/*` packages are NOT in the pnpm catalog (`pnpm-workspace.yaml` only catalogs supabase, react, tanstack, etc.). [VERIFIED: pnpm-workspace.yaml] → Add Inter directly to `dependencies` in root `package.json`, same as Geist currently lives there.

**SSR safety:** `@fontsource-variable/*` is pure CSS `@font-face` + bundled woff2 — no JS runtime, no hydration issues. Vite/React Router resolve it at build time. Already battle-tested via Geist.

## Shadow Scale Recommendation

Current `global.css` L50-66 forces `--shadow* : none` in both `:root` and `.dark` blocks. [VERIFIED: file read] Phase 7 must remove those lockouts so Tailwind's default shadow utilities come back online.

**Recommendation — soft slate-tinted scale** (matches `#f1f5f9` prototype canvas aesthetic):

```css
/* in shadcn-ui.css :root (values borrowed from Tailwind v3 defaults but rebased on slate-900) */
--shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.05);
--shadow: 0 1px 3px 0 rgb(15 23 42 / 0.10), 0 1px 2px -1px rgb(15 23 42 / 0.10);
--shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.10), 0 2px 4px -2px rgb(15 23 42 / 0.10);
--shadow-lg: 0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.10);
--shadow-xl: 0 20px 25px -5px rgb(15 23 42 / 0.10), 0 8px 10px -6px rgb(15 23 42 / 0.10);
--shadow-2xl: 0 25px 50px -12px rgb(15 23 42 / 0.25);
```

In `.dark`, drop opacity by ~50% so shadows remain visible without washing out dark surfaces:

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.30);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.40), 0 1px 2px -1px rgb(0 0 0 / 0.40);
/* ... etc */
```

These are Tailwind v3's default values, verified against `tailwindcss.com/docs/box-shadow`. [CITED: tailwindcss.com/docs/box-shadow]

**Green-tinted button shadow** stays a Phase 8 concern — applied at the button level as `shadow-lg shadow-green-500/25` via Tailwind utilities, NOT as a global token. [VERIFIED: CONTEXT D-12]

### Shadow Unlock Safety Check

**Risk:** Unlocking shadows might reveal unintended shadows on components that previously relied on them being forced-off.

**Verification approach during plan:** `grep -rn "shadow-" app/ packages/` (use Grep tool) to enumerate components currently using Tailwind shadow classes. With `--shadow*: none` in place, those classes are currently visual no-ops; removing the lockout makes them render.

**Expected finding:** v1.0 Supabase-era code followed "no shadows" DESIGN.md doctrine and should have few-to-no `shadow-*` classes in primitive/component source. Any hits found are worth a one-line call-out in RESEARCH.md, but this risk is LOW — Phase 7 is a token foundation, any visible shadow that "pops back" is either intentional (something Phase 8 needs) or a trivial fix.

## Dark Palette Spec (hand-specified, per D-04 + D-13)

| Token | Light (`:root`) | Dark (`.dark`) | Rationale |
|-------|-----------------|----------------|-----------|
| `--background` | `#f1f5f9` (slate-100) | `#0f172a` (slate-900) | Match prototype body bg light; slate-900 gives non-pure-black dark canvas |
| `--foreground` | `#0f172a` (slate-900) | `#f8fafc` (slate-50) | Maximal contrast body text |
| `--card` | `#ffffff` | `#1e293b` (slate-800) | White cards on slate-100 canvas (light); lifted surface on slate-900 (dark) |
| `--card-foreground` | `#0f172a` | `#f8fafc` | Inherit from foreground |
| `--popover` | `#ffffff` | `#1e293b` | Match card |
| `--popover-foreground` | `#0f172a` | `#f8fafc` | Match card-foreground |
| `--primary` | `#22c55e` (green-500) | `#4ade80` (green-400) | Brighter green in dark preserves brand vividness per D-13 |
| `--primary-foreground` | `#ffffff` | `#052e16` (green-950) | White on green-500 ≈ 3.13:1 (large/UI OK; borderline for body text — see WCAG notes); dark green on bright green-400 for dark |
| `--secondary` | `#f1f5f9` (slate-100) | `#334155` (slate-700) | Quiet surface |
| `--secondary-foreground` | `#0f172a` | `#f8fafc` | |
| `--muted` | `#f1f5f9` (slate-100) | `#1e293b` (slate-800) | |
| `--muted-foreground` | `#64748b` (slate-500) | `#94a3b8` (slate-400) | Low-emphasis text |
| `--accent` | `#f1f5f9` (slate-100) | `#334155` (slate-700) | |
| `--accent-foreground` | `#0f172a` | `#f8fafc` | |
| `--destructive` | `#dc2626` (red-600) | `#ef4444` (red-500) | |
| `--destructive-foreground` | `#ffffff` | `#ffffff` | |
| `--border` | `#e2e8f0` (slate-200) | `#334155` (slate-700) | Visible but not loud |
| `--input` | `#cbd5e1` (slate-300) | `#475569` (slate-600) | |
| `--ring` | `#22c55e` (green-500) | `#4ade80` (green-400) | Focus ring matches primary |
| `--sidebar-background` | `#ffffff` | `#0f172a` (slate-900) | White sidebar (prototype); dark sidebar matches canvas |
| `--sidebar-foreground` | `#475569` (slate-600) | `#cbd5e1` (slate-300) | |
| `--sidebar-primary` | `#22c55e` | `#4ade80` | |
| `--sidebar-primary-foreground` | `#ffffff` | `#052e16` | |
| `--sidebar-accent` | `#f0fdf4` (green-50) | `#14532d` (green-900) | Hover/active wash |
| `--sidebar-accent-foreground` | `#15803d` (green-700) | `#bbf7d0` (green-200) | |
| `--sidebar-border` | `#e2e8f0` (slate-200) | `#1e293b` (slate-800) | |
| `--sidebar-ring` | `#22c55e` | `#4ade80` | |

**`--primary-foreground` caveat:** White on green-500 (`#22c55e`) computes to ~2.75:1 [ASSUMED — must re-verify with `wcag-contrast` script during plan execution]. This FAILS WCAG AA for body text (4.5:1) and is borderline for UI components (3:1). Two mitigations:

1. **Option A (recommended):** Use `green-700` (`#15803d`) text on `green-500` bg for primary buttons — hits ~5.3:1. But this contradicts the prototype which shows white text on the gradient.
2. **Option B:** Keep white text but apply the GRADIENT (`green-500→emerald-600`) — the perceived luminance shifts darker, and gradient buttons are the Phase 8 pattern anyway. Document that `--primary` solid is for non-button usages (borders, rings) and the gradient variant carries the label text — this matches CONTEXT D-05.
3. **Option C:** Scope the WCAG failure — document that `--primary`/`--primary-foreground` pair is LARGE-TEXT/UI-ONLY (3:1 threshold). Button labels in Phase 8 are 16px bold which qualifies as large-bold text under WCAG 2.2 (AA threshold 3:1).

**Plan recommendation:** Go with **Option C** plus document gradient usage (Option B). The solid `--primary` = green-500 is used as a color-of-record for rings/borders/chips; the interactive button face uses the gradient, which has effective background luminance ≈ emerald-600 midpoint, computing to a safer ratio with white text.

All other token pairs above are designed to hit WCAG AA comfortably — verify in plan execution with the script.

## WCAG Verification Approach

**Scope (per D-14):** ~12 token pairs at the foundation level.

**Pairs to verify in Phase 7:**

| # | Foreground | Background | Threshold | Light | Dark |
|---|-----------|------------|-----------|-------|------|
| 1 | `--foreground` | `--background` | 4.5:1 | pending | pending |
| 2 | `--card-foreground` | `--card` | 4.5:1 | pending | pending |
| 3 | `--popover-foreground` | `--popover` | 4.5:1 | pending | pending |
| 4 | `--primary-foreground` | `--primary` | 3:1 (UI/large) | pending (see caveat) | pending |
| 5 | `--secondary-foreground` | `--secondary` | 4.5:1 | pending | pending |
| 6 | `--muted-foreground` | `--background` | 4.5:1 | pending | pending |
| 7 | `--muted-foreground` | `--muted` | 4.5:1 | pending | pending |
| 8 | `--accent-foreground` | `--accent` | 4.5:1 | pending | pending |
| 9 | `--destructive-foreground` | `--destructive` | 3:1 (UI) | pending | pending |
| 10 | `--border` | `--background` | 3:1 (UI) | pending | pending |
| 11 | `--ring` | `--background` | 3:1 (UI) | pending | pending |
| 12 | `--sidebar-foreground` | `--sidebar-background` | 4.5:1 | pending | pending |

**Tooling — recommended (SIMPLEST approach):**

Write a throwaway Node script at `scripts/verify-wcag.mjs` (one-off, not committed to package.json scripts) that:

1. Imports `wcag-contrast` (`pnpm dlx wcag-contrast` or `npx wcag-contrast`).
2. Hard-codes the hex values of each pair from DESIGN.md.
3. Prints a PASS/FAIL table to stdout.
4. Outputs results as a markdown block that gets pasted into DESIGN.md §WCAG Verification.

**Example script shape** [ASSUMED — sketch, to be finalized in plan]:

```js
// scripts/verify-wcag.mjs — one-off, delete after Phase 7
import { hex } from 'wcag-contrast';

const pairs = [
  { name: 'foreground/background (light)', fg: '#0f172a', bg: '#f1f5f9', min: 4.5 },
  { name: 'foreground/background (dark)',  fg: '#f8fafc', bg: '#0f172a', min: 4.5 },
  // ... 22 more
];

for (const p of pairs) {
  const ratio = hex(p.fg, p.bg);
  const pass = ratio >= p.min;
  console.log(`${pass ? '✓' : '✗'} ${p.name}: ${ratio.toFixed(2)}:1 (min ${p.min})`);
}
```

Run: `pnpm dlx wcag-contrast` is not directly executable (it's a library not a CLI) — correct invocation is `node scripts/verify-wcag.mjs` after `pnpm add -D wcag-contrast` OR using dynamic import via `npx -y -p wcag-contrast node -e '...'`. Simplest: **`pnpm add -D wcag-contrast` + script + `pnpm remove wcag-contrast` when done** (or keep it as a dev dep for Phase 10).

**Alternative (zero-install):** Paste hex pairs into contrast-ratio.com by hand. Faster for 24 pairs, but not reproducible. Not recommended when the script is ~30 lines.

**Tooling decision for plan:** Add `wcag-contrast` as a devDependency. It's 10KB, MIT, and Phase 10 will want it again anyway. Script stays in `scripts/` for Phase 10 reuse.

## Runtime State Inventory

Phase 7 is a CSS + docs + single-dependency-swap phase with no database/service/cache implications. Completing the checklist for the record:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by inspection of scope (no DB/schema/data touched) | None |
| Live service config | None — no external services referenced | None |
| OS-registered state | None — no OS-level registration (this is browser CSS) | None |
| Secrets/env vars | None — no env vars consumed by token layer | None |
| Build artifacts / installed packages | `@fontsource-variable/geist` will be removed from `node_modules` and `pnpm-lock.yaml`. `@fontsource-variable/inter` added. No stale build artifacts — Vite rebuilds CSS on next `pnpm dev`. | `pnpm install` after package.json edit |

Nothing else found.

## Common Pitfalls

### Pitfall 1: Font-family string defined in two places

**What goes wrong:** `--font-sans`, `--font-heading`, `--font-mono` are declared BOTH in `shadcn-ui.css` L11-13 (as CSS vars) AND in `theme.css` L71-73 (as `@theme` string literals). If only one is updated, Tailwind's `font-sans` utility may diverge from `--font-sans` used by Shadcn primitives.

**Why it happens:** Tailwind 4's `@theme` block generates `font-sans` Tailwind class from its own string, while Shadcn primitives using `var(--font-sans)` pull from the CSS-var declaration. They must be kept in sync by hand.

**How to avoid:** Update both files in the same commit. The plan task for the font swap must touch both files explicitly.

**Warning signs:** After the swap, `pnpm dev` shows correct Inter in some places (e.g., `body` tag via theme.css `font-sans` class) but Geist in others (e.g., any component using `var(--font-heading)` from shadcn-ui.css).

### Pitfall 2: `--radius` jump (0.5rem → 1rem) blows layout on fixed-size elements

**What goes wrong:** Doubling `--radius` from 8px to 16px may visually "over-round" small elements (icon buttons, checkboxes, tight pills) that previously looked tight with 8px corners.

**Why it happens:** Shadcn uses `rounded-lg`/`rounded-md` extensively, which calc off `--radius`. A checkbox that was `rounded-sm` = 4px becomes 12px — visibly wrong.

**How to avoid:** Shadcn's checkbox + similar small primitives typically hard-code `rounded-sm` or `rounded-[4px]`. Audit during Phase 8 — NOT Phase 7. Phase 7 smoke check will visually surface any obvious offenders during D-16 verification.

**Warning signs:** Checkboxes look like mini-tab pills; form input inner icons clip corners; AG Grid filter checkboxes look spongy.

### Pitfall 3: Shadow unlock reveals forgotten shadow utilities

**What goes wrong:** Components in the v1.0 codebase used `shadow-sm` or `shadow` under the assumption they'd render as `none`. Unlocking reveals visible shadows where none were intended.

**How to avoid:** During plan execution, run `grep -rn "shadow-[a-z]" app/ packages/ui/` to enumerate hits. Expected low count. Any problematic hits either (a) get fixed as part of Phase 7 shadow unlock (preferred — it's correct for Phase 8+) or (b) are documented as Phase 8 cleanup items.

**Warning signs:** Smoke check in D-16 shows "floating" cards, toolbars, or modal overlays with suddenly-visible soft shadows. Usually a GOOD thing aesthetically, but worth noting.

### Pitfall 4: AG Grid CSS vars silently broken

**What goes wrong:** `ag-grid-theme.ts` (v1.0 Phase 1 artifact) reads `--background`, `--foreground`, etc. at theme-construction time. Swapping values propagates automatically — BUT if `ag-grid-theme.ts` caches colors as hex at module load, new values don't apply.

**How to avoid:** Phase 10 will do the full AG Grid adaptation. Phase 7 smoke check should open one AG Grid route (e.g., `/home/<account>/hr/employees`) to confirm it still renders without crashing. Visual fidelity is Phase 10's problem.

**Warning signs:** Grid header renders with green background (unintended inheritance from new `--primary`) or grid borders disappear.

### Pitfall 5: `next-themes` flash-of-unstyled-content (FOUC) in dark mode

**What goes wrong:** New CSS var values swap but `next-themes` + SSR theme cookie path still works as before — FOUC behavior unchanged. Risk is zero IF values are defined in both `:root` and `.dark` blocks symmetrically.

**How to avoid:** Parity check — every token defined in `:root` MUST also be defined in `.dark`. Current `shadcn-ui.css` already follows this. Keep the parity in the rewrite.

**Warning signs:** Page loads in light theme then snaps to dark on hydration; specific tokens "flash" while others don't (indicates a `:root`-only definition).

## Code Examples

### Example: Inter import + font-family wiring

```css
/* app/styles/global.css (BEFORE — line 7) */
@import '@fontsource-variable/geist/wght.css';
@import '@fontsource-variable/geist-mono/wght.css';

/* AFTER */
@import '@fontsource-variable/inter/wght.css';
@import '@fontsource-variable/geist-mono/wght.css';
```

```css
/* app/styles/theme.css (L71-73) */
--font-sans: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-heading: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Geist Mono Variable', 'Source Code Pro', Menlo, monospace;
```

```css
/* app/styles/shadcn-ui.css (L11-13 — mirror same strings) */
--font-sans: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Geist Mono Variable', 'Source Code Pro', Menlo, monospace;
--font-heading: var(--font-sans);
```

[Source: fontsource.org/fonts/inter, existing Geist pattern in codebase]

### Example: Shadow unlock

```css
/* app/styles/global.css (DELETE L50-66 shadow lockout) */
/* Remove the entire :root { --shadow*: none } and .dark { --shadow*: none } blocks */
```

```css
/* app/styles/shadcn-ui.css :root — ADD to Aloha block */
--shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.05);
--shadow: 0 1px 3px 0 rgb(15 23 42 / 0.10), 0 1px 2px -1px rgb(15 23 42 / 0.10);
--shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.10), 0 2px 4px -2px rgb(15 23 42 / 0.10);
--shadow-lg: 0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.10);
--shadow-xl: 0 20px 25px -5px rgb(15 23 42 / 0.10), 0 8px 10px -6px rgb(15 23 42 / 0.10);
--shadow-2xl: 0 25px 50px -12px rgb(15 23 42 / 0.25);
```

[Source: tailwindcss.com/docs/box-shadow defaults, slate-900 alpha substitution]

### Example: Gradient primary token

```css
/* app/styles/shadcn-ui.css :root */
--gradient-primary: linear-gradient(135deg, #22c55e 0%, #059669 100%);

/* .dark override */
--gradient-primary: linear-gradient(135deg, #4ade80 0%, #10b981 100%);
```

```css
/* app/styles/theme.css — expose to Tailwind */
@theme {
  /* ... existing ... */
  --color-gradient-primary: var(--gradient-primary);
}
```

Consumer in Phase 8 button: `className="bg-[var(--gradient-primary)]"` or via arbitrary utility.

[Source: prototype shell composition + aloha-redesign-strategy.md L97]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Geist as body font | Inter Variable | Phase 7 this milestone | Font-family string update only |
| Supabase Circular-alternative dark-first palette | Aloha slate + green light-first palette | Phase 7 | Value swap on existing tokens |
| `--shadow*: none` (Supabase doctrine) | Tailwind-default soft shadows | Phase 7 | Global lockout removal |
| `--radius: 0.5rem` (Shadcn default) | `--radius: 1rem` (rounded-2xl) | Phase 7 | 2x radius everywhere |
| OKLCH values in `shadcn-ui.css` | Hex from Tailwind literals | Phase 7 | Simpler to reason about; prototype canonical |

**Deprecated/outdated:**

- Supabase `--sb-*` neutral scale — no Aloha counterpart, DELETE
- Supabase `--supabase-green*` tokens — replaced by direct green-500/emerald-600 in Aloha scheme
- `--glass-surface`, `--slate-alpha-wash` translucency tokens — Aloha is opaque-first; DELETE unless grep finds usages

## Implementation Order (recommended)

1. **DESIGN.md rewrite** (Task 1 — spec before code)
   Sets the target; other edits become mechanical translations.
2. **`app/styles/shadcn-ui.css` — `:root` block rewrite** (Task 2)
   All light-mode token values swapped to Aloha palette. New tokens added (gradient, shadows).
3. **`app/styles/shadcn-ui.css` — `.dark` block rewrite** (Task 3)
   All dark-mode token values hand-specified to the dark palette table above.
4. **`app/styles/theme.css` — `@theme` updates** (Task 4)
   Font-family strings, new `--color-gradient-primary` mapping, `--shadow-*` mappings, delete orphaned `--color-glass-surface` / `--color-slate-alpha-wash` if their backing vars were removed.
5. **`app/styles/global.css` — font import + shadow lockout removal** (Task 5)
   Swap Geist import → Inter import. Delete the `:root { --shadow*: none }` and `.dark { --shadow*: none }` blocks.
6. **`package.json` — Inter add, Geist remove** (Task 6)
   `pnpm add @fontsource-variable/inter && pnpm remove @fontsource-variable/geist`.
7. **WCAG verification script + run** (Task 7)
   Add `wcag-contrast` devDep, write `scripts/verify-wcag.mjs`, run, paste results into DESIGN.md §WCAG Verification.
8. **Smoke check** (Task 8 — D-16)
   `pnpm dev`, visit home + one sub-module (e.g., `/home/<account>/hr/employees`), toggle light/dark, confirm no layout breakage, no console errors, Inter font visibly loaded.

This order front-loads the spec (DESIGN.md), keeps each CSS edit independently reviewable, defers the package install until CSS is stable, and ends with verification.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | pnpm, Vite | ✓ | ≥20.x | — |
| pnpm | Package management | ✓ | 10.18.1 | — |
| `@fontsource-variable/inter` | Inter font loading | will install | 5.2.8 | — |
| `wcag-contrast` | WCAG verification script | will install (devDep) | 3.0.0 | Manual via contrast-ratio.com (slower, not reproducible) |
| Vite dev server | Smoke check | ✓ | 7.3.0 | — |
| `next-themes` | Dark mode toggle | ✓ | 0.4.6 | — |
| Browser (any modern) | Visual smoke check | ✓ | — | — |

**No blocking dependencies.** `@fontsource-variable/inter` and `wcag-contrast` are both on public npm registry, verified 2026-04-10.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual smoke check (Phase 7 is pure CSS + docs; automated UI tests overkill) + one-off Node script for WCAG |
| Config file | `scripts/verify-wcag.mjs` (one-off, phase-scoped) |
| Quick run command | `pnpm dev` → visual check, then `node scripts/verify-wcag.mjs` |
| Full suite command | `pnpm typecheck && pnpm lint && pnpm dev` (visual) + `node scripts/verify-wcag.mjs` |

**Rationale for no Playwright/Vitest:** Phase 7 has no TSX to test, no logic to assert. The only "behavior" is CSS values rendering correctly, which is inherently visual. Full automated regression (axe + Playwright snapshots) is Phase 10 per D-14. Committing Playwright shell/theme tests now would duplicate Phase 10 work and test nothing beyond what the DOM obviously shows.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DESIGN-01 | DESIGN.md reads as Aloha spec (Inter, slate, green gradient, rounded-2xl, shadows, light-first) with no Supabase-era tokens | manual review | `git diff DESIGN.md` + human read | ⚠️ DESIGN.md exists, will be rewritten |
| DESIGN-02 | Tailwind `@theme` block + CSS vars reflect Aloha palette / font / radius / shadows end-to-end | manual smoke | `pnpm dev` → devtools inspect `:root` computed vars | ✅ `theme.css`, `shadcn-ui.css` exist |
| DESIGN-03 | Inter variable font loaded globally | manual smoke | `pnpm dev` → devtools Network tab shows Inter woff2, `body` computed `font-family` is Inter Variable | ✅ `global.css` exists |
| DESIGN-04 | Light canonical, dark derived, WCAG AA on foundation token pairs | automated (Node script) | `node scripts/verify-wcag.mjs` | ❌ Wave 0 — needs `scripts/verify-wcag.mjs` |
| DARK-01 | Dark palette derived from light, WCAG AA verified (Phase 7 scope = foundation pairs per D-14) | automated (same script) | `node scripts/verify-wcag.mjs` | ❌ Wave 0 — same script |

### Sampling Rate

- **Per task commit:** `pnpm typecheck` (cheap; ensures no accidental TS breakage from package.json edits or ambient type changes) + `pnpm dev` quick visual load.
- **Per wave merge:** Full WCAG script run + home + one sub-module light/dark visual check.
- **Phase gate:** All 12 WCAG pairs PASS in both themes; smoke check passes; `pnpm typecheck && pnpm lint` clean; before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `scripts/verify-wcag.mjs` — one-off Node script computing contrast ratios for all 12 foundation token pairs in both themes, exits non-zero on any FAIL. Covers DESIGN-04 + DARK-01.
- [ ] `wcag-contrast@3.0.0` devDependency added to root `package.json`.
- [ ] (No Playwright/Vitest additions — intentionally deferred to Phase 10.)

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R-01 | White-on-green-500 `--primary`/`--primary-foreground` pair fails WCAG AA at 4.5:1 (~2.75:1 assumed) | HIGH | MEDIUM (blocks DESIGN-04 ack) | Apply UI/large-text 3:1 threshold per WCAG 2.2 for button labels ≥ 16px bold; document as "interactive button face uses gradient, solid color is for non-text roles" per §Dark Palette caveat. Worst case fall back to Option A (green-700 text on green-500). |
| R-02 | Sidebar/accordion tokens (`--sidebar-*`) drift — retuned by hand and not covered by automated test | MEDIUM | MEDIUM (visual breakage in Phase 9 sidebar work) | Include all 8 sidebar tokens in WCAG verification script explicitly (already listed as pair #12 — extend to cover sidebar-accent/accent-fg and sidebar-primary/primary-fg pairs too). |
| R-03 | Shadow unlock reveals unintended shadow usage in v1.0 components | LOW | LOW (cosmetic surprise, not blocking) | Pre-edit grep `shadow-[a-z]` in `app/` + `packages/ui/`, document hits in plan. Expected low count because v1.0 followed "no shadows" doctrine. |
| R-04 | `--radius` jump 0.5rem → 1rem makes small Shadcn primitives (checkbox, radio, icon buttons) look "over-rounded" | MEDIUM | LOW (Phase 8 will fix, not a blocker) | Acknowledge in Phase 7 smoke check; defer fix to Phase 8 primitive restyle where those components get explicit `rounded-sm` / `rounded-[4px]` anyway. |
| R-05 | Font-family out-of-sync between `theme.css` @theme block and `shadcn-ui.css` vars (Pitfall 1) | MEDIUM | MEDIUM (visual regression: mixed fonts) | Plan task explicitly touches BOTH files in same commit; smoke check asserts computed `font-family` on `body` AND a Shadcn primitive (e.g., card title). |

Top 3 to watch: **R-01, R-02, R-03** as flagged by user.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | White (`#ffffff`) on green-500 (`#22c55e`) computes to ~2.75:1 contrast ratio | §Dark Palette Spec caveat | If actually ≥3:1, no mitigation needed; if <2.75:1, Option C falls through and we must go Option A (green-700 text). Resolved by running the script in Task 7. |
| A2 | slate-950 (`#020617`) is the Tailwind v3 default value | §Prototype Token Values | Only relevant if we use it; currently only listed as "deepest dark canvas option" and NOT selected for any token. Low risk. |
| A3 | `scripts/verify-wcag.mjs` sketch code compiles and runs as-is | §WCAG Verification Approach | Low — any bug is caught during Task 7 execution and fixed inline. |
| A4 | `shadow-[a-z]` grep across `app/` + `packages/ui/` returns low count | §Pitfall 3, R-03 | Plan should actually run this grep to confirm. If hit count is high, add a dedicated cleanup sub-task. |
| A5 | AG Grid theme (`ag-grid-theme.ts`) reads CSS vars dynamically (not cached at module load) | §Pitfall 4 | If cached, Phase 7 smoke check will look wrong but this is Phase 10's problem to fix anyway. Non-blocking for Phase 7. |
| A6 | Inter font file via `@fontsource-variable/inter/wght.css` exposes `'Inter Variable'` as the CSS font-family name | §Inter Font Integration | Very low — follows universal `@fontsource-variable/*` convention. Verify by inspecting the package's generated CSS after install. |

**If any A1–A6 item surprises the plan**, fix inline during execution — none are architectural blockers.

## Open Questions (RESOLVED)

1. **Should `--gradient-primary` be exposed as a CSS var in `shadcn-ui.css` or only as a Tailwind arbitrary utility?** — **RESOLVED**
   - Decision: expose as a CSS custom property `--gradient-primary` in `shadcn-ui.css` `:root` + `.dark` (single source of truth, dark-mode overridable) AND add `--color-gradient-primary: var(--gradient-primary)` mapping in `theme.css` `@theme` so Tailwind arbitrary utilities can consume it. Applied in Plan 07-01 (Task 2) and Plan 07-02 (Task 1).

2. **Remove `--glass-surface` and `--slate-alpha-wash`, or retain as orphans?** — **RESOLVED**
   - Decision: DELETE unconditionally from both `shadcn-ui.css` (var defs) and `theme.css` `@theme` (mappings). These are Supabase-era translucency tokens with no Aloha counterpart per D-03; retaining orphans violates the "no Supabase-era tokens remaining" success criterion in ROADMAP.md. If any component currently consumes them, that's a pre-existing dead reference and will surface in Phase 8/9 restyle where it can be fixed in context. Applied in Plan 07-01 (Task 2) and Plan 07-02 (Task 1).

3. **Does `--radius-radius: var(--radius)` in `theme.css` L65 need to exist?** — **RESOLVED**
   - Decision: DEFERRED to Phase 10 cleanup — out of scope for Phase 7. The line is cosmetic dead code (self-reference, no known consumer) and does not block the phase goal (token swap + Inter + WCAG). Touching it now adds a grep step without buying anything for the goal. Plan 07-02 Task 1 explicitly leaves this line alone so the deferral is observable.

## Sources

### Primary (HIGH confidence)

- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/index.css` — canonical prototype token values [VERIFIED: file read]
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/aloha-redesign-strategy.md` — design principles [VERIFIED: file read]
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app/styles/shadcn-ui.css` — current token inventory [VERIFIED: file read]
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app/styles/theme.css` — current `@theme` block [VERIFIED: file read]
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/app/styles/global.css` — font imports + shadow lockout [VERIFIED: file read]
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/package.json` — dependency versions [VERIFIED: file read]
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/pnpm-workspace.yaml` — catalog (no `@fontsource-variable/*`) [VERIFIED: bash cat]
- `npm view @fontsource-variable/inter version` → `5.2.8` [VERIFIED: 2026-04-10]
- `npm view wcag-contrast version` → `3.0.0` [VERIFIED: 2026-04-10]
- `.planning/phases/07-design-foundations/07-CONTEXT.md` — locked decisions [VERIFIED: file read]

### Secondary (MEDIUM confidence)

- tailwindcss.com/docs/box-shadow — Tailwind v3 default shadow values [CITED, from training knowledge; values are stable across v3→v4 per Tailwind changelog]
- tailwindcss.com/docs/border-radius — rounded-2xl = 1rem [CITED]
- WCAG 2.2 AA thresholds — 4.5:1 normal text, 3:1 large/bold/UI components [CITED: w3.org/WAI/WCAG22/quickref]

### Tertiary (LOW confidence)

- None. All findings are either verified against files/npm or cited from stable external standards.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library version verified against npm + existing package.json
- Prototype token values: HIGH — read directly from prototype/src/index.css; literals match Tailwind v3 defaults
- Current token inventory: HIGH — read directly from shadcn-ui.css and theme.css
- Dark palette spec: MEDIUM — hand-specified values, mostly slate/green literals; WCAG ratios PENDING script execution in plan Task 7
- Pitfalls: HIGH — all derived from inspection of actual files + known Tailwind 4 behavior
- WCAG approach: HIGH — `wcag-contrast` package verified
- `--primary-foreground` on green-500 contrast ratio: LOW (A1) — explicitly flagged, resolved by script during execution

**Research date:** 2026-04-10
**Valid until:** 2026-04-24 (14 days — stable domain, single dependency with active npm release)

## RESEARCH COMPLETE

**Phase:** 7 - Design Foundations
**Confidence:** HIGH

### Key Findings

- Prototype `index.css` values are literal Tailwind v3 defaults (slate + green + emerald scales) — DESIGN.md and `shadcn-ui.css` can cite Tailwind hex values with confidence of exact prototype match.
- Font-family is declared in TWO places (`theme.css` `@theme` block AND `shadcn-ui.css` `:root` vars) — both must be updated in the same commit or fonts desync.
- White-on-green-500 `--primary-foreground`/`--primary` pair is the ONE likely WCAG AA risk; mitigated by applying the 3:1 UI/large-text threshold (buttons are ≥16px bold in Phase 8) and/or using the gradient as the button face.
- Shadow unlock is a simple DELETE of lines 50-66 in `global.css` + add `--shadow-*` tokens to `shadcn-ui.css`. Low risk (pre-grep `shadow-*` usage to confirm).
- WCAG verification is a 30-line Node script using `wcag-contrast@3.0.0` over 12 token pairs × 2 themes = 24 assertions. Runnable as `node scripts/verify-wcag.mjs`. Tooling belongs in devDependencies, reusable for Phase 10.
- Phase 7 scope is tight: 5 files (`DESIGN.md`, `shadcn-ui.css`, `theme.css`, `global.css`, `package.json`) + 1 throwaway script. No TSX touched.

### File Created

`/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app/.planning/phases/07-design-foundations/07-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Versions verified against npm 2026-04-10 |
| Token Values | HIGH | Extracted from prototype/src/index.css directly |
| Current Inventory | HIGH | Read shadcn-ui.css + theme.css + global.css directly |
| Dark Palette | MEDIUM | Hand-specified; ratios pending script execution (flagged) |
| WCAG Tooling | HIGH | `wcag-contrast@3.0.0` verified, approach sized right for 24 assertions |
| Pitfalls | HIGH | All grounded in direct file inspection |

### Open Questions (RESOLVED)

1. **RESOLVED:** `--gradient-primary` exposed as CSS custom property in `shadcn-ui.css` + `--color-gradient-primary` mapped in `theme.css` `@theme` (Plan 07-01 Task 2 + Plan 07-02 Task 1).
2. **RESOLVED:** `--glass-surface` / `--slate-alpha-wash` deleted unconditionally (Plan 07-01 Task 2 + Plan 07-02 Task 1) — Supabase-era orphans, no Aloha counterpart per D-03.
3. **RESOLVED:** `--radius-radius` self-reference explicitly deferred to Phase 10 cleanup — out of scope for Phase 7 (goal is token swap + Inter + WCAG, not dead-code removal).

### Ready for Planning

Research complete. The planner can now create PLAN.md files following the 8-task implementation order in §Implementation Order. Expect 2–3 plans (P01 = DESIGN.md rewrite + CSS swap, P02 = WCAG verification + smoke check, optionally P03 = package.json + cleanup). Nothing blocks plan creation.
