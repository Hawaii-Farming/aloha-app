# UI Rules

Source of truth for cross-cutting UI conventions. `DESIGN.md` covers tokens (colors, typography, shadows). This file covers **behavior and structure** rules that apply app-wide.

## Tables

- **One datum per cell.** No stacked text, no compound renderers (name + alias parenthetical, name + dept sub-line). If a renderer pulls more than one field, split into separate columns. Applies to AG Grid *and* semi-table list layouts.
- **No coloring.** No hash-based pill colors, no fixed-color pills, no cell/row class-rule tints. `StatusBadgeRenderer` is neutral plain text — no semantic color exception. Scores, variances, OT thresholds all render as plain text.
- **No search input on tables.** Global search lives in the navbar (see below).
- **No column filter icons.** `defaultColDef.filter = false` always; never add `filter: true` or `filter: 'agTextColumnFilter'` on a colDef.
- **Sortable columns on.** `defaultColDef.sortable = true`. Individual colDefs can opt out with `sortable: false` (e.g. action columns).
- **Numbers always right-aligned**, `tabular-nums`, monospace when IDs/codes.
- **No group/super headers.** Flat `ColDef[]` only — no `ColGroupDef` nesting.
- **Uniform `text-sm`.** Header row, data rows, footer — all the same size. No `text-xs` "secondary" sub-line to fake hierarchy.
- **Pinned TOTAL row** for sum rows. Stays visible while scrolling vertically.

### Table theme (AG Grid)

Canonical hex lookups for the AG Grid theme. AG Grid v35's `themeQuartz.withParams()` does not resolve CSS vars — these values are hardcoded in `app/components/ag-grid/ag-grid-theme.ts` and asserted by `app/components/ag-grid/__tests__/ag-grid-theme.test.ts`. Any edit here must update both.

**Light mode**

| Param                        | Hex       |
| ---------------------------- | --------- |
| `backgroundColor`            | `#ffffff` |
| `foregroundColor`            | `#0f172a` |
| `headerBackgroundColor`      | `#f1f5f9` |
| `headerTextColor`            | `#1e293b` |
| `borderColor`                | `#cbd5e1` |
| `accentColor`                | `#22c55e` |
| `rowHoverColor`              | `#f1f5f9` |

**Dark mode**

| Param                        | Hex       |
| ---------------------------- | --------- |
| `backgroundColor`            | `#1e293b` |
| `foregroundColor`            | `#f8fafc` |
| `headerBackgroundColor`      | `#0f172a` |
| `headerTextColor`            | `#cbd5e1` |
| `borderColor`                | `#334155` |
| `accentColor`                | `#4ade80` |
| `rowHoverColor`              | `#334155` |

**Shared (both modes)**

| Param                      | Value            |
| -------------------------- | ---------------- |
| `fontFamily`               | `Inter Variable` |
| `fontSize`                 | `14`             |
| `headerFontSize`           | `13`             |
| `headerFontWeight`         | `700`            |
| `rowVerticalPaddingScale`  | `1.6`            |

## Search

- **Global search only.** No per-table search bars. The navbar search opens the Command palette.
- **Keyboard shortcut: `/`** opens the search palette (standard Linear/GitHub pattern), in addition to `Cmd/Ctrl+K`.

## Filters

- **Filter button lives in the navbar**, portaled to `#workspace-navbar-filter-slot`. Use the generic `NavbarFilterButton` (`app/components/navbar-filter-button.tsx`).
- **Not over the table.** No floating config button on the table surface.
- **Active filter summary.** The button shows the number of active filters as a badge *and* a short summary of the active values next to the label (e.g. `Filters · Jane Doe · Mar 2026`). Empty state shows just "Filters".
- **Popover on click** with labeled selects stacked vertically + "Clear all".

## Detail Views

- **List → detail → edit** is the standard flow.
- **Inline editing in detail view.** Click a field to edit it in place; save on blur/Enter. No full-page edit route or modal panel for single-field changes. Keep the `EditPanel` for multi-field creates.
- **Header bar:** Back · entity icon · title · optional status badge · Edit · Delete.
- **Custom detail views** wire via `viewType.detail: 'custom'` + `customViews.detail`. The detail resolver re-reads config from the registry (loader serialization strips function refs).

## Form Fields

- **Employee picker**: displays full name (`first_name + last_name`), not just first name.
- **Date picker**: single-date fields must pick exactly one date; range pickers only when the field is explicitly a range. No accidental multi-select on single-date fields.
- **FK dropdowns**: show the configured `fkLabelColumn` value, not the raw id.

## Layout

- **Navbar (72px)** holds: navigation section header (left, matches sidebar width), filter slot, global search, profile menu.
- **Sidebar**: icon + label rows only, no section headers inline — the section header lives in the navbar.

## Floating Create (+) Button

- **Every list view with a `create` affordance has a floating green `+` button.**
- Position: **fixed, bottom-right** of the list container (`fixed right-10 bottom-10 z-30`).
- Shape: **circle**, `h-14 w-14 rounded-full`, icon-only (`Plus`).
- Color: `variant="brand"` (green gradient) — green is reserved for *add / positive*.
- Shadow: `shadow-lg` elevated from the table surface.
- Clicking opens the `CreatePanel` (right-side Sheet) with the config's `formFields`.
- Hidden when `config.formFields` is empty.

## Typography (from DESIGN.md §3)

| Role  | Size    | Weight | Use                                  |
| ----- | ------- | ------ | ------------------------------------ |
| H1    | 32px    | 600    | Page title                           |
| H2    | 24px    | 600    | Section heading                      |
| H3    | 20px    | 600    | Sub-section                          |
| Body  | 16px    | 400    | Default body copy                    |
| Small | 14px    | 400    | Table cells, captions, secondary copy |
| Label | 14px    | 500    | Form labels, nav items, buttons      |
| Mono  | 14px    | 400    | IDs, codes, numeric columns          |

Font: **Inter Variable**. Mono: **Geist Mono Variable**.

## Color Usage

- **Green = add / positive action** (Create button, success toasts). Don't repurpose green for neutral controls.
- **Status badges**: neutral plain text — semantic colors removed.
- **Destructive** = red, outline variant only when confirming.
- **All data coloring on tables is off** (see Tables).
