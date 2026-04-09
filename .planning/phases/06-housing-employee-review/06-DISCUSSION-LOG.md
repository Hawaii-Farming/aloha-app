# Phase 6: Housing & Employee Review - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 06-housing-employee-review
**Mode:** auto (all decisions auto-selected)
**Areas discussed:** Housing data source, Housing tenant display, Employee review table design, Review scoring UX

---

## Housing Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Add max_beds to org_site + SQL view | Migration adds column; view filters to housing category with computed tenant count | ✓ |
| Separate housing table | New table duplicating org_site data for housing | |
| Filter in application layer | No SQL view; filter org_site in loader code | |

**Auto-selected:** Add max_beds to org_site + SQL view (recommended default)
**Rationale:** org_site already has the housing concept via category; adding max_beds is minimal schema change. SQL view follows established pattern from Phases 2-5.

---

## Housing Tenant Display

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side API fetch for detail row | Expand row → fetch hr_employee by site_id on demand | ✓ |
| Pre-load all tenants in loader | Load all employee-housing assignments upfront | |
| Inline tenant count only | No detail row; just show count in grid | |

**Auto-selected:** Client-side API fetch for detail row (recommended default)
**Rationale:** Consistent with scheduler (Phase 2) and hours comparison (Phase 5) detail row patterns. Avoids loading all tenant data upfront.

---

## Employee Review Table Design

| Option | Description | Selected |
|--------|-------------|----------|
| GENERATED ALWAYS stored average | Computed column; no app-layer calculation | ✓ |
| Application-computed average | Calculate in SQL view or frontend | |
| No average column | Show individual scores only | |

**Auto-selected:** GENERATED ALWAYS stored average (recommended default)
**Rationale:** PostgreSQL 12+ supports generated columns. Eliminates sync issues between stored scores and displayed average.

---

## Review Scoring UX

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded cells (1=red, 2=amber, 3=green) | cellClassRules on score columns; consistent with Phase 1 conditional styling | ✓ |
| Numeric only | Plain numbers, no color coding | |
| Star/icon rating | Visual stars or icons instead of numbers | |

**Auto-selected:** Color-coded cells (recommended default)
**Rationale:** Leverages existing cellClassRules infrastructure from Phase 1. Provides immediate visual feedback on employee performance.

---

## Claude's Discretion

- Detail row layout and styling
- Loading skeleton design
- Empty state presentation
- Form field ordering
- Exact color token mapping for scores

## Deferred Ideas

None — analysis stayed within phase scope.
