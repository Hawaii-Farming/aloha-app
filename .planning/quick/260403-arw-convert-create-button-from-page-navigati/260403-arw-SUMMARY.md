---
phase: quick
plan: 260403-arw
subsystem: crud
tags: [crud, sheet, panel, form, ux]
dependency_graph:
  requires: [sub-module-create action route]
  provides: [CreatePanel component, fkOptions in sub-module loader]
  affects: [sub-module list page UX]
tech_stack:
  added: []
  patterns: [Sheet panel form, fetcher submit to sibling route action]
key_files:
  created:
    - app/components/crud/create-panel.tsx
  modified:
    - app/routes/workspace/sub-module.tsx
decisions:
  - Used fetcher.submit with action='create' to POST to the existing sub-module-create route without full-page navigation
  - Used useRevalidator to refresh table data after successful creation instead of full navigation
  - Prefixed unused loaderData destructures (moduleAccess, accountSlug) with _ to satisfy ESLint rather than removing from return
metrics:
  duration: ~15 min
  completed: "2026-04-03"
  tasks_completed: 1
  files_changed: 2
---

# Quick Task 260403-arw: Convert Create Button to Sheet Panel

**One-liner:** Sheet-based create form panel using fetcher.submit to existing route action with fkOptions loaded server-side.

## What Was Built

The Create button in every sub-module list page now opens a slide-in Sheet panel from the right side instead of navigating to a separate /create page.

### CreatePanel component (`app/components/crud/create-panel.tsx`)

- `Sheet` with `side="right"`, `sm:max-w-lg` width (slightly wider than AI panel for form fields)
- `react-hook-form` with `zodResolver` using config schema (fallback to name+description)
- `buildDefaultValues(formFields, null)` for create-mode defaults
- All config `formFields` rendered via `renderFormField` (handles create/edit visibility filtering internally)
- `AiFormAssist` at the top for AI-powered form filling
- `useFetcher` submits JSON POST to `action: 'create'` (relative — routes to `./create` sibling route)
- `useRevalidator` refreshes table data after successful submission
- Panel closes and form resets on success; toast error on failure
- `data-test="create-panel"` and `data-test="create-panel-form"` attributes added

### sub-module.tsx loader additions

- FK options loaded after tableData using same pattern as sub-module-create.tsx
- Iterates `config.formFields` for `type === 'fk'` fields, queries each `fkTable` via `SupabaseClient`
- Returns `fkOptions` alongside existing loader return values

### sub-module.tsx component changes

- Added `useState(false)` for `createOpen`
- Replaced `<Button asChild><Link to="create">` with `<Button onClick={() => setCreateOpen(true)}>`
- `<CreatePanel>` rendered after `</PageBody>` inside the fragment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed redundant `showOnCreate` filter**
- **Found during:** TypeScript compilation
- **Issue:** Plan's Step B included a `.filter((field) => field.showOnCreate !== false)` before mapping fields, but `renderFormField` already handles this filtering internally. Applying it to the mixed `formFields | fallbackFormFields` union caused a TS2339 error since the fallback type doesn't declare `showOnCreate`.
- **Fix:** Removed the extra filter; `renderFormField` handles visibility per mode
- **Files modified:** `app/components/crud/create-panel.tsx`
- **Commit:** db57f82

**2. [Rule 2 - Lint] Prefixed unused loaderData vars**
- **Found during:** ESLint run on modified files
- **Issue:** `moduleAccess` and `accountSlug` were destructured from `loaderData` but not used in the component body — pre-existing issue exposed during linting
- **Fix:** Renamed to `_moduleAccess` and `_accountSlug` per CLAUDE.md convention
- **Files modified:** `app/routes/workspace/sub-module.tsx`
- **Commit:** db57f82

## Known Stubs

None — form fields are fully wired from CRUD config, fkOptions are loaded server-side, and submission routes to the real create action.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. The CreatePanel submits to the existing `./create` route action which already has CSRF and auth protection.

## Self-Check

- [x] `app/components/crud/create-panel.tsx` — created
- [x] `app/routes/workspace/sub-module.tsx` — modified
- [x] Commit db57f82 exists
- [x] `pnpm typecheck` passes
- [x] ESLint clean on modified files

## Self-Check: PASSED
