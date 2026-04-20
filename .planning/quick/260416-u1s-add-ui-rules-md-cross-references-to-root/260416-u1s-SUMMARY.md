---
phase: quick-260416-u1s
plan: 01
subsystem: docs
tags: [docs, design-system, cross-reference, ui-rules]
requires: [CLAUDE.md, UI-RULES.md, DESIGN.md]
provides:
  - "CLAUDE.md → UI-RULES.md cross-references in §Design System and §Data Tables"
affects:
  - "CLAUDE.md (root project instructions)"
tech-stack:
  added: []
  patterns: [doc-companion-cross-link]
key-files:
  created: []
  modified:
    - "CLAUDE.md"
decisions:
  - "Companion sentence sits directly under the DESIGN.md source-of-truth line — keeps the Design System block's reading order intact and parallels DESIGN.md §1 callout."
  - "Tables rule bullet inserted as the FIRST bullet of ## Data Tables (above AgGridListView) so the stripped-chrome contract is read before any AG Grid usage guidance."
  - "Bullet enumerates all six stripped-chrome rules inline rather than just deep-linking — keeps Claude from skipping to UI-RULES.md when answering quick questions."
metrics:
  duration: ~3min
  completed: "2026-04-16T00:00:00Z"
---

# Quick Task 260416-u1s: Add UI-RULES.md Cross-References to Root CLAUDE.md Summary

Wired root `CLAUDE.md` to `UI-RULES.md` in two precisely-targeted spots so that any Claude session that only reads project instructions is pointed at the behavior/structure companion alongside `DESIGN.md` (tokens) — closes the doc-alignment loop started by quick-260416-ovx (which had `DESIGN.md` already cross-referencing `UI-RULES.md`).

## What Was Built

Doc-only edit, two insertions in `CLAUDE.md`, zero deletions, zero code touched.

### Task 1 — `## Design System` companion pointer

Inserted one sentence immediately after the existing `**DESIGN.md** is the source of truth` sentence (CLAUDE.md:131):

```md
**Companion:** `UI-RULES.md` covers app-wide **behavior and structure** rules — tables,
search, filters, detail views, form fields, layout, and the floating create button.
Read both `DESIGN.md` (tokens) and `UI-RULES.md` (behavior) before any UI work.
```

The `### Constraints` sub-heading and its bullet list immediately below remain untouched.

### Task 2 — `## Data Tables` first-bullet rule reference

Inserted a new first bullet under the AG Grid lead sentence (CLAUDE.md:118), above `**Standard CRUD grids**`:

```md
- **Rules**: See `UI-RULES.md §Tables` for the stripped-chrome conventions — no per-table
  search (navbar-only), `defaultColDef.filter = false`, no coloring, one datum per cell,
  flat `ColDef[]` (no group headers), uniform `text-sm`, ghost zebra fill, pinned TOTAL rows.
```

All eight pre-existing bullets (`Standard CRUD grids`, `Custom grids`, `Theming`, `Detail rows`, `Column mapping`, `Cell renderers`, `Column state`, `MCP docs`) remain in their original order with their original text.

## Verification Results

```
$ git diff --stat CLAUDE.md (pre-commit)
 CLAUDE.md | 3 +++
 1 file changed, 3 insertions(+)

$ grep -n "UI-RULES.md" CLAUDE.md | head -5
118:- **Rules**: See `UI-RULES.md §Tables` for the stripped-chrome conventions ...
131:**Companion:** `UI-RULES.md` covers app-wide **behavior and structure** rules ...

$ grep -c "Companion:" CLAUDE.md
1

$ git diff HEAD~1 HEAD -- UI-RULES.md DESIGN.md | wc -l
0   # both files byte-identical to pre-task state

$ git log -1 --name-only --pretty=format:"%h %s"
b6b1964 docs(quick-260416-u1s): cross-reference UI-RULES.md from root CLAUDE.md
CLAUDE.md
```

All success criteria met.

## Commit & Push

- **SHA:** `b6b1964`
- **Branch:** `design`
- **Files in commit:** `CLAUDE.md` only (1 file, +3 lines, -0 lines)
- **Pushed:** `origin/design` advanced `21ced6e..b6b1964` — PR #11 sees the new commit
- **`origin/design` SHA == local `design` SHA:** confirmed (`b6b1964...c7799`)
- **Pre-commit hook (lint-staged + prettier on `*.md`):** ran clean, no further modifications

## Files NOT Modified

- `UI-RULES.md` — byte-identical to pre-task state (verified via `git diff HEAD~1 HEAD`)
- `DESIGN.md` — byte-identical to pre-task state (verified via `git diff HEAD~1 HEAD`)
- All `app/`, `packages/`, `supabase/` source files — untouched

## Deviations from Plan

None — plan executed exactly as written. Both Edit operations used the precise old_string/new_string pairs specified in the plan, the commit message used the exact wording specified, and the push completed without auth/branch-protection issues.

## Self-Check: PASSED

- [x] `CLAUDE.md` modified at lines 118 (Data Tables Rules bullet) and 131 (Design System Companion sentence) — verified via `grep -n`
- [x] Commit `b6b1964` exists on `design` branch with subject `docs(quick-260416-u1s): cross-reference UI-RULES.md from root CLAUDE.md` — verified via `git log -1`
- [x] Commit touches exactly one file (`CLAUDE.md`) — verified via `git log -1 --name-only`
- [x] `origin/design` SHA equals local `design` SHA (`b6b1964...c7799`) — verified via `git rev-parse`
- [x] `UI-RULES.md` and `DESIGN.md` unchanged in commit `b6b1964` — verified via `git diff HEAD~1 HEAD`
