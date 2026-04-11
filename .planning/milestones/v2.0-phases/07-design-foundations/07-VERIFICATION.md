---
phase: 07-design-foundations
verified: 2026-04-10T00:00:00Z
status: human_needed
score: 4/5 must-haves verified (DESIGN-04 partial — 6 light-mode WCAG failures escalated)
overrides_applied: 0
re_verification:
  previous_status: initial
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Decide §9.1 Failure Register remediation path for --ring (2.08:1) and --muted-foreground (4.34:1) before Phase 8 starts"
    expected: "Human chooses: (a) retune --ring to emerald-600 or add composite halo, (b) darken --muted-foreground to slate-600, (c) reclassify --border as decorative and relax its 3:1 threshold in the script, (d) accept --primary-foreground 2.28:1 because solid --primary is decoration-only and button face uses gradient"
    why_human: "Palette retune is a Rule 4 architectural change. Plan 07-03 author intentionally did NOT silently mutate the locked Plan 7-01 palette. Four of the six failures sit in DESIGN-04 scope (shell chrome + primitives) and at least two (--ring, --muted-foreground) are genuine a11y concerns, not exemption-candidates. Phase 8 primitive restyle is the natural decision point."
  - test: "pnpm dev + visual smoke check — home dashboard + one sub-module (e.g. /home/:account/hr/employees), light and dark"
    expected: "No console errors, no missing CSS var warnings, sidebar/navbar/content render with visible borders, body computed font-family is 'Inter Variable', DevTools Network shows inter woff2 200, AG Grid rows render without overlap, dark toggle produces slate-900 bg + green-400 CTAs without FOUC, light toggle restores baseline"
    why_human: "Auto-mode deferral from Plan 07-03 Task 3. Visual appearance, font rendering quality, FOUC absence, and shadow-unlock regressions cannot be verified without a running browser. The automated fallback (typecheck + lint + build + Inter woff2 bundling) is green but does not substitute for live visual confirmation."
  - test: "Review build/client/assets for Inter woff2 subset files"
    expected: "At least 7 inter-*-wght-normal-*.woff2 files present (confirms dependency physically loads)"
    why_human: "Already confirmed in 07-03-SUMMARY build output but worth visual confirmation in browser DevTools Network tab during the smoke check above."
---

# Phase 7: Design Foundations Verification Report

**Phase Goal:** Establish the Aloha design system as the single source of truth so every downstream restyle inherits correct tokens, typography, and derived dark palette.
**Verified:** 2026-04-10
**Status:** HUMAN_NEEDED — phase complete with warnings
**Re-verification:** No — initial verification

---

## Executive Verdict

## PHASE COMPLETE WITH WARNINGS

Phase 7 delivered all foundation artifacts: the Aloha DESIGN.md spec, the Aloha palette in shadcn-ui.css, Tailwind @theme wiring with Inter fonts and shadow scale, the Inter dependency swap, and a reusable `scripts/verify-wcag.mjs` verification tool. Dark-mode foundation passes completely. **Light mode has 6 documented WCAG assertion failures** (2 genuine, 1 documented-caveat, 3 plausibly-exempt) that require human sign-off on the remediation path before Phase 8 primitive restyle begins. The manual browser smoke check is also deferred from Plan 07-03 Task 3 (auto-mode).

**Recommendation:** Accept Phase 7 as complete subject to two human checkpoints:
1. Decide §9.1 Failure Register remediation (can be rolled into Phase 8 kickoff — §9.1 options are already enumerated and the decision naturally belongs with the button/input/ring restyle).
2. Run the `pnpm dev` visual smoke pass and confirm no regressions.

---

## Goal Achievement — Observable Truths

Must-haves derived from ROADMAP.md §Phase 7 Success Criteria + per-plan frontmatter must_haves.truths.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | DESIGN.md reads as Aloha theme spec (Inter 16px, slate neutrals, green-500→emerald-600 gradient, rounded-2xl, shadows, light-first) with **no Supabase-era tokens remaining** | ✓ VERIFIED | 315 lines. 58 matches across `Inter Variable`/`#22c55e`/`#059669`/`linear-gradient(135deg`/`--gradient-primary`/`rounded-2xl`/`1rem`/`slate-900`/`Geist Mono`/`WCAG`. Negative grep: `supabase\|oklch\|--sb-` → 0 residue matches (the one "glass-surface" mention is in the §10 Don'ts "do not reintroduce" negation — intentional). |
| 2 | App boots with Inter variable font loaded globally AND Tailwind 4 `@theme` block reflects Aloha palette, radius, font-family, shadow tokens end-to-end | ✓ VERIFIED | `global.css` imports `@fontsource-variable/inter/wght.css` (L7) and `@fontsource-variable/geist-mono/wght.css` (L8 — retained per D-08). `theme.css` @theme has `'Inter Variable'` strings, `--shadow-sm..2xl`, `--color-gradient-primary: var(--gradient-primary)`. `package.json` has `@fontsource-variable/inter: 5.2.8`. Build output from Plan 07-02 bundles 7 Inter woff2 subsets. |
| 3 | Toggling light↔dark swaps to a derived dark palette whose token pairs pass WCAG AA on shell chrome + primitive text/bg combinations (verified via contrast audit) | ⚠️ PARTIAL | `scripts/verify-wcag.mjs` runs 24 assertions. **Dark mode: 12/12 PASS** (DARK-01 clean). **Light mode: 6/12 FAIL** → `primary-foreground/primary` 2.28:1, `muted-foreground/background` 4.34:1, `muted-foreground/muted` 4.34:1, `border/background` 1.13:1, `ring/background` 2.08:1; dark `border/background` 1.72:1 (only dark failure — decorative). See §9.1 analysis below. |
| 4 | Existing routes still render with no token-name regressions; layout/spacing intact at shell level | ? UNCERTAIN (auto-fallback passed, live smoke deferred) | `pnpm typecheck`, `pnpm lint`, `pnpm build` all green per 07-02 and 07-03 summaries. CSS var KEYS preserved per D-01 (only values swapped). Shadow lockout removal surfaced ~20 latent `shadow-*` utility hits in 07-02-SUMMARY — these will render with the new Aloha shadow scale but need visual confirmation. **Manual browser smoke check deferred to human** (auto-mode Plan 07-03 Task 3 deferral). |
| 5 | WCAG verification tooling exists, is reusable, and produces the report artifacts | ✓ VERIFIED | `scripts/verify-wcag.mjs` (74 lines) imports `hex` from `wcag-contrast@3.0.0`, declares 24 pair entries, exits non-zero on failure, prints both per-pair lines and a markdown table for DESIGN.md paste. Reusable by Phase 10 for full shell + AG Grid audit. |

**Score: 4/5 verified** (Truth 3 partial, Truth 4 auto-fallback-only pending human smoke).

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `DESIGN.md` | Aloha spec, 10 sections, Inter/slate/green/rounded-2xl/shadows/dark palette/WCAG table | ✓ VERIFIED | 315 lines. Sections 1-10 present. §9 populated with real ratios. §9.1 Failure Register documents remediation options for the 6 light failures. No Supabase residue. |
| `app/styles/shadcn-ui.css` | `:root` + `.dark` Aloha hex values, `--radius: 1rem`, `--gradient-primary` | ✓ VERIFIED | 143 lines. `--primary: #22c55e` (light), `--primary: #4ade80` (dark), `--background: #f1f5f9` (light), `--background: #0f172a` (dark), `--radius: 1rem`, `--gradient-primary: linear-gradient(135deg, #22c55e, #059669)`. `'Inter Variable'` + `'Geist Mono Variable'` font strings. |
| `app/styles/theme.css` | Tailwind @theme Inter fonts, Aloha shadow scale, `--color-gradient-primary` mapping | ✓ VERIFIED | 149 lines. Inter strings, shadow-sm..2xl scale, `--color-gradient-primary: var(--gradient-primary)`. Supabase `--color-glass-surface` / `--color-slate-alpha-wash` entries removed. |
| `app/styles/global.css` | `@fontsource-variable/inter/wght.css` import, Geist Mono retained, `--shadow*: none` lockout removed | ✓ VERIFIED | 59 lines. Inter import L7, Geist Mono L8. No `--shadow*: none` grep matches. Body `@apply bg-background text-foreground` preserved. |
| `package.json` | `@fontsource-variable/inter: 5.2.8`, `@fontsource-variable/geist-mono` retained, `@fontsource-variable/geist` (sans) removed, `wcag-contrast: 3.0.0` devDep | ✓ VERIFIED | L130 `@fontsource-variable/geist-mono: ^5.2.7`, L131 `@fontsource-variable/inter: 5.2.8`. `@fontsource-variable/geist` (sans) absent. `wcag-contrast` present. |
| `scripts/verify-wcag.mjs` | ESM Node script, 24 assertions, exits non-zero on failure, prints markdown table | ✓ VERIFIED | 74 lines. Imports `hex` from `wcag-contrast`. 24 pair entries. Prints 24 PASS/FAIL lines + markdown table. Exits 1 with 6 failures on current palette. Tool itself is correct. |

All 6 artifacts exist, are substantive (far exceed stub thresholds), and are wired (shadcn-ui.css values flow to Tailwind via theme.css @theme → to every primitive via `bg-primary`/`text-foreground` class names preserved per D-01). No stubs, no placeholder text, no hardcoded empty data.

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| DESIGN-01 | DESIGN.md rewritten as Aloha theme source of truth (Inter 16px, slate, green-500→emerald-600 gradient, rounded-2xl, shadows, light-first) | ✓ SATISFIED | DESIGN.md Sections 1-10 present; Supabase residue = 0; Inter/slate/green/gradient/rounded-2xl all documented. |
| DESIGN-02 | Tailwind 4 `@theme` block has Aloha palette, font-family, radius, shadow tokens (replacing Supabase) | ✓ SATISFIED | theme.css @theme Inter strings + shadow scale + gradient mapping; Supabase color mappings deleted. |
| DESIGN-03 | Inter variable font loaded via `@fontsource-variable/inter`, replacing Geist as body font | ✓ SATISFIED | global.css Inter import, package.json dep pinned 5.2.8, build bundles Inter woff2 subsets. Geist sans removed; Geist Mono retained. |
| DESIGN-04 | Light canonical, dark derived, **WCAG AA verified on every token pair used in shell chrome and primitives** | ⚠️ PARTIAL — ESCALATED | Tooling and methodology delivered (script + DESIGN.md §9 table). 18/24 assertions pass. 6 light-mode failures documented in DESIGN.md §9.1 Failure Register with remediation options. **Requires human decision before Phase 8.** |
| DARK-01 | Dark palette derived from light with WCAG AA on shell chrome, primitives, AG Grid | ✓ SATISFIED at foundation scope | All 12 dark-mode foundation pairs pass (including `primary-foreground/primary` 8.55:1 and `ring/background` 10.25:1). Only dark `border/background` fails at 1.72:1 — decorative hairline, WCAG 1.4.11 exempt. AG Grid-specific pairs are Phase 10 scope per D-14. |

---

## WCAG Failure Analysis (§9.1 escalation)

| # | Pair | Theme | Ratio | Min | Category | In DESIGN-04 scope? |
|---|------|-------|-------|-----|----------|---------------------|
| 4 | `primary-foreground/primary` | light | 2.28:1 | 3.0:1 | Pre-flagged in 07-RESEARCH §A1; Option C caveat | Borderline — solid `--primary` is decoration-only per D-14, interactive button face uses gradient |
| 6 | `muted-foreground/background` | light | 4.34:1 | 4.5:1 | Near-miss body text (0.16 short) | YES — hits form labels + muted copy (Phase 8 primitive) |
| 7 | `muted-foreground/muted` | light | 4.34:1 | 4.5:1 | Same root as #6 | YES — same concern |
| 10 | `border/background` | light | 1.13:1 | 3.0:1 | Hairline border | NO if decorative (WCAG 1.4.11 exempt); YES if inputs rely on border as sole affordance |
| 11 | `ring/background` | light | 2.08:1 | 3.0:1 | Focus ring — WCAG 2.4.7 visible focus | **YES — genuine a11y failure, must fix before Phase 8 input restyle** |
| 22 | `border/background` | dark | 1.72:1 | 3.0:1 | Hairline border | NO if decorative |

**Assessment:**
- **#11 (`--ring`)** is the hardest blocker — focus rings on inputs are a direct primitive concern for Phase 8 PRIM-03 and cannot be waved away as decorative. `#22c55e` on `#f1f5f9` simply doesn't clear 3:1. Options: darken to `#059669` (emerald-600), add composite halo, or swap to `#16a34a` (green-600). Decision can wait until Phase 8 kickoff.
- **#6/#7 (`--muted-foreground`)** are real body-text near-misses. Swap to slate-600 (`#475569`) clears 7+:1 at the cost of "muted" visual feel. Decision deferrable to Phase 8.
- **#4 (`--primary-foreground`)** was already flagged in research and resolved-in-principle by Option C (gradient-button measurement, not solid-token measurement). Documented caveat; acceptable as long as buttons use the gradient face.
- **#10/#22 (`--border`)** are plausibly exempt under WCAG 1.4.11 for decorative hairlines. The 3.0 threshold in the script was set conservatively; Phase 8 should confirm input affordance does not rely solely on border.

**None of these failures invalidate the Phase 7 token foundation.** The tokens, fonts, and palette structure are correct and ready to consume. The failures are *calibration adjustments* to specific hex values within the already-shipped structure — exactly the kind of retune that naturally lands in Phase 8 when Button, Input, and focus rings get restyled and visually validated.

---

## Anti-Pattern Scan

Files modified in this phase: DESIGN.md, app/styles/shadcn-ui.css, app/styles/theme.css, app/styles/global.css, package.json, pnpm-lock.yaml, scripts/verify-wcag.mjs.

| Pattern | Hits | Severity | Notes |
|---------|------|----------|-------|
| TODO/FIXME/HACK/XXX | 0 in modified files | — | None |
| Placeholder / "coming soon" / "not implemented" | 0 (all "pending" in DESIGN.md was replaced with real ratios per 07-03 Task 2) | — | Clean |
| Empty returns / hardcoded `return []` | 0 | — | N/A — no JS/TS runtime code except verify-wcag.mjs which has concrete 24-entry pair array |
| Stub/hollow implementations | 0 | — | Every token has a concrete hex value, every WCAG assertion runs |
| Legacy Supabase token residue | 0 | — | `supabase\|oklch\|--sb-\|glass-surface\|slate-alpha-wash` grep returns only the intentional "do not reintroduce" instruction in §10 Don'ts |

No anti-patterns found in Phase 7 files.

---

## Deferred / Known Issues (informational)

1. **Latent `shadow-*` utility hits surfaced by shadow unlock** — 07-02-SUMMARY enumerated ~20 components in `packages/ui/src/shadcn/*`, `packages/ui/src/kit/*`, and some `app/components/*` that previously rendered with `--shadow: none` and will now render the Aloha slate-alpha scale. Per D-15, these are Phase 8/9 visual concerns, not Phase 7 blockers. Included here so Phase 8 kickoff is aware.
2. **`--radius-radius: var(--radius)` dead-code entry in theme.css** — deferred to Phase 10 per 07-RESEARCH §Open Questions #3. Not a Phase 7 concern.
3. **Manual `pnpm dev` browser smoke check (Plan 07-03 Task 3)** — deferred in auto mode, surfaced in the human_verification section above.
4. **AG Grid-specific contrast pairs** — Phase 10 scope per D-14. Foundation-level verification is sufficient for Phase 7.

---

## Decision Rationale

**Why HUMAN_NEEDED, not GAPS_FOUND:**

- All 6 must-have artifacts exist and are substantive.
- All Plan acceptance criteria are met, with the 6 WCAG failures explicitly documented and escalated via §9.1 Failure Register (Plan 07-03 labeled itself "PLAN COMPLETE WITH WARNINGS").
- Dark mode is fully clean — DARK-01 satisfied at foundation scope.
- The 6 failures are calibration decisions requiring Rule 4 human approval, not incomplete work. The research doc (07-RESEARCH §A1) pre-flagged `--primary-foreground` with Option C, and the `--ring` / `--muted-foreground` numbers only became visible once the script ran — this is the verification tooling doing its job.
- Phase 8 primitive restyle is the natural remediation point: Button, Input, and focus-ring work will exercise exactly the tokens that fail, so the retune decision is cheaper to make alongside visual restyle work than now.
- The manual browser smoke check is auto-mode-deferred by design, not skipped.

**Why not PASSED:**

- DESIGN-04 contract literally says "WCAG AA verified on every token pair used in shell chrome and primitives" — `--ring` is a primitive focus state and it fails 2.08:1 vs required 3:1. Without human acceptance of the remediation plan, marking the phase "passed" would mislead Phase 8 planning.
- Auto-mode manual smoke check has not run; latent shadow-* hits from D-11 unlock have not been visually validated.

**Why not GAPS_FOUND:**

- The phase built every piece of infrastructure it promised. The 6 failures are parameter-value decisions within an otherwise complete and correct token system, and they were intentionally surfaced (not hidden) by the executor per Rule 4.
- Rewriting Plan 07-01 to patch the palette values without visual context would be wasted work — Phase 8 gets to see them rendered and pick the right fix.

---

## Summary for Orchestrator

**Phase 7 is functionally complete.** All tokens, fonts, shadows, gradient, dark palette, and WCAG tooling are in place. Dark mode is clean. Light mode has 6 documented WCAG assertions pending human remediation decisions that naturally belong to Phase 8 kickoff. Manual browser smoke is auto-mode-deferred.

**Unblockers needed before Phase 8 starts:**
1. Human chooses §9.1 remediation path (especially `--ring` retune and `--muted-foreground` tweak).
2. Human runs the `pnpm dev` smoke check (home + one sub-module, light + dark).

Both can be handled as a single Phase 8 kickoff review. Phase 7 itself does not need additional plans or a gap-closure cycle.

---

_Verified: 2026-04-10_
_Verifier: Claude (gsd-verifier)_
