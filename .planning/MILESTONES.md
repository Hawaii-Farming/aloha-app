# Milestones

## v1.0 Supabase Theme (Shipped: 2026-04-02)

**Delivered:** Complete Supabase-inspired retheme of Aloha ERP — dark + light themes with emerald green accents, border-based depth, and geometric typography across all Shadcn components.

**Phases completed:** 3 phases, 7 plans, 12 tasks
**Files modified:** 527 | **Lines changed:** 72,698
**Timeline:** 20 days (2026-03-13 → 2026-04-02)
**Git range:** `0df61f2`..`56a879b`
**Requirements:** 25/25 v1 requirements satisfied
**Audit:** PASSED (2026-04-02)

**Key accomplishments:**

1. Geist + Geist Mono variable fonts installed with full CSS token layer architecture (primitives → semantics → @theme)
2. Complete Supabase dark palette — all Shadcn tokens overridden with oklch values, border-based depth, WCAG AA verified
3. Complete Supabase light palette with split green accent, shadow removal across 14 components, FOUC prevention
4. Pill button variant, pill tabs, sidebar green accents, form inputs, data tables, and toasts all themed
5. Semantic color scale (Radix 12-step), translucent surface tokens, tech-label utility, typography weight restraint (400/500 only)

**Tech debt (non-blocking):**

- `--sb-dark-gray` and `--sb-off-white` tokens not registered in theme.css `@theme` (no Tailwind class access)
- `alert.tsx` base includes `bg-gradient-to-r` with no gradient stops
- Phase 3 VERIFICATION.md SC-1 status stale (fix at `17b0ae0`)

**Archives:**

- [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)
- [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)
- [v1.0-MILESTONE-AUDIT.md](milestones/v1.0-MILESTONE-AUDIT.md)

---
