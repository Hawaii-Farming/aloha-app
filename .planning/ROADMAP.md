# Roadmap: Aloha Supabase Theme

**Milestone:** Supabase-inspired retheme — dark + light + component variants
**Created:** 2026-04-02
**Granularity:** Coarse (3 phases)
**Coverage:** 25/25 v1 requirements mapped

---

## Phases

- [x] **Phase 1: Foundation + Dark Theme** - Install fonts, establish CSS token architecture, implement Supabase dark palette with WCAG verification (completed 2026-04-02)
- [x] **Phase 2: Light Theme + Component Theming** - Complete light palette, add pill variants, theme all structural components (completed 2026-04-02)
- [ ] **Phase 3: Enhancement + Verification** - Supplementary token layers, typography refinements, end-to-end verification

---

## Phase Details

### Phase 1: Foundation + Dark Theme
**Goal**: The application renders with Geist fonts and a complete Supabase dark palette — all Shadcn tokens overridden, border-based depth established, WCAG AA verified
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-06, FOUND-07, FOUND-08, FOUND-09
**Success Criteria** (what must be TRUE):
  1. Switching to dark mode shows the Supabase dark palette across all base surfaces — no default Shadcn grays remain
  2. Body text and all headings render in Geist Sans; code/monospace elements render in Geist Mono
  3. Cards and containers have visible borders and no box-shadow elevation — the page looks flat and border-defined
  4. The green accent color (`--supabase-green`) is applied to primary interactive elements and links
  5. Running WCAG contrast checks on all dark theme text/background pairs returns AA pass (4.5:1 normal, 3:1 large)
**Plans:** 2/2 plans complete
Plans:
- [x] 01-01-PLAN.md — Install Geist fonts and override dark palette with Supabase oklch tokens
- [x] 01-02-PLAN.md — Shadow removal, hydration fix, WCAG verification, and visual checkpoint
**UI hint**: yes

### Phase 2: Light Theme + Component Theming
**Goal**: Both themes are complete and every visible UI component — sidebar, forms, tables, toasts, buttons, tabs — is fully themed in Supabase style
**Depends on**: Phase 1
**Requirements**: FOUND-04, FOUND-05, FOUND-10, FOUND-11, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08
**Success Criteria** (what must be TRUE):
  1. Switching to light mode applies the Supabase light palette — no Shadcn defaults visible, green accents intact
  2. Toggling dark / light / system cycles correctly with no theme flicker or hydration warning on any page load
  3. The sidebar shows a dark background with green-highlighted active nav links and weight-500 typography in both themes
  4. Form inputs, selects, checkboxes, and textareas visually match the Supabase input style (correct border, ring, and focus states)
  5. The pill button variant and pill tab variant are available and render with fully rounded corners at all sizes
**Plans:** 3/3 plans complete
Plans:
- [x] 02-01-PLAN.md — Define light palette in DESIGN.md and override :root CSS tokens with Supabase light palette
- [x] 02-02-PLAN.md — Remove shadow-xs from all components, add pill button variant, convert tabs to pill shape
- [x] 02-03-PLAN.md — WCAG AA contrast verification and visual checkpoint for both themes
**UI hint**: yes

### Phase 3: Enhancement + Verification
**Goal**: Supplementary tokens, typography refinements, and semantic color scales are in place; the full theme passes end-to-end verification across both modes
**Depends on**: Phase 2
**Requirements**: ENHN-01, ENHN-02, ENHN-03, ENHN-04, ENHN-05, ENHN-06
**Success Criteria** (what must be TRUE):
  1. Translucent surface overlays (modals, popovers, dropdowns) use oklch-with-alpha tokens and render correctly in both themes
  2. Body text uses weight 400; nav links and buttons use weight 500; no element uses bold 700 typography
  3. Code and technical labels render in Geist Mono with uppercase and 1.2px letter-spacing via a reusable utility
  4. Alert, badge, and status indicator colors come from the Radix 12-step scale and are semantically consistent (error = red, warning = amber, success = green)
**Plans:** 1/2 plans executed
Plans:
- [x] 03-01-PLAN.md — Add translucent surface tokens, semantic color scale, neutral gray gaps, tech-label utility, and wire alert/badge components
- [ ] 03-02-PLAN.md — Font-weight restraint audit across all shadcn components and visual verification checkpoint
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Dark Theme | 2/2 | Complete   | 2026-04-02 |
| 2. Light Theme + Component Theming | 3/3 | Complete   | 2026-04-02 |
| 3. Enhancement + Verification | 1/2 | In Progress|  |

---

*Created: 2026-04-02*
*Last updated: 2026-04-02 after Phase 3 planning — 2 plans created*
