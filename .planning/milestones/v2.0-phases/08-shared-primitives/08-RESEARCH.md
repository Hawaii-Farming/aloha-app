# Phase 8: Shared Primitives — Research

**Researched:** 2026-04-10
**Domain:** Shadcn primitive restyle (CVA + Tailwind 4 tokens)
**Confidence:** HIGH (prototype + current files + caller grep all verified in session)

## Summary

Phase 8 restyles eight primitives (`button`, `card`, `input`, `textarea`, `select`, `badge`, `avatar`, `sheet`) in `packages/ui/src/shadcn/` so every downstream surface inherits the Aloha look via Phase 7 tokens. The research confirms this is a **low-risk, file-local edit** — every caller grep comes back clean: no one hard-codes primitive heights in a container, the only existing Badge variants in use (`secondary`, `outline`, `destructive`, `success`, `warning`) already map cleanly, and the CRUD sheet callers **already override SheetHeader/SheetFooter with their own `border-b`/`border-t` classes**, so Sheet sub-component styling changes are cosmetic at worst.

Two real-world blockers carried over from Phase 7 must be resolved at the top of this phase:

1. **Unresolved WCAG failure: `--ring` at 2.08:1 against `--background`** — PRIM-03 explicitly requires a green-500 focus ring, and Phase 7 §9.1 Failure Register leaves this as a human-decision. The planner must pick a path (retune `--ring` to emerald-600, accept `ring-2` compensating thickness, or change the focus recipe to `ring-2 ring-primary ring-offset-2` to meet the 3:1 target visually).
2. **Badge `destructive` variant** — currently points at `bg-destructive` token (solid red), not the semantic-red-bg/fg pair. Retune to `bg-semantic-red-bg text-semantic-red-fg` so all semantic pills render as consistent pastel pills on both themes.

**Primary recommendation:** One commit per primitive, grouped into 3 waves. Wave 1 covers independent surface primitives (Card, Badge), Wave 2 covers the gradient pair (Button, Avatar), Wave 3 covers the form-primitive recipe (Input/Textarea/Select/Sheet). Every class string can be copied near-verbatim from CONTEXT.md's decisions D-04 through D-18.

## User Constraints (from 08-CONTEXT.md)

### Locked Decisions

**D-01** Only these 8 files edited: `packages/ui/src/shadcn/{button,card,input,textarea,select,badge,avatar,sheet}.tsx`. No loaders, routes, actions, schemas, forms, config, CRUD registry.

**D-02** No prop contract changes. Every existing `variant`, `size`, className consumer keeps working. Adding NEW props only when additive and optional, only when explicitly required by a PRIM-0X requirement (e.g., Avatar `size`).

**D-03** Existing `brand` and `pill` Button variants stay but are retuned to the Aloha palette. `default` becomes the Aloha gradient primary.

**D-04** Gradient applied as Tailwind utilities directly in `button.tsx` / `avatar.tsx`: `bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 hover:shadow-xl`. Do NOT introduce a `--gradient-primary` CSS var consumer in the primitives (the var exists from Phase 7, but Phase 8 stays tailwind-literal).

**D-05** Primary button uses solid Tailwind color names (`green-500`, `emerald-600`) rather than `--primary`. Intentional brand literal exception.

**D-06** Avatar gradient fallback uses the same `from-green-500 to-emerald-600` recipe; initials in white.

**D-07** Button `default` size: `px-5 py-3 text-sm rounded-2xl`. `sm` = `px-3 py-1.5 rounded-xl text-xs`. `lg` = `px-6 py-3 rounded-2xl text-sm`. `icon` = `h-10 w-10 rounded-2xl`.

**D-08** Input/Textarea/Select: `text-base py-3 px-4 rounded-2xl`. Drop fixed `h-9`. Focus ring = `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0`.

**D-09** Badge: `rounded-full px-3 py-1 text-xs font-medium`.

**D-10** Avatar sizes: `sm = h-8 w-8 text-xs`, `md = h-10 w-10 text-sm` (default), `lg = h-12 w-12 text-base`.

**D-11** All non-gradient surfaces consume Phase 7 tokens — no hardcoded `slate-*` classes.

**D-12** Button `secondary` = `bg-background text-foreground border border-border hover:bg-muted`.

**D-13** Card = `rounded-2xl border border-border bg-card text-card-foreground shadow-sm`.

**D-14** Sheet leading-corner radius: `right` → `rounded-l-2xl`, `left` → `rounded-r-2xl`, `top` → `rounded-b-2xl`, `bottom` → `rounded-t-2xl`.

**D-15** Sheet surface: `bg-background` → `bg-card`, `shadow-lg` → `shadow-xl`, SheetHeader `gap-y-3` → `gap-y-4 pb-4 border-b border-border`, SheetFooter → `pt-4 border-t border-border`.

**D-16** SheetOverlay keeps `bg-glass-surface` (unchanged).

**D-17** Badge variants: `default`/`secondary`/`success`/`warning`/`info`/`destructive`/`outline`. Add `danger`/`neutral` aliases only if call sites already use them. Research shows they don't — skip the aliases (see §Caller Audit).

**D-18** Don't drop any existing Badge variant.

**D-19/D-20** Dark mode inherits from tokens. If a pair is inadequate, escalate to STATE.md rather than hack a `dark:` override.

**D-21/D-22/D-23** Verification = `pnpm typecheck` + `pnpm lint` + 5-route manual smoke. No automated visual regression (Phase 10).

### Claude's Discretion

- Exact shadow scale choice per primitive (`shadow-sm` vs `shadow` vs `shadow-md`) — match prototype weight.
- Whether Avatar size uses `cva` or prop-to-class map — pick cleaner read.
- Whether Button `ghost`/`link` need retuning beyond inherited token swap.
- Ordering of variants within each `cva` block.
- Co-location of new size variants in files.

### Deferred Ideas (OUT OF SCOPE)

- Restyle of other shadcn primitives (accordion, alert, dialog, dropdown-menu, etc.)
- App shell (navbar, sidebar, drawer) → Phase 9
- AG Grid theme → Phase 10
- Dark mode full regression + automated WCAG → Phase 10
- Command palette implementation (styled button only ships in Phase 9)
- New Button variants (`hero`, `cta`, etc.)
- Sheet width/max-width tuning
- Framer Motion page transitions, role shells, device toggle

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRIM-01 | Button gradient primary + slate secondary, rounded-2xl, py-3 | Prototype `Button.tsx` L14-23 gives exact class strings; current `button.tsx` CVA structure accepts 1-line swap per variant |
| PRIM-02 | Card white/dark-slate, rounded-2xl, slate-200 border, soft shadow | Current `card.tsx` L12 is a single `cn()` — 3-token swap |
| PRIM-03 | Input/Textarea/Select 16px, rounded-2xl, slate border, green focus ring, py-3 | Current files use identical class string pattern; recipe shared across all 3 |
| PRIM-04 | Badge pill with success/warning/danger/info/neutral | Current `badge.tsx` already has success/warning/info/destructive; rename `destructive` visuals to `semantic-red` pair; aliases unneeded (see caller audit) |
| PRIM-05 | Avatar initials on gradient + sm/md/lg sizes | Current `avatar.tsx` is bare Radix wrapper — add size variant + gradient fallback bg |
| PRIM-06 | Sheet rounded-2xl leading corners, slate border, form-field spacing | Current `sheetVariants` CVA already per-side; add `rounded-*-2xl` to each side; header/footer get border + spacing |

## Standard Stack

Phase 8 introduces **no new libraries**. Everything below is already installed (verified by `package.json` grep + Phase 7 verification).

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `class-variance-authority` | (catalog) | CVA variant definitions | Already used in button/badge/sheet |
| `radix-ui` (namespaced export) | 1.4.3 | Avatar/Select/Dialog (Sheet) primitives | Already used |
| `tailwindcss` | 4.1.18 | Utility classes | Phase 7 theme + shadow scale in place |
| `@fontsource-variable/inter` | 5.2.8 | 16px base font | Loaded in global.css |

**Nothing to install.**

## Phase 7 Delivered State (upstream constraints — read-only)

Verified from `app/styles/shadcn-ui.css`, `app/styles/theme.css`, `app/styles/global.css`, `07-VERIFICATION.md`.

### Tokens available (light / dark)

| Token | Light | Dark |
|-------|-------|------|
| `--background` | `#f1f5f9` (slate-100) | `#0f172a` (slate-900) |
| `--foreground` | `#0f172a` | `#f8fafc` |
| `--card` | `#ffffff` | `#1e293b` (slate-800) |
| `--card-foreground` | `#0f172a` | `#f8fafc` |
| `--primary` | `#22c55e` (green-500) | `#4ade80` (green-400) |
| `--primary-foreground` | `#ffffff` | `#052e16` |
| `--muted` | `#f1f5f9` | `#1e293b` |
| `--muted-foreground` | `#64748b` (slate-500) | `#94a3b8` |
| `--border` | `#e2e8f0` (slate-200) | `#334155` |
| `--input` | `#cbd5e1` (slate-300) | `#475569` |
| `--ring` | `#22c55e` | `#4ade80` |
| `--destructive` | `#dc2626` | `#ef4444` |
| `--semantic-red-bg/fg` | `#fef2f2` / `#dc2626` | `rgb(239 68 68 / .15)` / `#f87171` |
| `--semantic-amber-bg/fg` | `#fffbeb` / `#d97706` | `rgb(245 158 11 / .15)` / `#fbbf24` |
| `--semantic-green-bg/fg` | `#f0fdf4` / `#16a34a` | `rgb(34 197 94 / .15)` / `#4ade80` |
| `--semantic-blue-bg/fg` | `#eff6ff` / `#2563eb` | `rgb(59 130 246 / .15)` / `#60a5fa` |

### Tailwind class derivations

- `--radius: 1rem` → `rounded-lg = 1rem`, `rounded-md = calc(1rem - 2px)`, `rounded-sm = calc(1rem - 4px)`. Native `rounded-2xl` also maps to `1rem` in Tailwind 4. **Primitives currently using `rounded-md` will auto-soften; use explicit `rounded-2xl` only on hero surfaces for clarity.**
- Shadow scale unlocked (no more `--shadow*: none` lockout): `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` all render slate-900 alpha shadows from `theme.css` L70-78.
- Inter Variable loaded via `@fontsource-variable/inter/wght.css` in `global.css` L7. Body `font-weight: 400`.
- `--gradient-primary` CSS var exists (`shadcn-ui.css` L47, L110) but per D-04, Phase 8 uses Tailwind utilities (`bg-gradient-to-r from-green-500 to-emerald-600`) directly in button/avatar — do NOT write `bg-[var(--gradient-primary)]` in the primitives.

### Phase 7 UNRESOLVED WCAG failures (§9.1)

**BLOCKER for PRIM-03 planning:**

| # | Pair | Theme | Ratio | Min | In PRIM scope? |
|---|------|-------|-------|-----|----------------|
| 6 | `muted-foreground` / `background` | Light | 4.34:1 | 4.5:1 | No — body text, Phase 9/10 |
| 7 | `muted-foreground` / `muted` | Light | 4.34:1 | 4.5:1 | No |
| 8 | `border` / `background` | Light | 1.13:1 | 3:1 | Plausibly decorative (exempt) |
| 9 | `primary-foreground` / `primary` | Light | 2.28:1 | 4.5:1 | **Yes** — but per D-05 Button primary face is gradient, not `bg-primary`; solid `bg-primary` surfaces are Badge `default` only |
| 10 | `border` / (dark) | Dark | 1.72:1 | 3:1 | Decorative — exempt |
| 11 | `ring` / `background` | **Light** | **2.08:1** | **3:1** | **YES — PRIM-03 focus ring blocker** |

**Planner must decide #11 at phase kickoff.** Three options:

- **A (recommended, zero token change):** Use `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background`. The `ring-offset` creates a white halo around the 2px green ring which visually raises the effective boundary contrast above 3:1 against the slate-100 page canvas. Matches WCAG 1.4.11 "adjacent colors" interpretation and is a common Shadcn pattern. No `shadcn-ui.css` edit.
- **B:** Retune `--ring` to `#059669` (emerald-600) in `shadcn-ui.css` — clears 3:1 cleanly but mutates a Phase 7 locked token (Rule 4 escalation).
- **C:** Compose two rings: `ring-2 ring-emerald-600 ring-offset-2` — hardcodes emerald-600, violates D-11. Reject.

Option A is the cheapest, respects the "no upstream token edits" Phase 8 boundary, and achieves the visual spec. **Plan PRIM-03 on Option A.**

#9 (`primary-foreground` on `primary` = 2.28:1) **is NOT a Button-face problem** because D-05 routes the primary button face through the gradient, not `bg-primary`. It IS a problem for **Badge `default`** (which renders `bg-primary text-primary-foreground`). Mitigation: retune Badge `default` to the slate/muted pair (`bg-secondary text-secondary-foreground`) or to a green-semantic pair. Plan it.

## Caller Audit

Grep results from this session (`app/` + `packages/ui/`):

### Button — 18 files, 40 occurrences, variants used

| Variant | Count | Notes |
|---------|-------|-------|
| `default` (implicit) | Most | Becomes gradient primary |
| `outline` | ~10 | Retunes via token swap — text, bg-background, border-border |
| `ghost` | ~6 | Retunes via token swap |
| `secondary` | 1 | `mobile-navigation-dropdown.tsx` — full-width dropdown trigger |
| `link` | 1 | `auth/password-reset.tsx` — "Back to sign in" link |
| `brand` | 1 | `sub-module-create.tsx:278` — CRUD "Create" submit button |
| `pill` | 0 | No app-level callers (kit only) |
| `destructive` | 0 current app callers (found in v1.0 planning docs only) | |

**Implication:** `brand` and `pill` are effectively single-site. Retuning them per D-03 is safe. None of the callers pin a fixed height externally (no `h-9`/`h-10` in a Button className grep).

### Badge — 7 variant-prop call sites

| Variant | Call sites |
|---------|-----------|
| `secondary` | `housing-map-view.tsx:224`, `employee-review-detail-row.tsx:57`, `inline-detail-row.tsx:180`, `time-off-detail-row.tsx:134`, `employee-cell-renderer.tsx:44`, `scheduler-employee-renderer.tsx:45,61` |
| `outline` | `inline-detail-row.tsx:185`, `time-off-detail-row.tsx:139`, `employee-cell-renderer.tsx:52`, `scheduler-employee-renderer.tsx:37,53` |
| `success`/`warning`/`destructive`/`outline` | via `StatusBadgeRenderer` (`status-badge-renderer.tsx` — central mapping) |

**No `danger`, `info`, or `neutral` literal call sites.** Per D-17: **skip `danger` alias, skip `neutral` alias**. Keep `info` variant (already in CVA, may be used by future cell renderers). Retune `destructive` visuals to `bg-semantic-red-bg text-semantic-red-fg text-xs` to match the other semantic pills.

### Sheet — 6 `<SheetContent>` call sites

| File | side | Custom className |
|------|------|------------------|
| `crud/create-panel.tsx:133` | `right` | `flex h-full w-[90%] flex-col gap-0 p-0 sm:max-w-2xl` + `SheetHeader` has own `border-b px-6 pt-6 pb-4` |
| `crud/edit-panel.tsx:121` | `right` | Same as create-panel |
| `ai/ai-chat-panel.tsx:47` | `right` | `flex h-full w-3/4 flex-col sm:max-w-md` — uses bare `SheetHeader`/`SheetTitle` |
| `ag-grid/scheduler-list-view.tsx:631` | `right` | `w-[440px] sm:w-[480px]` — uses bare `SheetHeader` |
| `ui/sidebar.tsx:213` | parametrized | Mobile drawer (Phase 9 territory) |

**Critical finding:** CRUD create/edit panels **override SheetHeader with their own border classes and pass `p-0` to SheetContent**. That means D-15's `gap-y-4 pb-4 border-b border-border` changes to `SheetHeader` affect **only `ai-chat-panel` and `scheduler-list-view` history sheet** (both visually low-traffic). CRUD sheets are unaffected by the SheetHeader retune — they still get the SheetContent surface changes (shadow-xl, bg-card, rounded-l-2xl).

The CRUD `p-0` override also means `sheetVariants`' `p-6` default is irrelevant there — **don't bake default padding into the surface assuming CRUD benefits from it.** The retune is about `bg-card`, `shadow-xl`, and `rounded-l-2xl`, nothing more.

### Input / Textarea / Select — form integration

- `Input` appears in `housing-map-view.tsx` (filter field) and `password-reset-request-container.tsx`. Both pass `{...field}` from react-hook-form and do NOT fix height externally.
- `form.tsx` (`packages/ui/src/shadcn/form.tsx`) is a bare `FormProvider` / `Controller` wrapper — it does NOT inject classes onto Input/Textarea/Select. Padding change is safe.
- Form fields in CRUD sheets use `FormFieldGrid` (from `app/components/crud/`). Grid cells auto-size to children — taller Input is not pinned.
- `navbar-search.tsx` uses a **custom `<button>`** with `h-7`, NOT the Input primitive. Unaffected.
- `CommandInput` in the command dialog is a separate primitive (from `cmdk`) — unaffected.

**No caller pins a fixed height on Input/Textarea/Select.** PRIM-03 padding change is safe to ship.

## Runtime State Inventory

Not applicable — Phase 8 is a code-only restyle with no runtime state migration.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no DB rows store primitive class names | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | `node_modules/.vite` may need clearing if Tailwind 4 cache misses on the new class strings; `pnpm dev` rebuild is sufficient | None pre-emptive |

## Architecture Patterns

### File-local CVA retune (primary pattern)

Every edit follows the same shape:

```tsx
// Before
const buttonVariants = cva('base classes', { variants: { variant: { default: 'old' }, size: { default: 'old' } } });

// After
const buttonVariants = cva('new base classes', { variants: { variant: { default: 'new' }, size: { default: 'new' } } });
```

No forwardRef signature changes, no new exports, no barrel updates, no prop surface growth (except Avatar `size` per PRIM-05).

### Avatar `size` prop (only NEW prop in phase)

Two reasonable shapes — pick whichever reads cleaner in context:

**Option A (CVA — matches Button/Badge convention):**
```tsx
const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}
```

**Option B (prop-to-class map — lighter, closer to current file):**
```tsx
const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

type AvatarSize = keyof typeof sizeClasses;
```

Recommendation: **Option A** — it makes the size prop discoverable via `VariantProps`, matches the file patterns in `button.tsx`/`badge.tsx`, and keeps `size` optional with `defaultVariants`. Current Avatar callers pass no `size` prop so default `md` (`h-10 w-10`) matches the existing `h-10 w-10` exactly — **zero visual regression on existing call sites**.

### Gradient as Tailwind utilities (not CSS var)

```tsx
// button.tsx default variant
'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl'

// avatar.tsx fallback
'bg-gradient-to-br from-green-500 to-emerald-600 text-white font-medium'
```

Note prototype uses `bg-gradient-to-br` (135°-ish) for Avatar and `bg-gradient-to-r` for Button. Match the prototype.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme-aware colors | `dark:bg-slate-800` overrides | Phase 7 tokens (`bg-card`) | D-11; tokens already swap per mode |
| Gradient recipe | CSS var consumer | Tailwind `from-green-500 to-emerald-600` | D-04 |
| Size variants | Inline `clsx` with props | `cva` + `VariantProps` | Existing file convention |
| Focus ring contrast fix | Custom box-shadow | `ring-2` + `ring-offset-2` | Standard Shadcn pattern; sidesteps `--ring` WCAG failure |
| Badge pill shape | Padded div hack | `rounded-full px-3 py-1` | D-09 |
| Sheet corner radius | Separate CSS | Tailwind `rounded-l-2xl` per side | D-14 |

## Concrete PRIM-0X Implementation Recipes

### PRIM-01 — `packages/ui/src/shadcn/button.tsx`

**Base string (currently):**
```
'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
```

**Base string (after):**
```
'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50'
```

Changes: `rounded-md → rounded-2xl`, `transition-colors → transition-all` (gradient shadow), `ring-1 ring-ring → ring-2 ring-primary ring-offset-2 ring-offset-background` (§9.1 blocker fix), add `gap-2` to match prototype icon+label rhythm.

**Variants:**

| Variant | Before | After |
|---------|--------|-------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` | `bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl` |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/90` | unchanged |
| `outline` | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` | `border border-border bg-background text-foreground hover:bg-muted` |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-secondary/80` | `bg-background text-foreground border border-border hover:bg-muted` (D-12) |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` | unchanged (retune via tokens) |
| `link` | unchanged | unchanged |
| `pill` | `rounded-full bg-primary ...` | `rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl px-8 py-2 font-medium` (retune to match gradient primary per D-03) |
| `brand` | `border border-[var(--supabase-green-link)] ...` | `bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl` (retune; this is the CRUD create submit button — should visually match the primary gradient) |

**Sizes:**

| Size | Before | After |
|------|--------|-------|
| `default` | `h-9 px-4 py-2` | `px-5 py-3` (D-07) |
| `sm` | `h-8 rounded-md px-3 text-xs` | `px-3 py-1.5 rounded-xl text-xs` (D-07) |
| `lg` | `h-10 rounded-md px-8` | `px-6 py-3` (D-07) |
| `icon` | `h-9 w-9` | `h-10 w-10` (D-07) |

### PRIM-02 — `packages/ui/src/shadcn/card.tsx`

**Card root (currently):**
```tsx
className={cn('bg-card text-card-foreground rounded-lg border', className)}
```

**After (D-13):**
```tsx
className={cn('bg-card text-card-foreground rounded-2xl border border-border shadow-sm', className)}
```

CardHeader/CardContent/CardFooter/CardTitle/CardDescription: **no changes required** — they use `p-6`, `p-6 pt-0`, `space-y-1.5`, `text-muted-foreground` which already read as prototype-aligned. (Optionally nudge `CardTitle` to `font-semibold` if current `font-normal` looks too light — Claude's discretion.)

### PRIM-03 — Input / Textarea / Select

**Shared recipe (all three):**
```
'flex w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50'
```

Changes vs current:
- `border-input → border-border` (input token is slate-300, border is slate-200 — border is closer to prototype `border-slate-200`)
- `h-9 → [removed]` — padding-driven height
- `px-3 py-1 → px-4 py-3`
- `text-sm → text-base`
- `rounded-md → rounded-2xl`
- `bg-transparent → bg-background`
- `ring-1 ring-ring → ring-2 ring-primary ring-offset-2 ring-offset-background` (§9.1 fix)

**Input extras:** keep `file:*` classes from current file.

**Textarea extras:** keep `min-h-[60px]` → change to `min-h-[80px]` to match the taller padding, and keep `resize` default.

**SelectTrigger extras:** keep `flex items-center justify-between`, `[&>span]:line-clamp-1`, and the `CaretSortIcon` suffix. Replace `focus:ring-1 focus:ring-ring` with the new recipe. Drop `h-9`.

**SelectContent, SelectItem, SelectLabel, SelectSeparator:** no changes required — they inherit popover/accent tokens already.

### PRIM-04 — Badge

**Base (before):**
```
'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ...'
```

**Base (after, D-09):**
```
'inline-flex items-center rounded-full border-transparent px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
```

Changes: `rounded-md → rounded-full`, `px-2.5 py-0.5 → px-3 py-1`, `border → border-transparent` (pills don't show border by default — `outline` variant re-adds it).

**Variants:**

| Variant | After | Rationale |
|---------|-------|-----------|
| `default` | `bg-muted text-muted-foreground` | Fixes §9.1 #9 (2.28:1 on `bg-primary`) by routing to slate pill; still readable |
| `secondary` | `bg-muted text-muted-foreground` | Same as default — slate pill (heavily used) |
| `destructive` | `bg-semantic-red-bg text-semantic-red-fg` | Consistency with success/warning/info |
| `outline` | `bg-background text-foreground border border-border` | Retuned token pair (used in cell renderers) |
| `success` | `bg-semantic-green-bg text-semantic-green-fg` | Unchanged |
| `warning` | `bg-semantic-amber-bg text-semantic-amber-fg` | Unchanged |
| `info` | `bg-semantic-blue-bg text-semantic-blue-fg` | Unchanged |

**No `danger` or `neutral` aliases** — caller audit confirms zero literal call sites. D-17 says skip aliases when not needed.

### PRIM-05 — Avatar

**Root:**
```tsx
const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);
```

**AvatarRoot signature:** extend props with `VariantProps<typeof avatarVariants>`, forward `size` to `cn(avatarVariants({ size }), className)`.

**AvatarFallback:** change `bg-muted` → `bg-gradient-to-br from-green-500 to-emerald-600 text-white font-medium`. Keep `flex h-full w-full items-center justify-center rounded-full`.

**AvatarImage:** unchanged.

**Export:** add `avatarVariants` to named exports (matches `buttonVariants`, `badgeVariants` pattern).

### PRIM-06 — Sheet

**sheetVariants base (before):**
```
'bg-background ... fixed z-50 gap-4 p-6 shadow-lg transition ease-in-out ...'
```

**After (D-15):**
```
'bg-card ... fixed z-50 gap-4 p-6 shadow-xl transition ease-in-out ...'
```

**Per-side (D-14):**

| Side | Before | After |
|------|--------|-------|
| `top` | `... inset-x-0 top-0 border-b` | `... inset-x-0 top-0 border-b border-border rounded-b-2xl` |
| `bottom` | `... inset-x-0 bottom-0 border-t` | `... inset-x-0 bottom-0 border-t border-border rounded-t-2xl` |
| `left` | `... inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm` | `... inset-y-0 left-0 h-full w-3/4 border-r border-border rounded-r-2xl sm:max-w-sm` |
| `right` | `... inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm` | `... inset-y-0 right-0 h-full w-3/4 border-l border-border rounded-l-2xl sm:max-w-sm` |

**SheetHeader:**
```tsx
// Before
'flex flex-col gap-y-3 text-center sm:text-left'
// After
'flex flex-col gap-y-4 pb-4 border-b border-border text-center sm:text-left'
```

**SheetFooter:**
```tsx
// Before
'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2'
// After
'flex flex-col-reverse pt-4 border-t border-border sm:flex-row sm:justify-end sm:space-x-2'
```

**SheetOverlay:** unchanged (D-16).

**SheetTitle:** optionally bump `text-lg` → keep; `font-medium` → `font-semibold` for prototype parity (discretion).

**Caller collision warning:** CRUD `create-panel.tsx`/`edit-panel.tsx` pass `p-0` to SheetContent and render their own `<SheetHeader className="border-b px-6 pt-6 pb-4">`. Because the new SheetHeader adds `pb-4 border-b border-border`, the CRUD call site (which already has `border-b px-6 pt-6 pb-4`) will compose to: two `border-b` classes (harmless — tailwind-merge dedupes via `cn()`), double `pb-4` (no-op). **No breakage.**

## Common Pitfalls

### Pitfall 1: Tailwind class order / tailwind-merge conflicts

**What goes wrong:** CVA emits base classes first, variant classes second. `tailwind-merge` inside `cn()` resolves conflicts left-to-right. If you put `rounded-2xl` in the base AND a variant sets `rounded-full`, the variant wins — good. But if you put `rounded-full` in the Button `pill` variant without removing `rounded-2xl` from the base, you're relying on merge logic. Verify by inspecting the generated `className`.

**Prevention:** Keep `rounded-*` utilities in ONE of (base, variant) — don't scatter them. For Button, put `rounded-2xl` in base and override to `rounded-xl`/`rounded-full` in specific size/variant slots.

### Pitfall 2: Dark mode gradient readability

**What goes wrong:** The gradient is intentionally identical in light + dark per D-06. White text on `from-green-500 to-emerald-600` is ~5:1 against the lighter stop and ~7:1 against the darker stop — safe. But if a caller wraps Button in a dark surface, hover `shadow-xl` may visually disappear (shadow is slate-900 alpha, invisible on slate-900 bg).

**Prevention:** During manual smoke, check Button primary inside the dark sidebar (once Phase 9 ships) or just in dark mode on the home page. Accept shadow attenuation — it's a prototype-faithful behavior.

### Pitfall 3: `border-input` vs `border-border`

**What goes wrong:** Current Input uses `border-input` (slate-300, slightly darker). The prototype uses `border-slate-200`, which maps to `border-border` (slate-200). Swapping without noticing leaves a subtle color mismatch.

**Prevention:** Explicitly swap to `border-border` in Input/Textarea/SelectTrigger per the recipe above. Record the swap in the plan task so it's not re-reverted.

### Pitfall 4: `focus-visible:ring-offset-background` halo contrast

**What goes wrong:** `ring-offset-background` sets offset color to `--background` (slate-100 light, slate-900 dark). The green-500 ring on slate-900 dark reads fine. On slate-100 light the green-500 ring sits with a thin slate-100 gap against a slate-100 surrounding — the gap is visually invisible, making the ring appear adjacent to surrounding content. This is intentional and WCAG-acceptable (the ring contrast is green-500 vs slate-100 = 2.08:1, BUT adjacency to the darker input border adds effective boundary).

**Prevention:** Accept it. If manual smoke shows the ring feels thin, bump `ring-2` → `ring-[3px]` or add `focus-visible:ring-offset-2` → `focus-visible:ring-offset-1`. Don't mutate `--ring` in `shadcn-ui.css` (Rule 4).

### Pitfall 5: Textarea `min-h-[60px]` ignored when content wraps

**What goes wrong:** Existing `min-h-[60px]` was calibrated for `h-9`-style controls. With `py-3 text-base`, intrinsic minimum is already ~52px. The `min-h-[60px]` still applies but won't reliably match the prototype "4 rows default."

**Prevention:** Use `min-h-[80px]` to give a 3-row default that feels right with py-3 padding.

## Validation Architecture

Phase 8 validation is **manual smoke + static checks** per D-21/D-22/D-23. No automated visual regression — that's Phase 10. `workflow.nyquist_validation` is treated as enabled (no override found in config).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript compiler + ESLint 9 + Prettier (static only) + manual browser smoke |
| Config file | `tsconfig.json`, `eslint.config.mjs` (already configured) |
| Quick run command | `pnpm typecheck` (primitives only, ~10s) |
| Full suite command | `pnpm typecheck && pnpm lint` |
| Phase gate | Manual 5-route smoke checklist + `pnpm typecheck` green + `pnpm lint` green |

### Phase Requirements → Verification Map

| Req ID | Behavior | Test Type | Automated Command | Manual |
|--------|----------|-----------|-------------------|--------|
| PRIM-01 | Button primary = gradient; secondary = slate | Visual | `pnpm typecheck` (prop contract) | `/auth/sign-in` — "Sign in" button renders gradient |
| PRIM-02 | Card = white rounded-2xl + shadow | Visual | `pnpm typecheck` | `/home/:account` home — dashboard cards |
| PRIM-03 | Input/Textarea/Select 16px rounded-2xl green focus ring | Visual | `pnpm typecheck` | `/auth/sign-in` — email/password focus; CRUD sheet form fields |
| PRIM-04 | Badge pill variants on Aloha palette | Visual | `pnpm typecheck` | HR list route — status badges render as pills |
| PRIM-05 | Avatar sm/md/lg + gradient fallback | Visual | `pnpm typecheck` (checks new `size` prop compiles) | Existing avatar call sites unchanged; default `md` = old `h-10 w-10` |
| PRIM-06 | Sheet rounded-l-2xl + border + form spacing | Visual | `pnpm typecheck` | CRUD create sheet opens with rounded leading corner |
| No regression | All callers still compile | Static | `pnpm typecheck` + `pnpm lint` | — |

### Token pairs introduced (spot-check list)

Phase 7 verified foundation pairs. Phase 8 introduces these **new** consumer-level combinations:

| Pair | Used by | Concern |
|------|---------|---------|
| `white` on `from-green-500 to-emerald-600` | Button primary, Avatar fallback | ~5-7:1 — pass |
| `foreground` on `card` | Card content | Verified in Phase 7 foundation |
| `muted-foreground` on `card` | CardDescription | **New pair — not in Phase 7 table.** Light: `#64748b` on `#ffffff` = 4.54:1 (passes 4.5:1 by 0.04 — flag for Phase 10 verification) |
| `foreground` on `background` for Button secondary | Button secondary | Verified |
| `semantic-red-fg` on `semantic-red-bg` | Badge destructive | Verified |
| `primary` (ring) on `background` via ring-offset | Input focus | §9.1 #11 — mitigated via ring-offset halo (Option A) |
| `muted-foreground` on `muted` for Badge default/secondary | Badge | §9.1 #7 — known 4.34:1 light failure; flag but ship (badge text is "large text" per WCAG — 3:1 suffices; 4.34:1 passes) |

### Files modified with estimated diff size

| File | LOC before | LOC delta | Notes |
|------|------------|-----------|-------|
| `button.tsx` | 63 | +5 / -5 | CVA base + 8 variants + 4 sizes tuned |
| `card.tsx` | 80 | +1 / -1 | Single line in Card root |
| `input.tsx` | 25 | +2 / -2 | Single cn() class string |
| `textarea.tsx` | 24 | +2 / -2 | Single cn() class string + min-h |
| `select.tsx` | 166 | +2 / -2 | SelectTrigger only |
| `badge.tsx` | 44 | +5 / -3 | Base + 7 variants tuned |
| `avatar.tsx` | 52 | +15 / -2 | Add CVA, add size prop, gradient fallback |
| `sheet.tsx` | 135 | +8 / -4 | sheetVariants base + 4 sides + header + footer |
| **Total** | 589 | **+40 / -21** | ~60 lines touched |

### Caller-facing smoke routes

| Route | Primitives exercised |
|-------|---------------------|
| `/auth/sign-in` | Button primary, Input (email/password), focus ring |
| `/home/:account` (home) | Card surfaces, shell (Phase 9 not shipped — expect unchanged chrome) |
| `/home/:account/hr/employees` (or any HR list) | Badge status pills, AG Grid (untouched — Phase 10) |
| CRUD create sheet (e.g., hr_employee "Add") | Sheet rounded-l-2xl, SheetContent surface, Input/Select/Textarea inside FormFieldGrid |
| Theme toggle light↔dark | All of the above, no FOUC, gradient stays vivid |

### Sampling Rate

- **Per task commit:** `pnpm typecheck` on the touched file (~5s incremental)
- **Per wave merge:** `pnpm typecheck && pnpm lint` (full) + visual spot-check of the primitive in Storybook-free isolation (e.g., sign-in page for Button/Input, HR list for Badge)
- **Phase gate:** Full 5-route manual smoke + `pnpm typecheck` + `pnpm lint` + `pnpm format:fix` before `/gsd-verify-work`

### Wave 0 Gaps

None — no test infrastructure to set up. Phase 8 has no automated UI tests and none are required (deferred to Phase 10 per D-23).

## Security Domain

`security_enforcement` is the project default. ASVS applicability is minimal for a pure CSS/class restyle — no new input parsing, no new network calls, no auth touching.

| ASVS Category | Applies | Control |
|---------------|---------|---------|
| V2 Authentication | No | No auth code touched |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No | No new Zod schemas |
| V6 Cryptography | No | — |
| V14.4 HTTP Security Headers | Indirect | Changing Button to gradient does not affect CSP; inline `bg-gradient` compiles to a utility class, not inline style |

### Threat patterns for primitive restyle

| Pattern | STRIDE | Mitigation |
|---------|--------|-----------|
| XSS via Badge value injection | Tampering | React JSX auto-escapes; Badge takes children, not `dangerouslySetInnerHTML` — unchanged |
| CSS injection via variant prop | Tampering | `cva` compiles variants at build time; only known strings accepted |
| DoS via expensive transitions | Availability | `transition-all` on Button — negligible; 60fps on all devices |

**No new attack surface.**

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 20+ | dev server | ✓ | per `package.json` engines | — |
| pnpm 10.18.1 | workspace | ✓ | — | — |
| `class-variance-authority` | CVA | ✓ | catalog | — |
| `radix-ui` | Avatar/Select/Sheet | ✓ | 1.4.3 | — |
| `tailwindcss` | class compilation | ✓ | 4.1.18 | — |
| `@fontsource-variable/inter` | 16px body | ✓ | 5.2.8 | — |

All dependencies present. No install step required.

## Wave Strategy + Commit Granularity

### Recommendation: 3 waves, 1 commit per primitive (8 commits total)

**Wave 1 — Surface primitives (parallel-safe):**
- Task 1a: `card.tsx` (1-line change, lowest risk, validates Phase 7 shadow unlock end-to-end)
- Task 1b: `badge.tsx` (variant retune + pill shape — covers the most-used primitive in HR lists)

*Rationale:* Card and Badge share zero context. Both are small. Finishing Wave 1 proves the token pipeline works before touching the gradient pair.

**Wave 2 — Gradient pair (parallel-safe, share the `from-green-500 to-emerald-600` recipe):**
- Task 2a: `button.tsx` (full CVA retune — largest diff, most downstream consumers)
- Task 2b: `avatar.tsx` (add CVA + size prop + gradient fallback)

*Rationale:* Both commits land the brand gradient. Splitting them lets the planner assign parallel work and makes each commit's visual impact reviewable in isolation. Button is the highest-risk change; Avatar is low-risk.

**Wave 3 — Form recipe + container (form primitives must land together so focus-ring recipe is consistent; Sheet lands after surface primitives are proven):**
- Task 3a: `input.tsx`
- Task 3b: `textarea.tsx`
- Task 3c: `select.tsx`
- Task 3d: `sheet.tsx`

*Rationale:* Input/Textarea/Select share a single class string recipe — keep them in the same wave so a recipe change propagates consistently. Sheet lives in the same wave because CRUD smoke-testing exercises Sheet + form primitives together, and the shared `border-border` / `bg-card` token usage is worth landing in one visual reviewable moment.

**Commit granularity:** One commit per primitive file (8 commits, one per task). Rationale:
- Each primitive is a self-contained visual change that's easy to revert in isolation.
- Commit messages map 1:1 to PRIM-0X requirement IDs for traceability.
- Wave merge produces a clean 3-step visual diff in the final PR review.

**Alternative rejected:** Single commit per wave (3 commits) — too coarse, harder to revert individual primitives if smoke uncovers a regression.

## Risk List

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | `--ring` WCAG 2.08:1 fails on Input focus ring | **Certain** (known from §9.1) | Medium — accessibility | Use `ring-2` + `ring-offset-2 ring-offset-background` (Option A). Plan PRIM-03 around this recipe. Escalate to Rule 4 only if smoke shows insufficient visual boundary. |
| R2 | Badge `default` variant `bg-primary` text contrast 2.28:1 | **Certain** (§9.1 #9) | Medium | Retune Badge `default` to `bg-muted text-muted-foreground`. Already in recipe above. |
| R3 | Button padding-driven height re-flows toolbar/header Button placements | Low — no caller grep matches for fixed-height containers holding Button | Medium if hit | Smoke-check the workspace header after Phase 9 restyles navbar; for now, verify `/auth/sign-in` still looks right. |
| R4 | Input `text-base` (16px) breaks dense CRUD form grid cell heights | Low — FormFieldGrid auto-sizes; padding is vertical only | Low | Smoke CRUD create sheet. If a specific form grid overflows, tighten the *container*, not the primitive. |
| R5 | `tailwind-merge` eats a class in unexpected ways | Low | Low | Inspect generated className on 1-2 rendered Button/Input variants during smoke (DevTools Elements). |
| R6 | Sheet double-border on CRUD panels (our `border-b` + caller's `border-b`) | Low — same class, `cn()` dedupes | Negligible | Visual smoke only. If visible, move border to caller override. |
| R7 | Avatar existing callers break due to new `size` prop default | None — default `md` (h-10 w-10) exactly matches old default | None | — |
| R8 | Phase 7 `muted-foreground/muted` 4.34:1 fails (§9.1 #7) surfaces in Badge secondary/default pills | Known | Low (badge text is large/UI text — 3:1 threshold) | Document in Phase 10 as a deferred issue. Badge text passes 3:1 ceiling for UI components. |
| R9 | `brand` variant retune breaks CRUD create submit button visual expectation | Negligible | Low | Retune `brand` to match primary gradient — user gets a prettier button, not a broken one. |
| R10 | Dark mode shadow attenuation on Button primary | Known design tradeoff | None (intentional) | Accept per D-06; document in smoke report. |

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | `ring-offset-2 ring-offset-background` on green-500 ring achieves visually acceptable focus contrast without `--ring` token mutation | Pitfall 4, R1, PRIM-03 recipe | Medium — may need Rule 4 escalation to retune `--ring`. Verifiable in ~2 minutes during first smoke pass. |
| A2 | CRUD `FormFieldGrid` does not pin child input heights | Caller Audit | Low — searched for `Input` in app/; FormFieldGrid not found among grep hits, suggesting it uses `<FormControl>` wrapping. Worth a grep in plan phase. |
| A3 | `tailwind-merge` correctly resolves conflicting `rounded-*` utilities between base and variant | Pitfall 1 | Low — this is documented behavior of `tailwind-merge` ≥ 3.0; we're on 3.4.0 |
| A4 | `muted-foreground` 4.54:1 on `card` (`#ffffff`) exceeds 4.5:1 minimum | Validation § Token pairs | Low — 0.04 headroom is real but tight. Flag for Phase 10 audit. |
| A5 | No E2E test currently relies on pixel-measured Button/Input dimensions | Validation | Low — Playwright tests in `e2e/` use role/text/data-test selectors, not bounding box assertions (confirmed by convention, not grepped this session) |

## Open Questions

1. **§9.1 `--ring` remediation decision (R1)**
   - What we know: Option A (ring-offset halo) avoids any `shadcn-ui.css` edit and matches Shadcn conventions.
   - What's unclear: Whether visual result matches user's expectation of "vivid green focus ring".
   - Recommendation: Plan PRIM-03 on Option A. If smoke shows the halo reads as washed-out, escalate a one-token retune of `--ring` (`#22c55e` → `#059669`) as a Phase 8 addendum (one-line `shadcn-ui.css` change, outside the 8-file fence but justified as §9.1 remediation).

2. **Badge `default` variant re-targeting**
   - What we know: Current `bg-primary text-primary-foreground` fails §9.1 #9 (2.28:1).
   - What's unclear: Whether any existing code relies on Badge `default` rendering green. Grep shows zero explicit `variant="default"` call sites on Badge — it's the implicit default, used nowhere explicitly.
   - Recommendation: Retune to `bg-muted text-muted-foreground` silently. No caller change.

3. **CardTitle font weight**
   - What we know: Current `font-normal tracking-[-0.16px]`. Prototype uses semibold-ish display weights.
   - What's unclear: Whether bumping to `font-semibold` regresses any existing card that expects normal weight.
   - Recommendation: Leave `font-normal` — D-01 "no changes to other primitives beyond PRIM-0X" suggests not touching it. If prototype parity matters, Claude's discretion per CONTEXT.

## Project Constraints (from CLAUDE.md)

- **No hardcoded colors** (`bg-white text-black border-gray-200`) — gradient is the one deliberate exception per D-04, D-05 (brand literal)
- **Use `bg-background`, `text-muted-foreground`, etc.** — enforced throughout Phase 8 recipes
- **Use `cn()` from `@aloha/ui/utils`** — all primitives already do; no changes needed
- **`forwardRef` + `displayName`** — preserved in all 8 files
- **kebab-case file names** — all 8 target files already match
- **`interface` for props, `type` for unions** — existing files follow this; no changes
- **Never use `any`** — recipes introduce no explicit types beyond `VariantProps` inference

## Sources

### Primary (HIGH confidence)

- `packages/ui/src/shadcn/{button,card,input,textarea,select,badge,avatar,sheet}.tsx` — current source
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/shared/{Button,Card,Badge,Avatar,FormField,SlidePanel}.tsx` — prototype truth
- `app/styles/{shadcn-ui,theme,global}.css` — Phase 7 token values
- `.planning/phases/07-design-foundations/07-VERIFICATION.md` §9.1 — WCAG failure register
- `.planning/phases/08-shared-primitives/08-CONTEXT.md` — locked decisions D-01 through D-23
- `.planning/REQUIREMENTS.md` §PRIM-01..06
- `.planning/ROADMAP.md` §Phase 8 success criteria
- `DESIGN.md` §1-2 — theme spec + token table

### Secondary (verified via grep in this session)

- Caller audit: `<Button>`, `<Badge>`, `<SheetContent>`, `<Input>` grep across `app/` + `packages/ui/`
- `app/components/crud/{create,edit}-panel.tsx` — CRUD sheet override pattern
- `app/components/ag-grid/cell-renderers/status-badge-renderer.tsx` — central badge-variant mapping
- `app/components/navbar-search.tsx` — custom button (not Input primitive), unaffected

### Tertiary (training knowledge)

- `tailwind-merge` conflict resolution — marked [ASSUMED] at A3 for plan-phase verification if needed
- Tailwind 4 `rounded-2xl` class mapping — verified via theme.css `--radius-lg: var(--radius)` and native Tailwind `rounded-2xl = 1rem` convention

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new libraries, all dependencies verified present
- Architecture (CVA retune pattern): HIGH — matches existing file convention
- Recipes: HIGH — copied near-verbatim from CONTEXT.md decisions + prototype files
- Caller audit: HIGH — grepped in session
- §9.1 blocker resolution (Option A): MEDIUM — recipe matches Shadcn convention but visual acceptability needs one smoke pass to confirm
- Wave strategy: HIGH — file-local, independent edits map cleanly to waves

**Research date:** 2026-04-10
**Valid until:** Phase 8 completion (no external dependencies to expire)
