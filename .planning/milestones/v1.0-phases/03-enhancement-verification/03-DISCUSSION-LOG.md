# Phase 3: Enhancement + Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 03-enhancement-verification
**Mode:** auto
**Areas discussed:** Translucent surface tokens, Typography enforcement, Monospace utility design, Radix semantic color approach, Neutral gray scale extension

---

## Translucent Surface Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| oklch with alpha channel | Consistent with existing oklch-native architecture from Phase 1 | ✓ |
| HSL with alpha channel | Matches DESIGN.md prose but conflicts with codebase convention | |

**User's choice:** [auto] oklch with alpha channel (recommended default)
**Notes:** DESIGN.md mentions HSL-based tokens in prose, but the actual codebase uses oklch exclusively. Consistency wins.

| Option | Description | Selected |
|--------|-------------|----------|
| Modals, popovers, and dropdowns | Core overlay components per success criteria SC-1 | ✓ |
| All overlay elements including tooltips | Broader scope, more work | |
| Only modals | Minimal approach | |

**User's choice:** [auto] Modals, popovers, and dropdowns (recommended default)

---

## Typography Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| CSS base layer override + component audit | Set weight 400 as default, audit for 700/bold | ✓ |
| Component-only changes | Touch each component individually | |
| Tailwind config override | Font weight in theme config | |

**User's choice:** [auto] CSS base layer override + component audit (recommended default)
**Notes:** Base layer approach ensures comprehensive coverage; component audit catches any hardcoded bold usage.

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind inline utility tracking-[-0.16px] | Minimal surface area, applied per card header | ✓ |
| Custom CSS class .card-title | Reusable but adds maintenance surface | |

**User's choice:** [auto] Tailwind inline utility (recommended default)

---

## Monospace Utility Design

| Option | Description | Selected |
|--------|-------------|----------|
| @layer utilities class in global.css | Reusable .tech-label utility with full spec | ✓ |
| Tailwind plugin | More infrastructure than needed for one utility | |
| Inline Tailwind classes each time | No abstraction, repetitive | |

**User's choice:** [auto] @layer utilities class (recommended default)
**Notes:** Single utility class captures the full "monospace ritual" spec from DESIGN.md in one reusable unit.

---

## Radix Semantic Color Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Define oklch equivalents manually | Self-contained, no new package dependency | ✓ |
| Import @radix-ui/colors package | Official Radix colors but adds dependency | |

**User's choice:** [auto] Define oklch equivalents manually (recommended default)

| Option | Description | Selected |
|--------|-------------|----------|
| Red, Amber/Yellow, Green, Blue | Standard semantic states (error, warning, success, info) | ✓ |
| Full Radix palette (all 12 colors) | Comprehensive but over-scoped for current needs | |
| Red and Green only | Minimal but insufficient for badges/alerts | |

**User's choice:** [auto] Red, Amber/Yellow, Green, Blue (recommended default)

---

## Neutral Gray Scale Extension

| Option | Description | Selected |
|--------|-------------|----------|
| Extend existing --sb-* tokens | Continue Phase 1 convention, fill gaps | ✓ |
| New --neutral-* naming convention | Clean slate but inconsistent with existing tokens | |

**User's choice:** [auto] Extend existing --sb-* tokens (recommended default)

---

## Claude's Discretion

- Exact oklch values for Radix semantic color equivalents
- Number of steps per semantic color family
- Additional alpha variants for translucent tokens
- Gap analysis for --sb-* neutral tokens
- Verification tooling approach
