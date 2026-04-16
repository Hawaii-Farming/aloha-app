---
phase: quick-260416-ovx
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - DESIGN.md
autonomous: true
---

<objective>
Align DESIGN.md with the design branch's behavioral intent (codified in UI-RULES.md,
added by commit e775b45). DESIGN.md is a token/foundation document authored during
Phase 7; it was never re-threaded after Phase 10's chrome-strip and the new
UI-RULES.md companion. Six targeted prose/table edits bring DESIGN.md into
consistency with the current design — no token hex values change.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Apply 6 alignment edits to DESIGN.md</name>
  <files>DESIGN.md</files>
  <action>
Apply these edits in order. Each is a small, targeted prose/table change — no
hex values or structural token changes.

**Edit A — Cross-reference near top (after §1.Key characteristics list, before §2).**
Insert a short "Companion document" callout explaining DESIGN.md = tokens,
UI-RULES.md = behavior/structure.

**Edit B — §1 paragraph 3 (line 9).**
Revise "No display-weight drama — hierarchy comes from size, not stroke weight."
to clarify this applies to prose/display headings, with a table-header exception:
weight 700 is used for AG Grid column headers to substitute for removed sort/filter chrome
(see UI-RULES.md §Tables).

**Edit C — §2 Semantic colors triples table (after the table, line 65 area).**
Add a trailing note: "These semantic tokens are used for alerts, toasts, and inline
form errors. Status values rendered in tables are always neutral — see
UI-RULES.md §Tables."

**Edit D — §3 Typography scale (line 145 weights list).**
Update the weights summary to include 700: "Weights: 400 (body), 500 (nav / buttons /
labels), 600 (section headings), 700 (table/grid headers — see UI-RULES.md §Tables)."

**Edit E — §3 Typography scale table (after line 156 Mono row).**
Add a new table row for Table header:
| Table header | 0.8125rem (13px) | 700 | 1.2 | AG Grid column headers — flat emphasis, no chrome (see UI-RULES.md) |

**Edit F — §10 Don't (line 312).**
Revise "Don't use bold (700) for display headings — the design uses 600 as the top
weight and relies on size for hierarchy." to explicitly exempt table/grid headers.
The 700 weight is reserved for tabular column labels where sort/filter chrome has
been intentionally removed.
  </action>
  <verify>
    <automated>pnpm prettier --check DESIGN.md</automated>
  </verify>
  <done>
All 6 edits applied. `pnpm prettier --check DESIGN.md` passes. `git diff --stat DESIGN.md`
shows a single-file edit. No hex value changed (verify with `git diff DESIGN.md | grep -E '^-.*#[0-9a-f]{6}' | wc -l` → 0).
  </done>
</task>

</tasks>

<verification>
After task completes:
1. `pnpm prettier --check DESIGN.md` — pass
2. `pnpm typecheck` — still green (unaffected by markdown)
3. `git diff DESIGN.md | grep -E '^-.*#[0-9a-f]{6}'` — no output (no hex changed)
4. `pnpm vitest run` — still green (unaffected by markdown)
</verification>

<success_criteria>
- DESIGN.md has all 6 alignment edits applied
- No hex values or token contracts modified
- UI-RULES.md correctly cross-referenced in 4 places (top callout + §1 + §2 + §3 + §10)
- Prettier clean, tests still green
</success_criteria>
