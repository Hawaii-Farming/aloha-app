# Phase 8: Shared Primitives - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 08-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 08-shared-primitives
**Mode:** `--auto` (recommended defaults selected by Claude, no interactive questioning)
**Areas discussed:** Scope & file boundaries, Gradient application, Sizing & padding, Color tokens, Sheet styling, Badge variants, Verification

---

## Scope & File Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Restyle only the 8 primitives named in PRIM-01..06 | Minimal surface; clearest boundary; aligns with phase goal | ✓ |
| Restyle all shadcn primitives in packages/ui/src/shadcn/ | Wider sweep; risks scope creep; many primitives don't need visible change | |
| Restyle primitives + update a few call sites for consistency | Adds risk of prop contract drift; phase guardrail says no caller changes | |

**User's choice (auto):** Restyle only the 8 primitives named in PRIM-01..06
**Notes:** PRIM-0X requirements explicitly enumerate the files; guardrail prohibits loader/route/schema edits.

---

## Gradient Application

| Option | Description | Selected |
|--------|-------------|----------|
| Apply `bg-gradient-to-r from-green-500 to-emerald-600` directly in button.tsx | Matches prototype literally; no new indirection; reusable in avatar too | ✓ |
| Expose `--gradient-primary` CSS custom property and consume it | More abstract but gradient is button-specific in v2.0; Phase 7 context explicitly deferred this to planner | |
| Create a Tailwind plugin utility `bg-primary-gradient` | Adds config complexity; no reuse in other primitives yet | |

**User's choice (auto):** Direct Tailwind utilities in button.tsx + avatar.tsx
**Notes:** Phase 7 CONTEXT D-05 flagged this as planner's call. Direct utilities keep diff readable and match prototype 1:1.

---

## Sizing & Padding

| Option | Description | Selected |
|--------|-------------|----------|
| Padding-driven height (drop fixed `h-9`, use `py-3 px-5 text-sm`) | Matches prototype "generous py-3" directive; adapts to content | ✓ |
| Keep `h-9` / `h-10` fixed heights and add `rounded-2xl` only | Less layout risk but violates PRIM-01's "generous py-3" | |
| Introduce new `hero` size that uses padding-driven height | Adds API surface unnecessarily | |

**User's choice (auto):** Padding-driven height on Button, Input, Textarea, Select
**Notes:** Input/Textarea/Select shift to `text-base py-3 px-4 rounded-2xl` per PRIM-03. Risk noted: may shift vertical rhythm in dense forms — smoke check covers this.

---

## Color Tokens vs Hardcoded Slate

| Option | Description | Selected |
|--------|-------------|----------|
| Consume Phase 7 tokens everywhere except the gradient | Dark mode "for free"; aligns with packages/ui/CLAUDE.md guardrail | ✓ |
| Hardcode slate classes to match prototype literally | Breaks dark mode; violates UI package conventions | |
| Mix (tokens for surfaces, slate for borders) | Inconsistent; hard to maintain | |

**User's choice (auto):** Tokens everywhere except the gradient brand literals
**Notes:** The one exception is primary button and avatar fallback using `from-green-500 to-emerald-600` + `shadow-green-500/25` — those are brand literals, not theme colors.

---

## Sheet Leading Corner

| Option | Description | Selected |
|--------|-------------|----------|
| `rounded-l-2xl` on right-side, `rounded-r-2xl` on left-side, etc. | Matches prototype SlidePanel; rounds only the edge facing the viewport | ✓ |
| Round all four corners `rounded-2xl` | Looks wrong flush to the edge | |
| Round all corners + add margin-inset | Changes layout; not what PRIM-06 describes | |

**User's choice (auto):** Round only the leading (viewport-facing) edge per side
**Notes:** CRUD sheets default to `side="right"`, so in practice this means `rounded-l-2xl`.

---

## Badge Variant API

| Option | Description | Selected |
|--------|-------------|----------|
| Retune existing variants + add only what PRIM-04 strictly requires | Minimal API churn; preserves all call sites; semantic-* tokens already in place | ✓ |
| Replace variants with new semantic names (success/warning/danger/info/neutral) and alias old ones | Larger API change; risks missed call sites | |
| Add new variants alongside old ones without retuning the old | Leaves stale visual look on default/secondary | |

**User's choice (auto):** Retune + additively add missing variants
**Notes:** `success`, `warning`, `info` already exist from the Supabase era — just retune. `destructive` covers danger. `neutral` only added if strictly required and not expressable via `secondary`.

---

## Verification Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| `pnpm typecheck` + `pnpm lint` + manual smoke checklist of 5 routes | Fast, covers no-regression guardrail, matches phase intent | ✓ |
| Add playwright visual regression snapshots this phase | Automated regression is Phase 10 deliverable (DARK-02) | |
| Skip manual smoke, rely on typecheck only | Insufficient — primitives are visual | |

**User's choice (auto):** Typecheck + lint + 5-route manual smoke
**Notes:** Automated visual regression deferred to Phase 10 per Phase 7 CONTEXT D-16.

---

## Claude's Discretion

- Exact shadow scale per primitive (`shadow-sm` vs `shadow` vs `shadow-md`) — match prototype visual weight.
- `Avatar` size variant implementation (cva vs prop map) — reader-friendly choice.
- Whether Button `ghost`/`link` variants need any retuning beyond token inheritance.
- Ordering of variants inside cva blocks.

## Deferred Ideas

- Restyle of remaining shadcn primitives (token-inherit only this phase).
- Navbar / sidebar / drawer → Phase 9.
- AG Grid theme adaptation → Phase 10.
- Automated WCAG regression → Phase 10.
- Command palette → future milestone.
- New Button variants (`hero`, `cta`) — not required by PRIM-01.
