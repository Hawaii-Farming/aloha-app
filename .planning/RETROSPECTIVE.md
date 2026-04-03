# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Supabase Theme

**Shipped:** 2026-04-02
**Phases:** 3 | **Plans:** 7

### What Was Built
- Complete Supabase dark + light theme with oklch CSS token architecture
- Geist/Geist Mono typography system with weight restraint (400/500 only)
- 14 Shadcn components restyled: pill buttons, pill tabs, sidebar green accents, form inputs, tables, toasts, alerts, badges
- Semantic color scale (Radix 12-step), translucent surface tokens, tech-label utility
- WCAG AA verified for both themes; border-based depth replacing all shadows

### What Worked
- CSS token layer architecture (primitives → semantics → @theme) made each phase additive — no rework needed
- oklch color space provided perceptual uniformity; split green accent solved light/dark contrast in one decision
- "Override tokens, not components" strategy meant most theming required zero .tsx changes
- Coarse granularity (3 phases) matched the CSS-layer nature of the work perfectly

### What Was Inefficient
- Some SUMMARY.md files missing `one_liner` frontmatter — slowed milestone extraction
- VERIFICATION.md SC-1 left stale after fix commit — should have been updated immediately
- Light palette spec in DESIGN.md was marked "incomplete" at project start — caused a blocker concern that resolved itself during Phase 2 research

### Patterns Established
- oklch for all custom color tokens; `var(--color-*)` only for Tailwind-managed tokens
- Font imports placed before `@import 'tailwindcss'` in global.css
- Semantic colors registered as CSS vars AND @theme entries for Tailwind first-class usage
- Additive CVA variants (pill) — never modify existing variant behavior

### Key Lessons
1. Token-level theming is faster than component-level: overriding CSS variables cascades to all consumers without touching individual files
2. Split accent colors per theme (darker green on light bg, brighter on dark bg) is essential for WCAG compliance — a single green value cannot satisfy both
3. Shadow removal via CSS token overrides (`--shadow: none`) is cleaner than removing shadow classes from every component file
4. WCAG verification should be done per-phase, not deferred — Phase 2 confirmed all 15 pairs passed without adjustment because the palette was designed compliant from the start

### Cost Observations
- Model mix: ~60% sonnet (execution), ~30% opus (planning/review), ~10% haiku (research)
- Notable: CSS-only project benefited from coarse granularity — fewer context switches, faster execution

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 3 | 7 | First milestone — established token architecture and CSS-first theming pattern |

### Cumulative Quality

| Milestone | Requirements | Coverage | Audit |
|-----------|-------------|----------|-------|
| v1.0 | 25/25 | 100% | PASSED |

### Top Lessons (Verified Across Milestones)

1. Token-level CSS theming scales better than component-level changes for design system work
2. Design palette for WCAG compliance from the start — retrofitting contrast ratios is expensive
