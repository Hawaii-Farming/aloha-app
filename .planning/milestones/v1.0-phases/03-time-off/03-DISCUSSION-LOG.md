# Phase 3: Time Off - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 03-time-off
**Mode:** auto (all decisions auto-selected)
**Areas discussed:** Grid display & columns, Status filter tabs, Inline status toggle, Denial reason UX, Create form

---

## Grid Display & Columns

| Option | Description | Selected |
|--------|-------------|----------|
| SQL view joining employee data | Create `app_hr_time_off_requests` view with employee name, photo, dept, comp manager | ✓ |
| PostgREST embedding on raw table | Use PostgREST `select` with FK embedding to join employee data client-side | |
| Client-side join | Load employees separately and join in React | |

**User's choice:** SQL view (auto-selected -- recommended for consistent server-side data shape matching scheduler pattern)

| Option | Description | Selected |
|--------|-------------|----------|
| viewType: 'agGrid' (standard AgGridListView) | Use existing AgGridListView -- no custom component needed | ✓ |
| viewType: 'custom' (custom TimeOffListView) | Build custom view like SchedulerListView for full toolbar control | |

**User's choice:** Standard AgGridListView (auto-selected -- Time Off doesn't need custom week navigation like scheduler)

---

## Status Filter Tabs

| Option | Description | Selected |
|--------|-------------|----------|
| Toolbar tab buttons with URL searchParams | Server-side filtering via loader revalidation | ✓ |
| AG Grid quick filter (client-side) | Filter rows client-side without re-fetching | |
| AG Grid column filter on status | Built-in column filter dropdown | |

**User's choice:** Toolbar tabs with searchParams (auto-selected -- matches scheduler's server-side filtering pattern)

---

## Inline Status Toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Action cell renderer with approve/deny buttons | Buttons visible on pending rows, using bulk_transition action | ✓ |
| Row context menu | Right-click context menu with approve/deny options | |
| Status badge click toggle | Click the status badge itself to cycle through states | |

**User's choice:** Action cell renderer buttons (auto-selected -- most discoverable UX, reuses existing action pattern)

---

## Denial Reason UX

| Option | Description | Selected |
|--------|-------------|----------|
| Popover on deny button | Small popover with textarea and submit button | ✓ |
| Modal dialog | Full dialog overlay with reason field | |
| Inline expanding cell | Expand the cell to show a textarea | |

**User's choice:** Popover (auto-selected -- lightweight, keeps user in grid context)

---

## Create Form

| Option | Description | Selected |
|--------|-------------|----------|
| Update existing hrTimeOffConfig formFields | Make request_reason required, keep existing fields | ✓ |
| Build custom form component | Full custom form with additional validation | |

**User's choice:** Update config (auto-selected -- existing config already has correct fields, just needs request_reason made required)

---

## Claude's Discretion

- Action button styling in Actions cell renderer
- Denial reason popover vs dialog implementation detail
- Tab button group styling
- Column ordering and default visibility
- Loading states and toast notifications

## Deferred Ideas

None -- discussion stayed within phase scope
