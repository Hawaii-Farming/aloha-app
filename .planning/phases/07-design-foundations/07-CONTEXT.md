# Phase 7: Design Foundations - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** `--auto` (recommended defaults selected by Claude)

<domain>
## Phase Boundary

Establish the Aloha design system as the single source of truth for v2.0. Scope is tokens-and-foundation only:

- Rewrite `DESIGN.md` as the Aloha theme spec (Inter 16px base, slate neutrals, green-500→emerald-600 gradient primary, rounded-2xl radius scale, shadow tokens, light-first).
- Update Tailwind 4 `@theme` block and CSS variables in `app/styles/` to the Aloha palette, font family, radius, and shadow tokens.
- Load Inter via `@fontsource-variable/inter`, replace Geist as body font.
- Ship a derived dark palette whose token pairs pass WCAG AA for shell chrome + primitive text/bg combinations.
- Keep every existing route rendering with NO primitive/shell restyle yet — that is Phases 8–10.

**NOT in this phase:** Button/Card/Input restyle (Phase 8), sidebar/navbar/drawer (Phase 9), AG Grid theme adaptation (Phase 10), new pages, new components, prop changes.

</domain>

<decisions>
## Implementation Decisions

### Token Naming & Migration Strategy
- **D-01:** Keep existing CSS variable names (`--background`, `--foreground`, `--primary`, `--card`, `--border`, `--ring`, `--sidebar-*`, `--semantic-*`, etc.) and **swap their values** to Aloha palette. Do NOT rename tokens. Rationale: zero breakage for primitives, shell, and AG Grid in subsequent phases — existing `bg-primary`/`text-foreground` classes will inherit new look automatically.
- **D-02:** Tailwind 4 `@theme` block in `app/styles/theme.css` remains the single source — mapping `--color-*` → CSS vars. Extend only where DESIGN.md needs new tokens (e.g., gradient stops, shadow scale).
- **D-03:** Remove Supabase-era tokens that have no Aloha counterpart. For tokens kept, document the 1:1 value swap in DESIGN.md.

### Color Palette
- **D-04:** **Light mode is canonical, hand-specified.** Dark palette is also hand-specified (not algorithmically derived) and verified against WCAG AA token-pair by token-pair. Rationale: predictable output, smaller surface area than a derivation function, matches v2.0 constraint "dark mode is derived" = "light-first, dark adapted" (human-curated adaptation, not runtime derivation).
- **D-05:** Neutrals = Tailwind `slate` scale (slate-50..slate-950). Primary brand = `green-500` solid for `--primary`, with the green-500→emerald-600 **gradient** exposed as a dedicated utility/class (not as `--primary` itself) so standard Shadcn components that expect a solid color keep working. Button primary variant in Phase 8 applies the gradient directly.
- **D-06:** Semantic colors (`--semantic-red/amber/green/blue-*`) retained as keys but retuned to the Aloha palette (derived from slate + primary green for green-bg). Matches Badge variants planned for Phase 8.

### Typography
- **D-07:** Inter Variable via `@fontsource-variable/inter` replaces Geist Variable for `--font-sans` and `--font-heading`. Base size 16px.
- **D-08:** `@fontsource-variable/geist-mono` is retained for `--font-mono`. Rationale: mono font is not visually critical in the new design; swapping it out is pure churn. Geist Mono can be removed in a later cleanup if Inter Mono/JetBrains is adopted.
- **D-09:** Remove `@fontsource-variable/geist` import from `app/styles/global.css`. Add Inter import.

### Radius Scale
- **D-10:** `--radius` base = `1rem` (rounded-2xl). Shadcn-style derivations preserved: `--radius-sm = calc(--radius - 4px)`, `--radius-md = calc(--radius - 2px)`, `--radius-lg = --radius`. Existing primitives keep working; the visual effect shifts to rounded-2xl feel naturally.

### Shadows
- **D-11:** Unlock shadows — current `global.css` forces `--shadow* : none` globally. Replace with a soft slate-based Aloha shadow scale (`sm/md/lg/xl/2xl`) matching DESIGN.md.
- **D-12:** The green-tinted primary-button shadow (`shadow-green-500/25`) stays as a button-specific utility applied in Phase 8, NOT a global token.

### Dark Mode Derivation
- **D-13:** Dark palette construction rules documented in DESIGN.md §Dark Mode:
  - Backgrounds invert to slate-900/slate-950 base with slate-800 cards.
  - Text inverts to slate-50/slate-100 body, slate-400 muted.
  - Primary green stays vivid (green-400/emerald-500) to preserve brand recognition and contrast.
  - Borders shift to slate-800/slate-700.
  - Every pair used in shell chrome and primitives must hit WCAG AA (4.5:1 text, 3:1 large text/UI).
- **D-14:** WCAG verification in Phase 7 covers **token pairs at the foundation level** (background/foreground, card/card-foreground, primary/primary-foreground, muted/muted-foreground, border vs background, ring vs background). Full shell + AG Grid contrast pass is Phase 10 (DARK-02).

### No-Regression Guardrail
- **D-15:** Phase 7 must NOT modify any primitive component source (`packages/ui/src/shadcn/*`), route, loader, or action. Only files allowed:
  - `DESIGN.md` (rewrite)
  - `app/styles/theme.css` (token swap, radius/font/shadow)
  - `app/styles/global.css` (font imports, shadow unlock)
  - `app/styles/shadcn-ui.css` (if CSS var values live there — swap light + dark root blocks)
  - `package.json` / workspace catalog (add `@fontsource-variable/inter`, remove or keep geist)
- **D-16:** Post-change smoke check: every existing route still renders without layout breakage. Verified manually by loading home + one sub-module page in light and dark. Automated regression deferred to Phase 10.

### Claude's Discretion
- Exact HSL/hex values for each token (pulled from DESIGN.md rewrite + prototype `index.css`) — choose values that match the prototype while satisfying WCAG AA.
- Whether shadow scale uses `rgba(15, 23, 42, X)` (slate-900 alpha) or `rgba(0,0,0,X)` — pick whichever hits the prototype visual.
- Whether to expose the gradient as a CSS custom property `--gradient-primary` (recommended) or only as a Tailwind utility class — planner decides based on what reads best from primitive call sites in Phase 8.
- Inter weight axes to load (full `wght` variable vs subset) — default to full variable for flexibility unless bundle-size concern surfaces.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Aloha Design Source of Truth (prototype)
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/aloha-redesign-strategy.md` — High-level design principles, palette direction, role/device strategy (scope-limit context only — we are NOT shipping role/device features).
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/index.css` — Prototype Tailwind/theme setup; the canonical source for token values and radius/shadow scale.
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/App.tsx` — Shell composition (informs Phases 8–9, useful context here for how tokens flow).
- `/Users/jmr/GitHub/JJB/HawaiiFarming/aloha-design/prototype/src/components/` — Reference implementations of Button/Card/Sidebar using the Aloha palette.

### Current App Targets (to modify in Phase 7)
- `DESIGN.md` — Current Supabase-era spec; to be **fully rewritten** this phase.
- `app/styles/theme.css` — Tailwind 4 `@theme` block mapping CSS vars to `--color-*`.
- `app/styles/global.css` — Font imports, base layer, shadow lockout to remove.
- `app/styles/shadcn-ui.css` — Light `:root` + `.dark` CSS variable definitions.
- `app/styles/theme.utilities.css` — Project utility layer.

### Planning Artifacts
- `.planning/REQUIREMENTS.md` §Design Tokens — DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DARK-01 (the acceptance checklist for this phase).
- `.planning/ROADMAP.md` §Phase 7 — goal + success criteria.
- `.planning/PROJECT.md` §v2.0 constraints carried into Phase 7 — non-negotiables (light canonical, no breaking changes, no new libraries).

### Codebase Context
- `.planning/codebase/STACK.md` — Stack snapshot; confirms Tailwind 4, Shadcn, next-themes, `@fontsource-variable/*`.
- `.planning/codebase/STRUCTURE.md` — File layout; confirms where styles live.
- `.planning/codebase/CONVENTIONS.md` — Naming and token conventions.

### External Standards
- WCAG 2.2 AA contrast thresholds — 4.5:1 normal text, 3:1 large text / UI component boundaries. Downstream verification tooling (planner picks: manual via contrast calc or automated via e.g. `@axe-core/playwright` snapshot — Phase 10 concern).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Tailwind 4 `@theme` block** (`app/styles/theme.css`) — already structured around CSS variables. Swapping values instead of renaming keys means Shadcn primitives and every existing `bg-primary`/`text-foreground` usage just picks up the new look.
- **Shadcn CSS var structure** (`app/styles/shadcn-ui.css`) — already defines `:root` (light) + `.dark` blocks. Phase 7 rewrites the VALUES inside these blocks.
- **`next-themes` wiring** (`app/components/root-providers.tsx` + `app/root.tsx`) — light/dark toggle is wired and writes `.dark` on `<html>`. No changes needed; Phase 7 only supplies new palette values.
- **`@fontsource-variable/*` pattern** — already used for Geist; adding Inter follows the same import-from-global.css convention.
- **AG Grid theme file** (`ag-grid-theme.ts`, Phase 1) — reads from CSS vars; will automatically pick up any token value changes. Full AG Grid adaptation is Phase 10 but foundation work here should not break it.

### Established Patterns
- **CSS-var-driven tokens, Tailwind class consumers** — primitives use `bg-primary`, `text-foreground`, etc. Swapping var values propagates everywhere without touching call sites. This is the core enabler for the phase's "no breaking changes" promise.
- **Light+dark defined in parallel `:root` / `.dark` blocks** — keeps both palettes visible side-by-side for contrast review.
- **Shadows currently locked to `none` globally** (`global.css` `@layer base`) — intentional from Supabase era. Must unlock in Phase 7 or Phase 8 button cannot render its soft shadow.

### Integration Points
- `app/root.tsx` — loads `global.css` via `links()` export; no code change needed, CSS import chain stays the same.
- `packages/ui/src/shadcn/*` — primitives read tokens via Tailwind utility classes. **Not modified in Phase 7.**
- `app/components/ag-grid/ag-grid-wrapper.tsx` — currently imports AG Grid CSS; theme file reads CSS vars. No change.
- `next-themes` theme toggle already respects `.dark` class — no provider change needed.

</code_context>

<specifics>
## Specific Ideas

- **Inter variable** is the only font change in body; retain Geist Mono for `--font-mono`.
- **Gradient primary** is the signature brand element — make sure DESIGN.md documents both the solid `--primary` (green-500) AND the gradient form (`linear-gradient(135deg, green-500, emerald-600)`) so Phase 8 button work doesn't need to rederive it.
- **rounded-2xl as base `--radius`** is the single most visible shift — ensure shadcn derived radii (sm/md/lg) still compute sensibly from a 1rem base.
- **Shadow scale** must be DEFINED before Phase 8 touches Button/Card, otherwise primary button can't render its shadow.
- **"Dark derived from light" wording** from REQUIREMENTS.md is interpreted here as "hand-curated adaptation, authored alongside light palette" — NOT a runtime HSL transform.

</specifics>

<deferred>
## Deferred Ideas

- **Primitive restyle** (Button, Card, Input/Textarea/Select, Badge, Avatar, Sheet) → Phase 8.
- **Shell chrome** (navbar, sidebar, mobile drawer) → Phase 9.
- **AG Grid theme token swap + full dark-mode regression pass** → Phase 10.
- **Automated WCAG contrast suite** (e.g., axe in Playwright) → Phase 10.
- **Command palette implementation** → future milestone (only the styled search button ships in v2.0 Phase 9).
- **Framer Motion page transitions** → future milestone.
- **Role-specific shells / device toggle / phone frame** → future milestone.
- **Replacing Geist Mono with Inter-compatible mono** → future cleanup, not blocking.

</deferred>

---

*Phase: 07-design-foundations*
*Context gathered: 2026-04-10 (auto mode)*
