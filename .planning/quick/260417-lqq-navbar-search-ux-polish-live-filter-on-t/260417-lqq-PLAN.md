---
phase: quick-260417-lqq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/navbar-search.tsx
  - app/components/workspace-shell/workspace-navbar.tsx
autonomous: false
requirements:
  - QUICK-260417-LQQ
must_haves:
  truths:
    - "Typing in the navbar search palette filters the active AG Grid table live — every keystroke updates the visible rows, no Enter required, no CommandItem selection required"
    - "An obvious clear affordance exists: (a) an X icon button at the right edge of the palette input that clears the input AND the active-table filter, (b) Esc on an empty input closes the popover, (c) Esc on a non-empty input first clears the input + filter, then closes the popover"
    - "A visible hairline separator renders between the 'Modules' and 'Pages' CommandGroups (and, when present, between 'Active Page' context row and Modules) using cmdk's CommandSeparator primitive styled with bg-border"
    - "The palette is anchored to the navbar search trigger as a Radix Popover (not centered modal). It opens directly below the trigger with a DESIGN.md-compliant border + shadow + smooth open animation, using data-[state=open] slide-in-from-top + fade + zoom tokens from the Popover primitive"
    - "Cmd/Ctrl+K still toggles the popover; Esc still closes it; outside-click still closes it; focus auto-returns to the input on open"
    - "All existing navigation behavior is preserved: Modules + Pages CommandItems still navigate on select; existing data-test selectors (workspace-navbar-search-trigger, navbar-search-item-<path>) still resolve; Cmd+K keyboard wiring untouched"
    - "When no active AG Grid table is registered (home, auth, detail routes, non-list routes), typing does NOT write to the active-table context (no cross-page leak) and the palette shows nav-only groups — degrades to today's behavior"
    - "Navigating away from a list page via a CommandItem closes the popover AND clears the active-table query (already handled by existing unregisterActiveTable on AgGridListView unmount — verify not regressed)"
    - "Popover surfaces and inner items use only DESIGN.md tokens (bg-popover, text-popover-foreground, border, shadow, bg-accent, aria-selected styles). No raw hex. WCAG AA contrast in both themes."
    - "No per-table search input introduced; UI-RULES.md §Search ('Global search only. No per-table search bars.') is upheld"
  artifacts:
    - path: "app/components/navbar-search.tsx"
      provides: "Rewritten palette built on Popover + PopoverAnchor + bare Command primitive (not CommandDialog). Live filter on every keystroke, X clear button, CommandSeparator between groups, anchored below trigger."
      contains: "PopoverAnchor"
      contains_also:
        - "CommandSeparator"
        - "useActiveTableSearch"
    - path: "app/components/workspace-shell/workspace-navbar.tsx"
      provides: "Unchanged wiring — still passes items + renderTrigger. No prop contract change."
      contains: "NavbarSearch"
  key_links:
    - from: "navbar-search.tsx CommandInput onValueChange"
      to: "ActiveTableSearchContext.setQuery (on EVERY keystroke when activeTable is registered)"
      via: "handleInputChange(value) -> setInput(value); if (activeTable) setQuery(value.trim())"
      pattern: "setQuery\\(.*trim"
    - from: "navbar-search.tsx PopoverAnchor"
      to: "navbar trigger button (rendered via renderTrigger render-prop)"
      via: "<PopoverAnchor asChild>{renderTrigger({ open: () => setOpen(true), isMac })}</PopoverAnchor>"
      pattern: "PopoverAnchor asChild"
    - from: "navbar-search.tsx clear button"
      to: "input state + active-table context"
      via: "handleClear() -> setInput(''); clearQuery(); input element .focus()"
      pattern: "clearQuery"
    - from: "navbar-search.tsx Popover"
      to: "open state + Cmd+K keyboard effect"
      via: "<Popover open={open} onOpenChange={setOpen}> with existing useEffect toggling open on Cmd/Ctrl+K"
      pattern: "Popover open=\\{open\\}"
---

<objective>
Polish the navbar command palette shipped in quick task 260417-lbu so it matches a modern, anchored combobox UX (Vercel/Linear style). Four concrete fixes: (1) live-filter the active AG Grid table on every keystroke — no Enter / CommandItem selection required, (2) add an obvious clear affordance (X button in the input + Esc semantics), (3) insert a visible separator between the "Modules" and "Pages" groups using cmdk's `CommandSeparator` primitive, (4) re-anchor the palette directly below the navbar search trigger as a Radix `Popover` instead of a centered `CommandDialog` modal.

Purpose: The palette is the single global-search surface (UI-RULES.md §Search). The first iteration worked but didn't feel like a palette — it was a centered modal and required an extra explicit "Filter X matching Y" selection to commit the filter. The user's brief is to make it feel like a native combobox: type → see the table filter instantly, click X → reset, press Esc → dismiss.

Output: A reworked `app/components/navbar-search.tsx` that swaps `CommandDialog` for `Popover` + `PopoverAnchor` wrapping a bare `Command` primitive, wires live-filter on every keystroke, adds a clear X icon inside the input row, and uses `CommandSeparator` between groups. No prop-contract changes to `NavbarSearch` itself (consumers unaffected). `workspace-navbar.tsx` touched only if the renderTrigger wrapper needs adjustment — otherwise leave untouched.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@UI-RULES.md
@DESIGN.md
@packages/ui/CLAUDE.md
@app/components/navbar-search.tsx
@app/components/active-table-search-context.tsx
@app/components/workspace-shell/workspace-navbar.tsx
@app/components/ag-grid/ag-grid-list-view.tsx
@packages/ui/src/shadcn/command.tsx
@packages/ui/src/shadcn/popover.tsx
@.planning/quick/260417-lbu-navbar-search-bar-should-search-active-p/260417-lbu-SUMMARY.md

<interfaces>
<!-- Existing exports this plan consumes. No codebase exploration required. -->

From `@aloha/ui/popover` (packages/ui/src/shadcn/popover.tsx):
```typescript
// Root (controlled: open, onOpenChange)
export const Popover: typeof PopoverPrimitive.Root;
// Anchor: allows positioning the portalled content relative to any rendered element
// Use with `asChild` to merge into an existing trigger/button without an extra wrapper
export const PopoverAnchor: typeof PopoverPrimitive.Anchor;
// Trigger (NOT used here — we use Anchor so we keep manual open() control via renderTrigger)
export const PopoverTrigger: typeof PopoverPrimitive.Trigger;
// Content — already styled with DESIGN.md tokens:
//   bg-popover text-popover-foreground border p-4 shadow-md rounded-md
//   data-[state=open]:animate-in fade-in-0 zoom-in-95 slide-in-from-top-2
//   align/sideOffset props available (defaults: align='center', sideOffset=4)
export const PopoverContent: ForwardRefExoticComponent<PopoverContentProps>;
```

From `@aloha/ui/command` (packages/ui/src/shadcn/command.tsx):
```typescript
// Bare Command primitive — renders flex-col container with bg-popover text-popover-foreground
// Use directly inside PopoverContent (do NOT use CommandDialog which wraps Dialog)
export const Command: ForwardRefExoticComponent<CommandProps>;

// Input — controlled via value + onValueChange; includes MagnifyingGlass icon at left,
// border-b divider at bottom, h-10 py-3 text-sm. The wrapping div has cmdk-input-wrapper
// attribute — additional children inside the wrapper (like a trailing clear X button)
// require MODIFYING the CommandInput component OR rendering them in a parallel div outside
// CommandInput. We will take the simpler path: wrap CommandInput + a trailing clear button
// in a flex row using a custom div (see action). DO NOT fork the CommandInput component.
export const CommandInput: ForwardRefExoticComponent<CommandInputProps>;

export const CommandList: ForwardRefExoticComponent<...>; // max-h-[300px] overflow-y-auto
export const CommandGroup: ForwardRefExoticComponent<...>; // has cmdk-group-heading styling
export const CommandItem: ForwardRefExoticComponent<...>; // aria-selected bg-accent
export const CommandSeparator: ForwardRefExoticComponent<...>; // bg-border -mx-1 h-px ← use this
export const CommandEmpty: ForwardRefExoticComponent<...>; // py-6 text-center text-sm

// NOT used in this plan:
export const CommandDialog: ...; // REMOVE from imports — replaced by Popover
```

From `~/components/active-table-search-context` (unchanged — shipped in 260417-lbu):
```typescript
interface ActiveTableSearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;           // ← already exists, used by new X button
  activeTable: { slug: string; displayName: string } | null;
  registerActiveTable: (slug: string, displayName: string) => void;
  unregisterActiveTable: (slug: string) => void;
}
export function useActiveTableSearch(): ActiveTableSearchContextValue;
```

Current `NavbarSearchProps` (UNCHANGED in this plan):
```typescript
export interface NavbarSearchItem {
  path: string;
  label: string;
  group?: string;
}
interface NavbarSearchProps {
  renderTrigger?: (props: { open: () => void; isMac: boolean }) => ReactNode;
  items?: NavbarSearchItem[];
}
```

From `workspace-navbar.tsx` (lines 105-123) — the renderTrigger is already a button:
- Renders `<button onClick={open} data-test="workspace-navbar-search-trigger">`
- This button MUST become the `PopoverAnchor asChild` target so the popover opens anchored to it.
- Plan: move the `<PopoverAnchor asChild>` wrapper INSIDE `NavbarSearch` around the `renderTrigger(...)` invocation — that way the consumer (workspace-navbar.tsx) needs no changes.

From `DESIGN.md` key tokens used below:
- `bg-popover`, `text-popover-foreground` — popover surfaces (white light / slate-800 dark)
- `border` → uses `--border` (slate-200 light / slate-700 dark)
- `shadow-md` → soft slate-900 alpha scale
- `bg-accent`, `text-accent-foreground` — selected CommandItem row
- `text-muted-foreground` — placeholder, secondary icons, group headings
- `bg-border` → hairline between groups (CommandSeparator default)
- No raw hex allowed.

From `UI-RULES.md` §Search (lines 56-59):
> - Global search only. No per-table search bars.
> - Keyboard shortcut: `/` opens the search palette (standard Linear/GitHub pattern), in addition to `Cmd/Ctrl+K`.

Note: `/` shortcut is STILL out of scope (deferred in 260417-lbu SUMMARY; reaffirmed here).
</interfaces>

<positioning>
<!-- How the new popover is anchored. -->

Today (260417-lbu):
```tsx
<button data-test="workspace-navbar-search-trigger" onClick={open}>Search...</button>
<CommandDialog open onOpenChange>  <!-- Dialog — centered modal -->
  <CommandInput ... />
  <CommandList>...</CommandList>
</CommandDialog>
```

After this plan:
```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverAnchor asChild>
    {renderTrigger({ open: () => setOpen(true), isMac })}
    {/* or the fallback button — exactly one child */}
  </PopoverAnchor>
  <PopoverContent
    align="start"
    sideOffset={8}
    className="w-[520px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden"
    onOpenAutoFocus={(e) => { /* default focuses first focusable — CommandInput — good */ }}
  >
    <Command>
      <div className="flex items-center border-b">
        <CommandInput className="border-b-0 flex-1" ... />
        {input.length > 0 && (
          <button onClick={handleClear} data-test="navbar-search-clear" ...>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {/* Active Page info row (optional) */}
        <CommandGroup heading="Modules">...</CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">...</CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

Width rationale: trigger button is ~max-w-md (28rem ≈ 448px). Popover at 520px is slightly wider — visually anchored, not visually "same as trigger" which would look cramped with the clear X + magnifying glass icons. Capped at `max-w-[calc(100vw-2rem)]` for narrow viewports.

`align="start"` + `sideOffset={8}` → popover's left edge aligns with trigger's left edge, 8px below the trigger. This matches Vercel/Linear palette positioning.

CommandInput's default wrapper already includes `border-b px-3` and the MagnifyingGlass icon — we wrap it in a flex row WITH the clear X button, and set `border-b-0` on the inner wrapper so the outer flex-row owns the bottom divider. The clear button is conditionally rendered only when `input.length > 0`.

Radix Popover handles: outside-click close, Esc close, focus trap, return focus to anchor on close, portal to document.body, and `data-state` animation hooks (used by shadcn popover content class). All free.
</positioning>

<live_filter_flow>
<!-- How the live filter works at runtime. -->

1. User on `/home/<account>/human_resources/register`. `AgGridListView` mounts, calls `useRegisterActiveTable('register', 'Register')` → context's `activeTable` becomes `{slug:'register', displayName:'Register'}`.
2. User presses `Cmd+K`. `Popover` opens anchored to the navbar trigger (not centered).
3. User types `a`. `CommandInput.onValueChange('a')` fires → component calls `setInput('a')` AND, because `activeTable` is non-null, `setQuery('a')` on the context. `AgGridListView` re-renders (quickFilterText='a'). Table filters instantly. cmdk ALSO fuzzy-filters its own CommandItems by 'a' — both filters run in parallel and are independent.
4. User types more: `ali`, `alic`, `alice`. Each keystroke: context.setQuery and cmdk filter both update. No debounce (AG Grid cacheQuickFilter=true is fast for typical row counts; existing implementation in 260417-lbu confirms this).
5. User clicks the X clear button (only visible when `input.length > 0`). `handleClear()`: `setInput('')`, `clearQuery()`, refocus input. Table shows all rows. Popover stays open.
6. Alternative: user presses Esc.
   - If input is non-empty: intercept on keyDown; clear input + clearQuery; keep popover open (first Esc press).
   - If input is empty: default Radix behavior closes popover.
7. User selects a Modules/Pages CommandItem → navigate + close popover. Active-table query remains set (same semantic as 260417-lbu). If they navigate to a list page that registers a different active table, context's registerActiveTable clears the stale query (existing logic).
8. User on home page (no active table) opens palette: no active-table wiring kicks in. Typing filters cmdk only — `setQuery` is NOT called (guard on `if (activeTable)`), so no cross-page leak.

Edge cases:
- Whitespace-only input: call `setQuery('')` (or skip) — we pass `input.trim()` to `setQuery`. AG Grid's `quickFilterText=''` = no filter.
- Popover re-open: input starts empty (we reset on open→true transition via ref-guarded useEffect, same pattern as 260417-lbu). Active-table filter stays set because it lives in context. User sees a clean input + already-filtered table. Typing new text will OVERWRITE the active-table query live.
- Typing on a non-list route: `setQuery` is NOT called (guard), so no stale query is written. If a filter was previously set on another page, that page has unmounted and unregisterActiveTable cleared it (existing unregister-with-query-clear in context).
- cmdk's internal filter uses `input` (controlled) — unchanged.
</live_filter_flow>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Swap CommandDialog for Popover + live-filter + clear X + CommandSeparator in NavbarSearch</name>
  <files>
    app/components/navbar-search.tsx (rewrite — single file),
    app/components/workspace-shell/workspace-navbar.tsx (touch only if PopoverAnchor asChild needs a DOM change; otherwise leave untouched — see note below)
  </files>
  <behavior>
    - `NavbarSearch` renders `<Popover open onOpenChange>` wrapping `<PopoverAnchor asChild>{trigger}</PopoverAnchor>` and `<PopoverContent>...<Command>...</Command></PopoverContent>`. The trigger is either `renderTrigger({open, isMac})` or the fallback button. `PopoverAnchor asChild` requires exactly one child element that supports a ref — both the fallback `<button>` and the consumer's `<button>` in `workspace-navbar.tsx` qualify.
    - `PopoverContent` uses `align="start" sideOffset={8}` and `className="w-[520px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden"`. It relies on the primitive's default `bg-popover text-popover-foreground border shadow-md rounded-md` + `data-[state=open]:animate-in` classes. No raw hex.
    - Inside `PopoverContent`, render a bare `<Command>` (from `@aloha/ui/command`) — NOT `CommandDialog`.
    - `CommandInput` is controlled: `value={input} onValueChange={handleInputChange}` where `handleInputChange(v)` does: `setInput(v)`; `if (activeTable) setQuery(v.trim())`.
    - The input row is wrapped in a custom `<div className="flex items-center border-b">` that contains:
        a) `<CommandInput className="border-b-0 flex-1" placeholder="Type a command or search..." value={input} onValueChange={handleInputChange} />`
        b) When `input.length > 0`: a `<button type="button" data-test="navbar-search-clear" aria-label="Clear search" onClick={handleClear} className="text-muted-foreground hover:text-foreground mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-accent"><X className="h-3.5 w-3.5" /></button>`
      Rationale: `CommandInput`'s internal wrapper has its own `border-b`; we neutralize it with `border-b-0` on the inner input and let the outer flex row draw a single bottom border across input + clear button. Matches the hairline rhythm used throughout Shadcn.
    - `handleClear()`: `setInput('')`; `clearQuery()`; focus the input (capture a ref via `useRef<HTMLInputElement>(null)` forwarded to `CommandInput`). After clear, popover STAYS open (user can keep typing).
    - Keyboard:
        a) Existing Cmd/Ctrl+K effect stays untouched — toggles `open`.
        b) Add a custom `onKeyDown` on the input OR on the outer Command element: if `e.key === 'Escape'` AND `input.length > 0`, call `e.preventDefault(); e.stopPropagation(); handleClear();` — this suppresses Radix's default "Esc closes popover" for the first press. Second Esc (on empty input) falls through to Radix and closes the popover. Attach this handler to `<Command onKeyDown=...>` (cmdk forwards it); this runs BEFORE Radix's own key handler because cmdk's listener is on the Command element, which is inside PopoverContent.
    - "Active Page" affordance: REMOVE the explicit `<CommandGroup heading="Active Page"><CommandItem ...>Filter X matching "Y"...` block — it was the old Enter-to-commit mechanism, now obsolete because filtering is live. Instead, when `activeTable && input.trim().length > 0`, render a non-interactive hint line at the TOP of the `CommandList` (ABOVE the Modules group):
        ```tsx
        {activeTable && input.trim().length > 0 && (
          <div
            data-test="navbar-search-active-filter-hint"
            className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs"
          >
            <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Filtering <span className="text-foreground font-medium">{activeTable.displayName}</span> rows live</span>
          </div>
        )}
        ```
      This is informational (no `CommandItem`, no interaction), just reassures the user that the live-filter is active. The actual filter happens automatically via `onValueChange`.
    - Between groups, insert `<CommandSeparator />`:
        - After the hint line (if rendered) and before "Modules".
        - Between "Modules" and "Pages".
      Render order: hint (opt) → optional separator → Modules group → separator → Pages group. Implementation uses the existing `grouped` Map: iterate entries in the known order `['Modules', 'Pages']` and interleave separators. Items without an explicit group fall under `Suggestions` and render last (keep existing bucketing).
    - `PopoverContent` `onCloseAutoFocus` default is fine (returns focus to the anchor). No need to override.
    - Imports touched:
        - REMOVE: `CommandDialog` from `@aloha/ui/command` import list.
        - ADD: `CommandSeparator` to `@aloha/ui/command` import list.
        - ADD: `Popover, PopoverAnchor, PopoverContent` from `@aloha/ui/popover`.
        - ADD: `X` from `lucide-react` (next to the existing `Filter, Search` imports).
        - KEEP: the existing context hook + `useEffect` for Cmd+K + the `lastOpenRef` pattern for input reset on open.
        - KEEP: `Kbd` import (used by fallback trigger).
    - `renderTrigger` contract UNCHANGED — consumer (workspace-navbar.tsx) still receives `{open, isMac}` and returns a button. Do NOT modify workspace-navbar.tsx UNLESS Radix's `PopoverAnchor asChild` complains about forwarded refs on the consumer button — in that case, the fix is to ensure the consumer's button is a plain DOM `<button>` (it already is; line 108-121). No change expected.
    - Keep every existing `data-test` attribute:
        - `data-test="navbar-search-trigger"` on fallback button (for the tab that doesn't use renderTrigger).
        - `data-test={`navbar-search-item-${item.path}`}` on each navigation CommandItem.
      ADD:
        - `data-test="navbar-search-clear"` on the X button.
        - `data-test="navbar-search-active-filter-hint"` on the hint line.
        - `data-test="navbar-search-popover"` on `<PopoverContent>` (optional E2E hook; cheap to add).
      REMOVE:
        - `data-test="navbar-search-filter-active-table"` — the CommandItem it labeled no longer exists.
    - `autonomous: false` on this plan because Task 2 is a human smoke checkpoint; Task 1 itself is fully autonomous.
  </behavior>
  <action>
    Rewrite `app/components/navbar-search.tsx`. Start from the current file (already reads correctly — see context @app/components/navbar-search.tsx) and apply these precise changes:

    1. Replace the imports block (lines 1-17) with:
       ```tsx
       import { type ReactNode, useEffect, useRef, useState } from 'react';

       import { useNavigate } from 'react-router';

       import { Filter, Search, X } from 'lucide-react';

       import {
         Command,
         CommandEmpty,
         CommandGroup,
         CommandInput,
         CommandItem,
         CommandList,
         CommandSeparator,
       } from '@aloha/ui/command';
       import { Kbd } from '@aloha/ui/kbd';
       import {
         Popover,
         PopoverAnchor,
         PopoverContent,
       } from '@aloha/ui/popover';

       import { useActiveTableSearch } from '~/components/active-table-search-context';
       ```

    2. Keep the public `NavbarSearchItem` interface and `NavbarSearchProps` interface EXACTLY as they are today (no contract changes).

    3. Inside the function body, after the existing Cmd+K useEffect and after the `lastOpenRef` reset effect, add:

       ```tsx
       const inputRef = useRef<HTMLInputElement>(null);
       const { activeTable, setQuery, clearQuery } = useActiveTableSearch();

       const handleInputChange = (value: string) => {
         setInput(value);
         if (activeTable) {
           setQuery(value.trim());
         }
       };

       const handleClear = () => {
         setInput('');
         clearQuery();
         // Refocus so the user can keep typing immediately after clearing.
         inputRef.current?.focus();
       };

       const handleCommandKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
         if (e.key === 'Escape' && input.length > 0) {
           e.preventDefault();
           e.stopPropagation();
           handleClear();
         }
       };
       ```

       (Type import: add `type KeyboardEvent as ReactKeyboardEvent` to the first line's `react` import.)

    4. REMOVE the existing `handleFilterActiveTable` function entirely (it's dead — no CommandItem calls it anymore).

    5. Replace the entire `return (...)` block. The trigger fallback button stays identical to today; the dialog-and-list structure is replaced by Popover + bare Command:

       ```tsx
       return (
         <Popover open={open} onOpenChange={setOpen}>
           <PopoverAnchor asChild>
             {renderTrigger ? (
               renderTrigger({ open: () => setOpen(true), isMac })
             ) : (
               <button
                 type="button"
                 data-test="navbar-search-trigger"
                 onClick={() => setOpen(true)}
                 className="border-border bg-muted/50 text-muted-foreground hover:bg-muted flex h-7 w-56 items-center gap-2 rounded-md border px-2 text-xs transition-colors"
                 aria-label="Open search"
               >
                 <Search className="h-3.5 w-3.5 shrink-0" />
                 <span className="flex-1 text-left">Search...</span>
                 <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>
               </button>
             )}
           </PopoverAnchor>

           <PopoverContent
             align="start"
             sideOffset={8}
             className="w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
             data-test="navbar-search-popover"
           >
             <Command
               onKeyDown={handleCommandKeyDown}
               className="[&_[cmdk-input-wrapper]]:border-b-0"
             >
               <div className="border-border flex items-center border-b">
                 <CommandInput
                   ref={inputRef}
                   placeholder="Type a command or search..."
                   value={input}
                   onValueChange={handleInputChange}
                   className="border-b-0 flex-1"
                 />
                 {input.length > 0 && (
                   <button
                     type="button"
                     data-test="navbar-search-clear"
                     onClick={handleClear}
                     aria-label="Clear search"
                     className="text-muted-foreground hover:bg-accent hover:text-foreground mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
                   >
                     <X className="h-3.5 w-3.5" />
                   </button>
                 )}
               </div>

               <CommandList className="max-h-[360px]">
                 <CommandEmpty>No results found.</CommandEmpty>

                 {activeTable && input.trim().length > 0 && (
                   <>
                     <div
                       data-test="navbar-search-active-filter-hint"
                       className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs"
                     >
                       <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                       <span>
                         Filtering{' '}
                         <span className="text-foreground font-medium">
                           {activeTable.displayName}
                         </span>{' '}
                         rows live
                       </span>
                     </div>
                     <CommandSeparator />
                   </>
                 )}

                 {renderGroups(grouped, handleSelect)}
               </CommandList>
             </Command>
           </PopoverContent>
         </Popover>
       );
       ```

    6. Extract a `renderGroups` helper (defined inside the component or as a module-scope function — your choice; module-scope is cleaner) that iterates the grouped map in a deterministic order AND interleaves `<CommandSeparator />` between consecutive groups:

       ```tsx
       const GROUP_ORDER = ['Modules', 'Pages', 'Suggestions'] as const;

       function renderGroups(
         grouped: Map<string, NavbarSearchItem[]>,
         handleSelect: (path: string) => void,
       ) {
         // Deterministic order: Modules → Pages → any others (alphabetical).
         const knownOrdered = GROUP_ORDER.filter((g) => grouped.has(g));
         const extras = Array.from(grouped.keys())
           .filter((g): g is string => !GROUP_ORDER.includes(g as typeof GROUP_ORDER[number]))
           .sort();
         const ordered = [...knownOrdered, ...extras];

         return ordered.map((heading, idx) => {
           const groupItems = grouped.get(heading);
           if (!groupItems || groupItems.length === 0) return null;
           return (
             <FragmentWithSeparator key={heading} showSeparator={idx > 0}>
               <CommandGroup heading={heading}>
                 {groupItems.map((item) => (
                   <CommandItem
                     key={item.path}
                     value={`${item.label} ${item.path}`}
                     keywords={[item.label, item.group ?? ''].filter(Boolean)}
                     onSelect={() => handleSelect(item.path)}
                     data-test={`navbar-search-item-${item.path}`}
                   >
                     {item.label}
                   </CommandItem>
                 ))}
               </CommandGroup>
             </FragmentWithSeparator>
           );
         });
       }

       function FragmentWithSeparator({
         children,
         showSeparator,
       }: {
         children: ReactNode;
         showSeparator: boolean;
       }) {
         return (
           <>
             {showSeparator && <CommandSeparator />}
             {children}
           </>
         );
       }
       ```

    7. Keep `handleSelect`, the Cmd+K effect, the `lastOpenRef` open-transition reset, and the `grouped` Map build logic UNCHANGED.

    8. Do NOT modify `app/components/workspace-shell/workspace-navbar.tsx`. Its existing render-prop call site `<NavbarSearch items={searchItems} renderTrigger={({ open }) => <button ... />} />` is compatible with the new `<PopoverAnchor asChild>` wrapping because (a) Radix forwards ref to the button child automatically via `Slot`, (b) the consumer already renders a single native `<button>` element. If during execution the typecheck surfaces a missing `ref` forwarding warning on the consumer's button, update `files_modified` in the SUMMARY and apply the minimal fix (most likely none).

    9. Run verification: `pnpm typecheck`, `pnpm lint app/components/navbar-search.tsx`, `pnpm format:fix app/components/navbar-search.tsx`. Check that all existing `data-test` selectors (`workspace-navbar-search-trigger`, `navbar-search-trigger`, `navbar-search-item-${path}`) still resolve — no regressions. Confirm `navbar-search-filter-active-table` is gone (intentional — the CommandItem is gone).

    10. Zero-regression guard on the context: DO NOT modify `active-table-search-context.tsx`. Live filter uses the existing `setQuery` + `clearQuery` callbacks. `AgGridListView`'s `useRegisterActiveTable` + `useActiveTableSearch()` wiring is untouched.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
    <automated>pnpm lint app/components/navbar-search.tsx</automated>
    <automated>pnpm format:fix app/components/navbar-search.tsx</automated>
  </verify>
  <done>
    - `app/components/navbar-search.tsx` no longer imports `CommandDialog`; imports `Popover`, `PopoverAnchor`, `PopoverContent` from `@aloha/ui/popover`, and `CommandSeparator` from `@aloha/ui/command`, and `X` from `lucide-react`.
    - The palette renders inside `PopoverContent` anchored with `align="start" sideOffset={8}` and widths `w-[520px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden`.
    - `CommandInput` is controlled and calls `setQuery(value.trim())` on EVERY keystroke when `activeTable` is non-null; does not call `setQuery` when `activeTable` is null.
    - An X icon button appears to the right of the input ONLY when `input.length > 0`, has `aria-label="Clear search"` and `data-test="navbar-search-clear"`, and on click resets both the input and the active-table query then refocuses the input.
    - `CommandSeparator` renders between "Modules" and "Pages" (and between the active-page hint and Modules when the hint is present).
    - The explicit "Filter <X> rows matching <Y>" CommandItem is removed.
    - An informational hint row (non-CommandItem) appears above the groups when `activeTable && input.trim().length > 0`.
    - Esc-on-non-empty-input clears input+filter without closing the popover; Esc-on-empty-input closes the popover (default Radix behavior).
    - Cmd/Ctrl+K still opens/closes the popover (existing keyboard effect unchanged).
    - `pnpm typecheck` passes.
    - `pnpm lint app/components/navbar-search.tsx` has no new errors.
    - `pnpm format:fix` applied.
    - Existing `data-test` selectors (`workspace-navbar-search-trigger`, `navbar-search-trigger`, `navbar-search-item-<path>`) still resolve; new selectors (`navbar-search-clear`, `navbar-search-active-filter-hint`, `navbar-search-popover`) present.
    - `workspace-navbar.tsx` unchanged (preferred) OR minimally adjusted with note in SUMMARY.
    - `active-table-search-context.tsx` and `ag-grid-list-view.tsx` unchanged (zero-regression guard).
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Human smoke-test the polished navbar search palette (live-filter, clear, separator, anchored popover, dark+light)</name>
  <what-built>
    Palette rewritten as an anchored Radix Popover (not centered modal) with live-filter on every keystroke, an X clear button inside the input, a visible `CommandSeparator` between "Modules" and "Pages", a non-interactive hint line when filtering an active table, and DESIGN.md-compliant surfaces with smooth open/close animation. No prop-contract changes, no new UI libraries, existing nav behavior preserved.
  </what-built>
  <how-to-verify>
    1. Pull the branch, `pnpm dev`, sign in, navigate to `/home/<account>/human_resources/register` (or any AG Grid list page).
    2. Confirm the table renders with rows. Note the total row count in the bottom-left corner (or visually).
    3. Click the navbar search trigger (or press `Cmd+K` on macOS / `Ctrl+K` elsewhere).
    4. EXPECT: A popover opens **directly below the trigger**, left-edge aligned with the trigger. NOT a centered modal. It should be roughly 520px wide, have a soft border + shadow, and fade/zoom/slide-down smoothly. The input is focused.
    5. Type `a` (or any substring that matches at least one visible row's cell text — e.g. part of an employee's last name).
    6. EXPECT (LIVE FILTER, issue #1): As you type each character, the Register table behind the popover filters in real time. No Enter required. No CommandItem selection required. The palette also narrows its own Modules/Pages groups via cmdk's fuzzy match — both filters run independently.
    7. Above the groups, EXPECT a small muted hint line: `Filtering Register rows live` (with a filter icon). It's not clickable — it's informational.
    8. EXPECT a visible hairline separator between the "Modules" and "Pages" group headings (issue #3). Also between the hint line and the first group.
    9. EXPECT an X icon button inside the input row on the right side (issue #2). Click it.
    10. EXPECT: Input clears, table returns to full row count, popover STAYS open, input stays focused.
    11. Type another query. EXPECT live filter resumes.
    12. Press `Esc`. EXPECT: first press clears the input and the table filter (if input was non-empty); second press on an empty input closes the popover.
    13. Re-open palette (`Cmd+K`). Input starts empty. Type a query. Click outside the popover. EXPECT: popover closes. The table FILTER from the last keystroke PERSISTS (same semantic as 260417-lbu — the typed input is ephemeral; the active-table query lives in context).
    14. Open the palette again. Type a completely new query. EXPECT: table re-filters live to the new query.
    15. Click a Modules or Pages CommandItem. EXPECT: navigation occurs; popover closes; on the new page, if it's a different AG Grid list, the filter is cleared (existing 260417-lbu behavior — `registerActiveTable` clears stale query on slug change).
    16. Navigate to the home page (`/home/<account>`). Open palette. EXPECT: no hint line appears no matter what you type (no active table registered). Typing filters cmdk but NOT the active-table context (no cross-page leak).
    17. Navigate to a detail route (click any row on Register — goes to `/home/<account>/human_resources/register/<id>`). Open palette. EXPECT: no hint line (detail route does not register as an active table).
    18. Visual polish check (issue #4 + bonus):
        - Popover anchored directly below trigger with a small gap (~8px). NOT centered. NOT full-viewport.
        - Border hairline + soft shadow — feels elevated, not floaty.
        - Open/close animation is smooth (fade + zoom + slide-down on open).
        - Active/selected CommandItem uses `bg-accent` (not any raw color).
        - Hairline `CommandSeparator` between groups is visible but quiet.
    19. Toggle dark mode (theme switcher). Repeat steps 3-12 in dark mode. EXPECT: all surfaces, borders, text, and the X button readable. Contrast is WCAG AA both directions. Slate-800 popover surface with slate-700 border in dark; white popover surface with slate-200 border in light.
    20. Regression checks:
        - `data-test="workspace-navbar-search-trigger"` still resolves (check via devtools).
        - `data-test="navbar-search-item-<any-path>"` still resolves on visible items.
        - No per-table search input has appeared anywhere (UI-RULES.md §Search upheld).
        - `AgGridListView` and `active-table-search-context.tsx` diffs are empty on this branch.
    21. Register + one ADDITIONAL AG Grid list page check: navigate from Register to Departments/Contractors/etc. (whichever is an AG Grid list). Confirm the filter is cleared on arrival and live-filter works there too.
  </how-to-verify>
  <resume-signal>Type "approved" or describe which of the 4 issues + bonus polish points still need work.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser → client JS | User keyboard input crosses into controlled React state |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-lqq-01 | I (Information Disclosure) | ActiveTableSearchContext.setQuery called on every keystroke | accept | No secret data involved; the query string is already in React state via controlled `input`. setQuery only writes the trimmed string to client context; no network. |
| T-lqq-02 | T (Tampering) | Popover + clear button DOM | accept | Entirely client-side visual chrome; no privilege decisions live here. AG Grid quickFilterText only affects row visibility on already-loaded data — no data egress. |
| T-lqq-03 | D (Denial of Service) | Live-filter on every keystroke | mitigate | `cacheQuickFilter={true}` is already set in `AgGridWrapper` (confirmed 260417-lbu SUMMARY). For typical list pages (<5k rows) quick-filter is O(n) over cached cell text — fast enough. If a future page balloons past 10k rows, add a trailing-edge debounce on `setQuery` (out of scope here; note in follow-ups). |
| T-lqq-04 | S (Spoofing) | `data-test` attributes | accept | Test hooks only; no auth implication. |
</threat_model>

<verification>
- `pnpm typecheck` clean across the app.
- `pnpm lint` has no new errors in `app/components/navbar-search.tsx`.
- `pnpm format:fix` applied.
- Manual smoke (Task 2) passes all 21 checks in BOTH light and dark modes.
- Existing `NavbarSearch` E2E selectors still resolve; new selectors present.
- UI-RULES.md §Search rule upheld: no per-table input introduced.
- DESIGN.md tokens only: `bg-popover`, `text-popover-foreground`, `border`, `shadow-md`, `bg-accent`, `text-muted-foreground`, `bg-border`. No raw hex.
- Zero-regression guard: `active-table-search-context.tsx` and `ag-grid-list-view.tsx` diffs are empty.
</verification>

<success_criteria>
- Typing in the palette filters the active AG Grid table on every keystroke — no Enter, no CommandItem selection needed.
- An X clear button in the input resets input + table filter; Esc has the same first-press effect on non-empty input.
- A `CommandSeparator` hairline renders between "Modules" and "Pages" groups.
- The palette opens as a Radix Popover anchored directly below the navbar search trigger (not a centered modal) with the shadcn popover animation and DESIGN.md tokens.
- All 260417-lbu behaviors preserved: Cmd/Ctrl+K, navigation via Modules/Pages items, active-table registration/unregistration, no per-table search, no cross-page filter leak.
- `pnpm typecheck` + `pnpm lint` pass on the branch.
</success_criteria>

<output>
After Task 1 completion, create `.planning/quick/260417-lqq-navbar-search-ux-polish-live-filter-on-t/260417-lqq-SUMMARY.md` listing:
- Files actually changed (expected: only `app/components/navbar-search.tsx`).
- The new Popover + PopoverAnchor render block.
- The controlled `handleInputChange` that writes `setQuery(value.trim())` on every keystroke.
- The clear X button + `handleClear` handler.
- The Esc keydown handler on `<Command>`.
- The `CommandSeparator` interleave logic in `renderGroups`.
- `data-test` diff (removed `navbar-search-filter-active-table`; added `navbar-search-clear`, `navbar-search-active-filter-hint`, `navbar-search-popover`).
- Notes on any follow-ups: `/` keyboard shortcut still not added (UI-RULES.md §Search mentions it; out of scope — track as a future quick task); debounce on `setQuery` deferred until a page is confirmed to exceed ~10k rows; legacy `TableListView` still not wired (consistent with 260417-lbu scope).
</output>
