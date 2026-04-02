# Requirements: Aloha Supabase Theme

**Defined:** 2026-04-02
**Core Value:** Every screen in Aloha looks and feels like a premium Supabase-quality product — cohesive, professional, and consistent across both dark and light themes.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Geist font installed and applied as primary sans-serif via `--font-sans` CSS variable
- [ ] **FOUND-02**: Geist Mono font installed and applied as monospace via `--font-mono` CSS variable
- [ ] **FOUND-03**: All Shadcn semantic CSS tokens overridden with Supabase dark palette in oklch format
- [ ] **FOUND-04**: All Shadcn semantic CSS tokens overridden with Supabase light palette in oklch format
- [ ] **FOUND-05**: Light theme palette values defined in DESIGN.md (currently incomplete)
- [ ] **FOUND-06**: `suppressHydrationWarning` added to `<html>` element in root.tsx
- [ ] **FOUND-07**: Border-based depth system replacing box-shadows on cards and containers
- [ ] **FOUND-08**: Supabase green accent tokens defined (`--supabase-green`, `--supabase-green-link`, `--supabase-green-border`)
- [ ] **FOUND-09**: WCAG AA contrast verified for dark theme (4.5:1 normal text, 3:1 large text)
- [ ] **FOUND-10**: WCAG AA contrast verified for light theme (4.5:1 normal text, 3:1 large text)
- [ ] **FOUND-11**: No theme flicker (FOUC) on page load in both dark and light modes

### Components

- [ ] **COMP-01**: Sidebar themed with dark background, green accents, and weight-500 nav links
- [ ] **COMP-02**: Form inputs themed (text input, select, checkbox, radio, textarea)
- [ ] **COMP-03**: Data tables themed (headers, rows, borders, hover states)
- [ ] **COMP-04**: Pill button variant (9999px radius) added to Shadcn Button via CVA
- [ ] **COMP-05**: Pill tab indicator added to Shadcn Tabs component
- [ ] **COMP-06**: Cards and containers use border-defined edges with no visible shadows
- [ ] **COMP-07**: Links styled per Supabase palette (green branded, primary light, secondary, muted)
- [ ] **COMP-08**: Toast notifications (Sonner) themed to match palette

### Enhancement

- [ ] **ENHN-01**: HSL-with-alpha supplementary token layer for translucent surfaces (glass overlays, subtle washes)
- [ ] **ENHN-02**: Typography weight restraint enforced (400 body, 500 nav/buttons only — no bold 700)
- [ ] **ENHN-03**: Negative letter-spacing (-0.16px) on card titles
- [ ] **ENHN-04**: Monospace technical label utility (Geist Mono, uppercase, 1.2px letter-spacing)
- [ ] **ENHN-05**: Radix 12-step color scale integration for semantic states (alerts, badges, status indicators)
- [ ] **ENHN-06**: Supabase neutral gray scale tokens defined (`#171717` through `#fafafa` equivalents in oklch)

## v2 Requirements

### Advanced Theming

- **ADV-01**: Per-tenant brand color customization
- **ADV-02**: Custom scrollbar styling (progressive enhancement)
- **ADV-03**: Smooth CSS transitions on theme toggle (button icon only)

## Out of Scope

| Feature | Reason |
|---------|--------|
| CSS animations on theme switch | Causes FOUC-like flash on every SSR navigation, not just toggle |
| Per-module color accents | Conflicts with "emerald is identity" principle; destroys Supabase aesthetic |
| Runtime theme customization UI | Scope creep; requires different token architecture (CSS-in-JS) |
| Third-party theme generators | Output requires too much correction; faster to write directly from DESIGN.md |
| Dark-only mode | ERP users work in bright environments; light theme is required |
| Inline style overrides | Breaks CSS variable system and theme switching |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase ? | Pending |
| FOUND-02 | Phase ? | Pending |
| FOUND-03 | Phase ? | Pending |
| FOUND-04 | Phase ? | Pending |
| FOUND-05 | Phase ? | Pending |
| FOUND-06 | Phase ? | Pending |
| FOUND-07 | Phase ? | Pending |
| FOUND-08 | Phase ? | Pending |
| FOUND-09 | Phase ? | Pending |
| FOUND-10 | Phase ? | Pending |
| FOUND-11 | Phase ? | Pending |
| COMP-01 | Phase ? | Pending |
| COMP-02 | Phase ? | Pending |
| COMP-03 | Phase ? | Pending |
| COMP-04 | Phase ? | Pending |
| COMP-05 | Phase ? | Pending |
| COMP-06 | Phase ? | Pending |
| COMP-07 | Phase ? | Pending |
| COMP-08 | Phase ? | Pending |
| ENHN-01 | Phase ? | Pending |
| ENHN-02 | Phase ? | Pending |
| ENHN-03 | Phase ? | Pending |
| ENHN-04 | Phase ? | Pending |
| ENHN-05 | Phase ? | Pending |
| ENHN-06 | Phase ? | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 0
- Unmapped: 25 ⚠️

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after initial definition*
