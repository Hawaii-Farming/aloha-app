---
quick_id: 260416-q6i
status: complete
date: 2026-04-16
description: Fix module.tsx querying non-existent app_nav_sub_modules view; align docs
---

# Quick Task 260416-q6i — Summary

## Outcome

A silent module-navigation bug that had been shipped on `main` for months
is fixed. `app/routes/workspace/module.tsx` now queries the view that
actually exists in hosted Supabase (`app_navigation`) instead of the
fictional `app_nav_sub_modules`. Four stale doc references to non-existent
views are aligned to reality.

## Evidence of the bug (before)

Direct probe of hosted DB from a logged-in browser session:

| View | Status |
|------|--------|
| `app_navigation` | 200 (exists) |
| `app_nav_sub_modules` | 404 PGRST205 |
| `app_nav_modules` | 404 PGRST205 |

Visiting `/home/hawaii_farming/human_resources` returned 302 → redirect to
`/home/hawaii_farming` (the "no sub-modules" fallback), instead of 302 →
`/home/hawaii_farming/human_resources/<first-sub-module>`.

## Fix

- **module.tsx** — query `app_navigation`, select `sub_module_slug +
  sub_module_display_order`, order by `sub_module_display_order`. One
  loader change, no type drift (castRows generic unchanged).
- **CLAUDE.md** — replaced `app_nav_modules` with `app_navigation` in the
  tenant-isolation view list.
- **README.md** — fixed two refs: `requireModuleAccess` description and
  the ERP view table (two fake rows collapsed to one real one).
- **supabase/CLAUDE.md** — Schema Files table entry updated to single
  `app_navigation` view.

## Verification

- `pnpm typecheck` — green
- `phase10-bug-01-active-pill / clicking a module row changes the URL` →
  **PASS** (was timing out for 30s every run)
- `phase10-bug-01-active-pill / module row shows gradient pill immediately
  when URL matches` → still FAILS, but on a different issue: the test
  navigates to `/hr/hr_employee_register`. Real module slug is
  `human_resources`, real sub-module slug is `register`. Stale test —
  out of scope here.

## Commits

- `938a413` — fix(quick-260416-q6i): module.tsx queried non-existent app_nav_sub_modules view

## Follow-ups

1. **Stale phase10 tests** — several still reference removed slugs
   (`/hr/hr_employee_register`, etc.). Needs per-test pass.
2. **supabase/CLAUDE.md** — full "Schema Files" table is fictional
   (whole `supabase/schemas/` dir doesn't exist). Broader cleanup.
3. **`public/locales/en/chats.json`** — missing i18n file, 404s on every
   load. Flagged in 260416-ppa, still pending.

## Pre-existing bug note

`module.tsx` is byte-identical on `main` and `design`. This bug was
already on main — it just never surfaced because the @phase10 E2E tests
that would have caught it were waived at Phase 10 close due to unrelated
setup bugs (now fixed in 260416-ppa). Plan 10-05's "BUG-01 fix" only
handled click-handling in the sidebar; nobody tested whether the module
landing route actually resolved.
