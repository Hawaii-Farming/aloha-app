# Phase 7: Design Foundations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 07-design-foundations
**Mode:** `--auto` (recommended defaults selected without interactive questioning)
**Areas discussed:** Token migration strategy, Color palette, Typography, Radius scale, Shadows, Dark mode derivation, No-regression guardrail

---

## Token Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Rename tokens to Aloha-native keys | Fresh naming (e.g., `--aloha-bg`), requires updating every consumer | |
| Keep existing CSS var keys, swap values | Shadcn/Tailwind contract unchanged, zero consumer churn | ✓ |
| Introduce parallel namespace alongside old tokens | Two systems coexisting during migration | |

**Choice:** Keep existing keys, swap values (recommended — eliminates breakage risk for primitives, shell, AG Grid in downstream phases).
**Notes:** D-01, D-02, D-03 in CONTEXT.md.

---

## Color Palette

| Option | Description | Selected |
|--------|-------------|----------|
| Algorithmic dark derivation from light (runtime HSL transform) | Single source, auto-derived dark | |
| Hand-specified light + hand-specified dark, reviewed for AA | Predictable, auditable token pairs | ✓ |
| Copy prototype values verbatim without WCAG verification | Fastest, risks contrast failures | |

**Choice:** Hand-specified light + dark, WCAG AA verified (recommended). Primary = `green-500` solid; gradient green-500→emerald-600 exposed separately.
**Notes:** D-04, D-05, D-06.

---

## Typography

| Option | Description | Selected |
|--------|-------------|----------|
| Inter body + Inter Mono (full swap) | Maximum consistency, extra install | |
| Inter body + retain Geist Mono | Minimum churn, mono not design-critical | ✓ |
| Retain Geist body, add Inter only for headings | Partial swap, diverges from REQUIREMENTS.md DESIGN-03 | |

**Choice:** Inter variable for body via `@fontsource-variable/inter`; retain Geist Mono (recommended).
**Notes:** D-07, D-08, D-09.

---

## Radius Scale

| Option | Description | Selected |
|--------|-------------|----------|
| Single `rounded-2xl` everywhere (no scale) | Simpler but breaks shadcn sm/md/lg derivations | |
| `--radius = 1rem` base, shadcn sm/md/lg derived via calc | Preserves primitive contracts, matches Aloha feel | ✓ |
| Keep current smaller base, add separate `rounded-2xl` utility | Inconsistent with DESIGN.md direction | |

**Choice:** `--radius = 1rem` (rounded-2xl) with derived sm/md/lg (recommended).
**Notes:** D-10.

---

## Shadows

| Option | Description | Selected |
|--------|-------------|----------|
| Keep global shadows disabled | Matches v1.0 Supabase flat aesthetic — wrong for Aloha | |
| Unlock with soft slate-based scale, green shadow as button utility | Matches Aloha prototype, unblocks Phase 8 Button | ✓ |
| Unlock with green-tinted shadows globally | Over-branded, noisy | |

**Choice:** Unlock with soft slate-based scale; green-tinted shadow stays button-specific (recommended).
**Notes:** D-11, D-12.

---

## Dark Mode Derivation

| Option | Description | Selected |
|--------|-------------|----------|
| Runtime HSL derivation function | Programmatic, harder to audit | |
| Hand-curated dark palette authored alongside light | Predictable, auditable, matches "derived" wording as "hand adaptation" | ✓ |
| Copy prototype dark values without audit | Risks WCAG failures | |

**Choice:** Hand-curated dark palette with WCAG AA verification on foundation token pairs (recommended).
**Notes:** D-13, D-14.

---

## No-Regression Guardrail

| Option | Description | Selected |
|--------|-------------|----------|
| Allow primitive tweaks during token swap | Could accelerate Phase 8 but violates phase boundary | |
| Strictly limit changes to DESIGN.md + `app/styles/*` + package.json | Enforces no-regression guarantee | ✓ |
| Allow AG Grid theme file edits too | Phase 10 territory, should stay out | |

**Choice:** Strict file allowlist (recommended). Primitive/component/shell files untouched.
**Notes:** D-15, D-16.

---

## Claude's Discretion

- Exact hex/HSL values per token — planner pulls from prototype `index.css` with WCAG audit.
- Gradient exposure format (`--gradient-primary` var vs utility class only).
- Shadow color base (slate-900 alpha vs black alpha).
- Inter weight axes (full variable vs subset).

## Deferred Ideas

- Primitive restyle (Phase 8)
- Shell chrome (Phase 9)
- AG Grid theme + full regression pass (Phase 10)
- Automated WCAG suite (Phase 10)
- Command palette, Framer Motion page transitions, role-specific shells (future milestone)
- Geist Mono → Inter Mono swap (future cleanup)
