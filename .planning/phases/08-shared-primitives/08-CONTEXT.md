# Phase 8: Shared Primitives - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** `--auto` (recommended defaults selected by Claude)

<domain>
## Phase Boundary

Restyle every shared primitive in `packages/ui/src/shadcn/` to match the Aloha prototype so that shell chrome (Phase 9) and existing CRUD sheets, forms, and list views automatically inherit the new look via the Phase 7 tokens.

**In scope — restyle only (no prop contract changes):**
- `button.tsx` — primary = green-500→emerald-600 gradient + `shadow-green-500/25`, secondary = slate tones, all variants rounded-2xl, generous padding (PRIM-01).
- `card.tsx` — white (light) / dark-slate (dark) surface, rounded-2xl, slate-200 border, soft shadow (PRIM-02).
- `input.tsx`, `textarea.tsx`, `select.tsx` — 16px text, rounded-2xl, slate border, `focus-visible:ring` on `--primary` (green-500), py-3 padding (PRIM-03).
- `badge.tsx` — pill shape (`rounded-full`) with success / warning / danger / info / neutral variants tuned to the Aloha palette (PRIM-04).
- `avatar.tsx` — initials fallback on the Aloha gradient, add `size` variant prop (`sm` / `md` / `lg`) (PRIM-05).
- `sheet.tsx` — rounded-2xl leading corners on left/right slide sides, slate border, form-field spacing in `SheetHeader` / `SheetFooter` (PRIM-06).

**NOT in scope:**
- Navbar, sidebar, mobile drawer (Phase 9).
- AG Grid theme token adaptation + dark mode regression pass (Phase 10).
- Any new components, new variants beyond the PRIM-0X checklist, or prop contract changes.
- Route, loader, action, schema, or form logic changes.
- Restyle of other shadcn primitives not in the PRIM list (accordion, alert, dialog, dropdown-menu, etc.) — those inherit tokens from Phase 7 and are left alone this phase.

</domain>

<decisions>
## Implementation Decisions

### Scope & File Boundaries
- **D-01:** Only these six primitive files are edited: `packages/ui/src/shadcn/{button,card,input,textarea,select,badge,avatar,sheet}.tsx`. No loaders, routes, actions, schemas, forms, config, or CRUD registry touched. Rationale: phase guardrail — visual restyle only.
- **D-02:** No prop contract changes. Every existing `variant`, `size`, and className consumer keeps working. Adding NEW props is allowed only when additive and optional (e.g., Avatar `size`), and only when explicitly required by a PRIM-0X requirement. Rationale: "no breaking changes to component props or usage patterns" (CLAUDE.md Design System Constraints).
- **D-03:** Existing `brand` and `pill` Button variants stay in the file but are retuned to the Aloha palette (they are referenced by a handful of auth / marketing surfaces — retuning keeps them consistent without ripping out call sites). The `default` variant becomes the Aloha gradient primary. Rationale: preserve callers while honoring PRIM-01.

### Gradient Application Strategy
- **D-04:** Apply the green-500→emerald-600 gradient directly in `button.tsx` via Tailwind utilities: `bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 hover:shadow-xl`. Do NOT introduce a `--gradient-primary` CSS custom property. Rationale: the gradient is button-specific in v2.0; Phase 7 left this to the planner and a dedicated utility adds indirection without reuse.
- **D-05:** The primary button uses solid Tailwind color names (`green-500`, `emerald-600`) rather than semantic tokens (`--primary`). Rationale: the gradient is a literal brand element and Phase 7 kept `--primary` as a solid green-500 so standard shadcn primitives that expect a solid color keep working; primary *button* applying the gradient is the one intentional exception.
- **D-06:** Avatar gradient fallback uses the same `from-green-500 to-emerald-600` recipe for visual consistency with the button. Initials render in white.

### Sizing & Padding
- **D-07:** Button `default` size retunes to `px-5 py-3 text-sm rounded-2xl` (from `h-9 px-4 py-2 rounded-md`). `sm` = `px-3 py-1.5 rounded-xl text-xs`, `lg` = `px-6 py-3 rounded-2xl text-sm`, `icon` stays roughly square (`h-10 w-10 rounded-2xl`). Matches prototype `components/shared/Button.tsx`. Rationale: PRIM-01 requires "generous py-3 padding" and "rounded-2xl".
- **D-08:** Input / Textarea / Select sizing shifts from `h-9 text-sm px-3 py-1` to `text-base py-3 px-4 rounded-2xl` with a minimum height sized naturally by the padding (drop the fixed `h-9`). Focus ring = `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0`. Rationale: PRIM-03 requires 16px text + rounded-2xl + py-3 + green-500 focus ring.
- **D-09:** Badge shape changes from `rounded-md px-2.5 py-0.5 text-xs` to `rounded-full px-3 py-1 text-xs font-medium` (pill). Rationale: PRIM-04 explicitly requests "pill".
- **D-10:** Avatar `size` variants: `sm = h-8 w-8 text-xs`, `md = h-10 w-10 text-sm` (default), `lg = h-12 w-12 text-base`. Rationale: PRIM-05.

### Color & Border Application
- **D-11:** All primitives continue to consume Phase 7 tokens (`border-border`, `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `ring-primary`) for non-gradient surfaces. Do NOT hardcode `slate-*` classes for background/border/text where a token exists. Rationale: Phase 7 swapped token VALUES precisely so primitives stay token-driven — hardcoding slate would break dark mode.
- **D-12:** Exception: Button `secondary` variant uses `bg-background text-foreground border border-border hover:bg-muted` — token-driven, matches prototype intent of "white / slate border / slate text" under light + adapts to dark via tokens.
- **D-13:** Card = `rounded-2xl border border-border bg-card text-card-foreground shadow-sm`. Rationale: soft shadow available only now (Phase 7 unlocked shadows); `shadow-sm` matches "soft shadow" from PRIM-02.

### Sheet Styling
- **D-14:** Sheet leading-corner radius: `right`-side sheet gets `rounded-l-2xl` (rounded leading edge only — the edge facing into the viewport), `left`-side gets `rounded-r-2xl`, `top`/`bottom` get `rounded-b-2xl`/`rounded-t-2xl`. Existing CRUD create/edit uses `side="right"`. Rationale: prototype `SlidePanel.tsx` pattern.
- **D-15:** Sheet surface: swap `bg-background` → `bg-card`, `border-l` → `border-l border-border`, `shadow-lg` → `shadow-xl` (deeper shadow for panel prominence). `SheetHeader` `gap-y-3` → `gap-y-4 pb-4 border-b border-border` for clearer header separation. `SheetFooter` gets `pt-4 border-t border-border`. Rationale: PRIM-06 "form-field spacing that matches the prototype".
- **D-16:** Sheet overlay (`SheetOverlay`) keeps `bg-glass-surface` — that token was already tuned in Phase 7 and is not a primitive concern.

### Badge Semantic Variants
- **D-17:** Badge variants keep existing names where they map cleanly and add what's missing:
  - `default` → retuned as neutral pill on `--primary`/`--primary-foreground` (token-driven).
  - `secondary` → neutral slate pill: `bg-muted text-muted-foreground`.
  - `success` → existing `bg-semantic-green-bg text-semantic-green-fg` (retuned in Phase 7).
  - `warning` → existing `bg-semantic-amber-bg text-semantic-amber-fg`.
  - `info` → existing `bg-semantic-blue-bg text-semantic-blue-fg`.
  - `destructive` → semantic red (`bg-semantic-red-bg text-semantic-red-fg` if defined, else fall back to `bg-destructive/10 text-destructive`). Add `danger` as an alias of `destructive` only if call sites already use `danger`; otherwise skip the alias.
  - `outline` → retained, retuned to `text-foreground border-border`.
  - `neutral` → NEW variant alias of `secondary` IF PRIM-04 requires the literal name. Check existing callers first; prefer reusing `secondary` to avoid API surface growth.
- **D-18:** Don't drop any existing Badge variant — retune all to the new palette via Phase 7 tokens, add only variants that PRIM-04 strictly requires and aren't already expressable.

### Dark Mode
- **D-19:** Dark mode correctness comes "for free" as long as every non-gradient surface consumes Phase 7 tokens (D-11). The one gradient exception (primary button, avatar fallback) is intentionally vivid in both modes — the prototype keeps the gradient identical across themes.
- **D-20:** No per-primitive `dark:` utility overrides unless a specific token pair is inadequate. If a contrast gap is discovered during smoke check, **escalate to STATE.md** rather than hacking a `dark:` override into the primitive — token fix belongs upstream in Phase 7 / Phase 10.

### Verification
- **D-21:** `pnpm typecheck` + `pnpm lint` must pass after every primitive edit. Rationale: no prop contract drift.
- **D-22:** Manual smoke checklist (in PLAN.md) at end of phase:
  1. `/auth/sign-in` — Button primary (sign in), Input (email/password), focus ring green.
  2. `/home/:account` home — Card surfaces, shell chrome unchanged (Phase 9 not yet shipped).
  3. Any HR module list route — Badge status pills render, AG Grid untouched (Phase 10).
  4. CRUD create sheet (e.g., hr_employee "Add" button) — Sheet rounded-l-2xl, form field spacing, Input/Select/Textarea styling.
  5. Toggle `next-themes` dark ↔ light on each surface — no regressions, gradient still vivid, text still readable.
- **D-23:** No automated visual regression or playwright snapshot this phase. Rationale: automated UI regression is a Phase 10 deliverable (DARK-02).

### Claude's Discretion
- Exact shadow scale choice per primitive (`shadow-sm` vs `shadow` vs `shadow-md`) — match prototype's visual weight.
- Whether `Avatar` size variant uses `cva` or a simple prop-to-class map — pick whichever reads cleaner given existing file structure.
- Whether Button `ghost` / `link` variants need any retuning beyond inherited token swap — minimal touch if they already look right in manual smoke.
- Ordering of variants within each `cva` block — no external impact, keep diff readable.
- Whether to co-locate new size variants (e.g., Avatar `size`) above or below existing props — match existing conventions in the file.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Aloha Design Source of Truth (prototype)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/shared/Button.tsx` — Gradient primary recipe, padding, rounded-2xl.
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/shared/Card.tsx` — Card surface + border + shadow.
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/shared/Badge.tsx` — Pill variants.
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/shared/Avatar.tsx` — Initials gradient fallback + sizes.
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/shared/SlidePanel.tsx` — Side sheet rounded leading corner + header/footer spacing.
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/shared/FormField.tsx` — Input/Textarea/Select styling reference.
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/index.css` — Prototype tokens (cross-check against current `app/styles/theme.css` post Phase 7).

### Current App Targets (files to modify)
- `packages/ui/src/shadcn/button.tsx`
- `packages/ui/src/shadcn/card.tsx`
- `packages/ui/src/shadcn/input.tsx`
- `packages/ui/src/shadcn/textarea.tsx`
- `packages/ui/src/shadcn/select.tsx`
- `packages/ui/src/shadcn/badge.tsx`
- `packages/ui/src/shadcn/avatar.tsx`
- `packages/ui/src/shadcn/sheet.tsx`

### Upstream Tokens (from Phase 7 — read-only in Phase 8)
- `app/styles/shadcn-ui.css` — `:root` + `.dark` token values (background, foreground, card, primary, border, ring, muted, semantic-*).
- `app/styles/theme.css` — Tailwind 4 `@theme` block mapping CSS vars to Tailwind utilities.
- `app/styles/global.css` — Inter font import, shadow unlock, base layer.
- `DESIGN.md` — Aloha theme spec; single source of truth for color/typography/radius/shadow rationale.

### Planning Artifacts
- `.planning/REQUIREMENTS.md` §Primitives — PRIM-01 through PRIM-06 (acceptance checklist).
- `.planning/ROADMAP.md` §Phase 8 — goal + success criteria.
- `.planning/phases/07-design-foundations/07-CONTEXT.md` — Phase 7 decisions (D-01 through D-16) that constrain this phase: keep var names, light canonical, gradient is button-specific, shadow scale unlocked.
- `.planning/phases/07-design-foundations/07-VERIFICATION.md` — Confirms Phase 7 foundation state.
- `.planning/PROJECT.md` §v2.0 constraints — no new libraries, preserve next-themes, no prop contract changes, WCAG AA.

### Codebase Context
- `.planning/codebase/STRUCTURE.md` — Where primitives live + how they're consumed.
- `.planning/codebase/CONVENTIONS.md` — CVA variant patterns, `cn()` usage.
- `packages/ui/CLAUDE.md` — UI package conventions (already in context): semantic classes only, `bg-background`/`text-foreground`, `cn()` utility, no hardcoded slate.

### External Standards
- WCAG 2.2 AA contrast — 4.5:1 normal text, 3:1 large text / UI component boundaries. Foundation-level pairs verified in Phase 7; Phase 8 primitives inherit token colors so no new verification is needed UNLESS a primitive introduces a color-over-color combination not covered by Phase 7 (e.g., `muted-foreground` on `card`). Planner should enumerate new pairs and flag any gaps for the Phase 10 sweep.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CVA pattern** already used in `button.tsx`, `badge.tsx`, `sheet.tsx` — extending variants or retuning values is a localized edit with no consumer impact.
- **Phase 7 tokens** (`bg-background`, `bg-card`, `text-foreground`, `border-border`, `ring-primary`, `bg-semantic-*-bg`) — every primitive already consumes these; Phase 7 swapped VALUES, Phase 8 only swaps CLASSES (shape/padding/radius) + gradient-specific utilities.
- **Tailwind `from-green-500 to-emerald-600` + `shadow-green-500/25`** — these Tailwind color utilities are already available (standard Tailwind v4 palette); no plugin, no extension needed.
- **`rounded-2xl` utility** — mapped via Phase 7 `--radius: 1rem`; `rounded-2xl` class is native Tailwind.
- **Prototype `shared/*.tsx` components** — direct copy-paste reference for class strings.

### Established Patterns
- **`cn()` from `../lib/utils/cn`** — every primitive uses it; Phase 8 edits stay within this convention.
- **`forwardRef` + `displayName`** — pattern used by button, input, textarea, etc.; Phase 8 keeps this.
- **Variant naming uses lowercase single-word keys** (`default`, `secondary`, `destructive`, `outline`) — Phase 8 matches for any new variant.

### Integration Points
- **Existing callers** (search for `variant="..."` and `size="..."`) — NOT modified. Phase 8 guarantees visual restyle only. Planner should grep existing usages once to confirm no caller relies on pixel-perfect dimensions.
- **`packages/ui/src/shadcn/index.ts`** — barrel file. New size variant on Avatar does not change its exports; no barrel edit needed.
- **AG Grid** consumes `bg-card` / `text-foreground` via `ag-grid-theme.ts` — Phase 8 does not touch AG Grid; full AG Grid adaptation is Phase 10 (GRID-01).
- **CRUD create/edit Sheet** — `app/components/crud/create-panel.tsx` and similar call `<Sheet>` / `<SheetContent side="right">`. Phase 8 restyles the primitive; the call site is untouched.

### Risk Flags
- **Input `h-9` → `py-3` + taller intrinsic height** could shift vertical rhythm in dense forms. Mitigation: smoke check CRUD create sheet for layout breakage; if a specific form breaks, either tighten padding in that form's container (Phase 9) or escalate.
- **Sheet width** (`sm:max-w-sm` ≈ 24rem) unchanged — if prototype used a wider panel, adjust ONLY if PRIM-06 explicitly calls for it; otherwise defer width changes to avoid breaking responsive layout.
- **Button `h-9` fixed height** removed in favor of padding-driven height. Any caller using Button inline inside a fixed-height toolbar (e.g., navbar) may re-flow — mostly Phase 9 territory but worth flagging.

</code_context>

<specifics>
## Specific Ideas

- **Prototype fidelity > exhaustive variants.** Copy class strings from prototype `shared/*.tsx` where possible; don't invent new variants.
- **Gradient is the single most visible change** — primary button and avatar fallback are the brand signature. Make both look right before moving on.
- **`rounded-2xl` base** (Phase 7 `--radius: 1rem`) — Shadcn derived `rounded-lg` = base, `rounded-md` = base - 2px, `rounded-sm` = base - 4px. Primitives that currently use `rounded-md` will look slightly different automatically. Keep explicit `rounded-2xl` on the "hero" primitives (Button primary, Card, Input, Sheet leading edge) to make the shift unambiguous.
- **Focus ring green-500** is a core accessibility + brand element — verify on every form primitive + Button.
- **Sheet leading corner** rounds ONLY on the edge facing the viewport, not both sides — `rounded-l-2xl` on right-side sheets, etc.
- **No global CSS edits.** All styling changes live inside the 8 primitive files. Phase 7 owns global CSS.
- **CLAUDE.md guardrail (`packages/ui/CLAUDE.md`):** "Avoid hardcoded colors like `bg-white text-black border-gray-200`." The gradient is the one deliberate exception (it's a brand literal, not a theme color).

</specifics>

<deferred>
## Deferred Ideas

- **Restyle of other shadcn primitives** (accordion, alert, alert-dialog, dialog, dropdown-menu, navigation-menu, popover, tooltip, checkbox, radio-group, switch, tabs, toggle, etc.) — token-inherit automatically; no explicit restyle this phase. If a specific primitive looks broken during smoke check, capture in STATE.md and decide whether to patch now or defer.
- **App shell** (navbar 72px, sidebar 220/68, mobile drawer) → Phase 9.
- **AG Grid theme adaptation** → Phase 10 (GRID-01).
- **Dark mode full regression + automated WCAG pass** → Phase 10 (DARK-02).
- **Command palette implementation** — only the styled search *button* ships in Phase 9.
- **Framer Motion page transitions, role shells, device toggle, phone frame** — future milestones.
- **New Button variants** (e.g., `hero`, `cta`, `gradient-purple`) — not required by PRIM-01; don't add speculatively.
- **Width/max-width tuning on Sheet** — defer unless CRUD forms actually break.

</deferred>

---

*Phase: 08-shared-primitives*
*Context gathered: 2026-04-10*
