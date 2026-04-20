---
quick_id: 260416-ovx
status: complete
date: 2026-04-16
description: Align DESIGN.md with design branch intent (UI-RULES.md companion)
---

# Quick Task 260416-ovx — Summary

## Outcome

6 targeted edits applied to `DESIGN.md` to thread the design branch's behavioral
intent (codified in `UI-RULES.md` as of commit e775b45) back into the foundation
token document. No token hex values changed — edits are prose/table-only.

## Edits applied

| # | Section | Change |
|---|---------|--------|
| A | After §1 Key characteristics | Inserted cross-reference callout: DESIGN.md = tokens, UI-RULES.md = behavior |
| B | §1 paragraph 3 | Carved table-header exception to "no display-weight drama" (weight 700 substitutes for removed sort/filter chrome) |
| C | §2 Semantic colors (trailing note) | Clarified semantic tokens are for alerts / toasts / form errors — status values in tables are always neutral |
| D | §3 weights list | Added "700 (table/grid headers)" to the weights summary |
| E | §3 Typography scale table | Added "Table header" row: 13px / 700 / 1.2 |
| F | §10 Don't | Exempted table/grid headers from "no bold display headings" rule |

## Verification

- `pnpm prettier --check DESIGN.md` → clean
- `git diff DESIGN.md | grep -cE '^-.*#[0-9a-fA-F]{6}'` → **0** (no hex value removed/changed)
- `git diff --stat DESIGN.md` → 8 insertions / 3 deletions, single-file edit
- `pnpm vitest run` → still green (unaffected by markdown)
- `pnpm typecheck` → still green (unaffected by markdown)

## Commits

- `cfec9da` — docs(quick-260416-ovx): align DESIGN.md with UI-RULES.md companion

## Non-goals honored

- No token hex values changed
- No duplication of the AG Grid theme hex table (lives in UI-RULES.md)
- No structural refactoring of DESIGN.md — minimal prose-quality edits only
