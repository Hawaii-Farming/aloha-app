---
phase: quick-260417-lbu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/active-table-search-context.tsx
  - app/components/navbar-search.tsx
  - app/components/workspace-shell/workspace-navbar.tsx
  - app/routes/workspace/layout.tsx
  - app/components/ag-grid/ag-grid-list-view.tsx
autonomous: true
requirements:
  - QUICK-260417-LBU
must_haves:
  truths:
    - "User types a query in the navbar search palette; matching sub-modules/modules still appear in 'Modules' and 'Pages' groups (existing behavior preserved)"
    - "User on a list page with an AG Grid table (e.g. Register) sees a NEW group in the palette labeled 'Filter <SubModule Name>' containing a single selectable item that, when chosen, closes the palette AND filters the visible table rows to match the query"
    - "The active-table rows filter live via AG Grid's built-in quickFilterText (not server-side) — all currently-loaded rows whose cell text contains the query survive; others hide"
    - "Typing continues to filter the palette items; the 'Filter <SubModule Name>' row only appears when (a) user is on a sub-module list route with an AG Grid list view AND (b) the input has at least 1 non-whitespace character"
    - "When the user navigates to a different sub-module, or to a non-list route (home, detail, create, auth), the active-table filter is cleared and the 'Filter ...' row disappears — palette behavior degrades to today's nav-only search"
    - "Closing the palette without selecting the 'Filter ...' row leaves the table unfiltered; selecting it persists the filter on the active table until the user clears it, navigates away, or opens the palette again to type a new query"
    - "No per-table search input is introduced; UI-RULES.md §Search ('Global search only. No per-table search bars.') is upheld"
  artifacts:
    - path: "app/components/active-table-search-context.tsx"
      provides: "React context + provider exposing { query, setQuery, activeTable, registerActiveTable, unregisterActiveTable }"
      exports:
        - "ActiveTableSearchProvider"
        - "useActiveTableSearch"
        - "useRegisterActiveTable"
    - path: "app/components/navbar-search.tsx"
      provides: "CommandDialog palette with navigation groups + optional 'Filter <name>' row that writes to ActiveTableSearchContext"
      contains: "useActiveTableSearch"
    - path: "app/components/workspace-shell/workspace-navbar.tsx"
      provides: "Wires NavbarSearch (unchanged items prop) inside the provider; no prop changes"
    - path: "app/routes/workspace/layout.tsx"
      provides: "Mounts <ActiveTableSearchProvider> wrapping the workspace tree"
      contains: "ActiveTableSearchProvider"
    - path: "app/components/ag-grid/ag-grid-list-view.tsx"
      provides: "Reads query from ActiveTableSearchContext, forwards to AgGridWrapper.quickFilterText, registers/unregisters on mount/unmount"
      contains: "useRegisterActiveTable"
  key_links:
    - from: "navbar-search.tsx CommandInput onValueChange"
      to: "ActiveTableSearchContext.setQuery (only when 'Filter <name>' selected — input value itself drives cmdk filter as today)"
      via: "handleSelect of the filter CommandItem calls setQuery(currentInputValue); closes dialog"
      pattern: "setQuery\\(.*inputValue.*\\)"
    - from: "ag-grid-list-view.tsx"
      to: "AgGridWrapper quickFilterText prop"
      via: "const { query } = useActiveTableSearch(); <AgGridWrapper quickFilterText={query} ... />"
      pattern: "quickFilterText=\\{query\\}"
    - from: "ag-grid-list-view.tsx mount effect"
      to: "ActiveTableSearchContext registerActiveTable/unregisterActiveTable"
      via: "useRegisterActiveTable(subModuleSlug, subModuleDisplayName) — custom hook wrapping useEffect with cleanup"
      pattern: "useRegisterActiveTable"
    - from: "layout.tsx"
      to: "workspace tree"
      via: "<ActiveTableSearchProvider>...</ActiveTableSearchProvider> inside SidebarProvider"
      pattern: "ActiveTableSearchProvider"
---

<objective>
Unify navigation search and active-page row search in the existing navbar command palette. Today, the palette (`NavbarSearch`) only lets users jump to modules/sub-modules. This plan adds a second, context-aware capability: when the user is on a list page with an AG Grid table (e.g. Register), the palette offers a "Filter <SubModule Name>" action that applies the typed query to that table's client-side quick-filter, without introducing any per-table search bar.

Purpose: Solve the reported UX gap — users want ONE search input (the navbar) that both navigates AND narrows the active table. Upholds UI-RULES.md §Search (global search only).

Output: Small React context + provider, 1 new hook, additive changes to `NavbarSearch`, `WorkspaceNavbar` (provider mount — actually in layout), and `AgGridListView`. No changes to routes, loaders, or AG Grid infrastructure beyond wiring the already-supported `quickFilterText` prop.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@UI-RULES.md
@app/components/navbar-search.tsx
@app/components/workspace-shell/workspace-navbar.tsx
@app/routes/workspace/layout.tsx
@app/components/ag-grid/ag-grid-list-view.tsx
@app/components/ag-grid/ag-grid-wrapper.tsx

<interfaces>
<!-- Key existing contracts the executor needs. No codebase exploration required. -->

From `app/components/navbar-search.tsx` (current):
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

export function NavbarSearch(props?: NavbarSearchProps): JSX.Element;
```
- Uses `<CommandDialog open onOpenChange>` + `<CommandInput>` + `<CommandList>` + `<CommandGroup>` + `<CommandItem>` from `@aloha/ui/command` (cmdk).
- `CommandInput` is UNCONTROLLED today (no `value`/`onValueChange`) — cmdk manages typing internally for filtering CommandItems.
- `handleSelect(path)` calls `navigate(path)` then `setOpen(false)`.
- Cmd/Ctrl+K toggles the dialog (line 38-48 useEffect).

From `app/components/ag-grid/ag-grid-wrapper.tsx`:
```typescript
interface AgGridWrapperProps {
  // ... other props
  quickFilterText?: string;        // line 54
  // passed to AgGridReact as `quickFilterText={quickFilterText}` line 230
  // `cacheQuickFilter={true}` is already set line 231
}
```
AG Grid quickFilterText: comma/space-separated tokens match ANY cell's rendered text (case-insensitive) after `cacheQuickFilter` snapshot. No extra wiring needed — just pass the string.

From `app/components/ag-grid/ag-grid-list-view.tsx` (current, lines 72-79):
```typescript
export default function AgGridListView({
  config,
  tableData,
  fkOptions,
  comboboxOptions,
  subModuleDisplayName,   // <-- already plumbed from sub-module.tsx loader
}: ListViewProps) { ... }
```
- `subModuleSlug` resolved at line 87: `const subModuleSlug = params.subModule ?? config?.tableName ?? 'unknown';`
- `subModuleDisplayName` available as prop (passed in `sub-module.tsx` line 442: `subModuleDisplayName: subModuleAccess.display_name`).
- Current `<AgGridWrapper>` call (lines 219-231) does NOT pass `quickFilterText`.

From `app/routes/workspace/layout.tsx` (provider location):
```typescript
// Current tree:
<SidebarProvider defaultOpen={layoutState.open}>
  <div className="flex h-svh w-full flex-col">
    <WorkspaceNavbar .../>
    ...<Outlet />...
  </div>
</SidebarProvider>
```
The new provider MUST wrap both `<WorkspaceNavbar>` (source of setQuery) and `<Outlet/>` (source of register/unregister + reader). Mount between `<SidebarProvider>` and its child div.

From CLAUDE.md constraints:
- No `useEffect` unless justified — registering/unregistering active table IS justified (mount/unmount side effect with cleanup).
- `useCallback` for handlers passed as props.
- Functional components; `interface` for props, `type` for derived/unions.
- `data-test` on key elements for E2E selectors.

From `app/components/ai/ai-chat-provider.tsx` (reference pattern — lines 1, 13):
```typescript
import { createContext, use, useMemo, useState } from 'react';
const AiChatContext = createContext<AiChatContextValue | null>(null);
// Consumers: const ctx = use(AiChatContext); if (!ctx) throw ...
```
Use the same `createContext` + `use` (React 19) pattern; NOT `useContext`.

UI-RULES.md §Search (line 56-59):
> - Global search only. No per-table search bars.
> - Keyboard shortcut: `/` opens the search palette (standard Linear/GitHub pattern), in addition to `Cmd/Ctrl+K`.

Note: `/` is NOT yet implemented in `navbar-search.tsx` (only Cmd/Ctrl+K). Out of scope here — do NOT add it.
</interfaces>

<flow>
<!-- How the unified search works at runtime: -->

1. User on `/home/:account/human_resources/register` (Register list). `AgGridListView` mounts, calls `useRegisterActiveTable('register', 'Register')` — context's `activeTable` becomes `{ slug: 'register', displayName: 'Register' }`.
2. User presses Cmd/Ctrl+K. `CommandDialog` opens. CommandInput is empty.
3. User types `alice`. cmdk filters the existing `items` (Modules/Pages) by substring match on label+keywords — this is unchanged.
4. Because `activeTable` is non-null AND the current input value has length > 0, `NavbarSearch` renders a NEW `CommandGroup heading="Active Page"` with a single `CommandItem` value="filter-active-table alice" labeled `Filter Register rows matching "alice"`.
5. User selects that item. `handleFilterActiveTable(query)` calls `setQuery('alice')` on the context and `setOpen(false)`.
6. `AgGridListView` re-renders; `const { query } = useActiveTableSearch()` now returns `'alice'`; `<AgGridWrapper quickFilterText="alice">` — AG Grid filters rows client-side via cacheQuickFilter.
7. User navigates away. `AgGridListView` unmount effect calls `unregisterActiveTable()` which also clears `query` back to `''`. Next page: palette shows nav items only (no "Active Page" group).
8. User re-opens palette on a detail page: no `activeTable` registered → no "Active Page" group, exactly as today.

Edge cases:
- `TableListView` (legacy TanStack table, used by some non-AG-Grid configs): does NOT call `useRegisterActiveTable`, so no "Active Page" group appears there — acceptable for this atomic task. Those sub-modules keep today's behavior.
- Palette typing `   ` (whitespace only): trim before deciding to show the "Active Page" group.
- User opens palette a second time: `CommandInput` should start empty. Do NOT prefill from the active-table `query` state — the typed value is the palette's own ephemeral buffer; persisted filter lives in the table.
- AG Grid server-paged flows: only filters rows already loaded on the current page. That is the known AG Grid quick-filter semantics — acceptable (search rationale lives in user's words: "search rows within the active page's table").
</flow>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create ActiveTableSearchContext + wire AgGridListView to consume it</name>
  <files>
    app/components/active-table-search-context.tsx (new),
    app/components/ag-grid/ag-grid-list-view.tsx (modify),
    app/routes/workspace/layout.tsx (modify)
  </files>
  <behavior>
    - The `ActiveTableSearchProvider` exposes a stable value with: `query: string`, `setQuery: (q: string) => void`, `clearQuery: () => void`, `activeTable: { slug: string; displayName: string } | null`, `registerActiveTable: (slug: string, displayName: string) => void`, `unregisterActiveTable: (slug: string) => void`.
    - `registerActiveTable` replaces any existing registrant (we only track one active list view at a time — the mounted one). `unregisterActiveTable(slug)` is a no-op if `slug` does not match the current registrant (prevents late cleanup from clobbering a fast route change).
    - When `unregisterActiveTable` DOES match, it also sets `query` back to `''` (filter does not leak across pages).
    - `useActiveTableSearch()` throws a clear error if called outside the provider (matches `ai-chat-provider` pattern using React 19 `use()`).
    - `useRegisterActiveTable(slug, displayName)` is a convenience hook wrapping `useEffect` with the mount/unmount cleanup; referentially stable across re-renders by depending on `[slug, displayName]` only.
    - `AgGridListView` calls `useRegisterActiveTable(subModuleSlug, subModuleDisplayName ?? subModuleSlug)` once and passes `quickFilterText={query}` to `AgGridWrapper`. No other behavior changes.
    - `layout.tsx` wraps the post-SidebarProvider tree with `<ActiveTableSearchProvider>` so BOTH the navbar (which will write) and the Outlet subtree (which will read + register) share the same context instance.
  </behavior>
  <action>
    Create `app/components/active-table-search-context.tsx`:

    ```tsx
    import {
      createContext,
      use,
      useCallback,
      useEffect,
      useMemo,
      useRef,
      useState,
      type ReactNode,
    } from 'react';

    interface ActiveTable {
      slug: string;
      displayName: string;
    }

    interface ActiveTableSearchContextValue {
      query: string;
      setQuery: (q: string) => void;
      clearQuery: () => void;
      activeTable: ActiveTable | null;
      registerActiveTable: (slug: string, displayName: string) => void;
      unregisterActiveTable: (slug: string) => void;
    }

    const ActiveTableSearchContext =
      createContext<ActiveTableSearchContextValue | null>(null);

    export function ActiveTableSearchProvider({ children }: { children: ReactNode }) {
      const [state, setState] = useState<{
        query: string;
        activeTable: ActiveTable | null;
      }>({ query: '', activeTable: null });

      const setQuery = useCallback((q: string) => {
        setState((prev) => (prev.query === q ? prev : { ...prev, query: q }));
      }, []);

      const clearQuery = useCallback(() => {
        setState((prev) => (prev.query === '' ? prev : { ...prev, query: '' }));
      }, []);

      const registerActiveTable = useCallback(
        (slug: string, displayName: string) => {
          setState((prev) => {
            if (
              prev.activeTable?.slug === slug &&
              prev.activeTable.displayName === displayName
            ) {
              return prev;
            }
            // Route change to a different active table — clear any stale query too.
            return {
              query: prev.activeTable?.slug === slug ? prev.query : '',
              activeTable: { slug, displayName },
            };
          });
        },
        [],
      );

      const unregisterActiveTable = useCallback((slug: string) => {
        setState((prev) => {
          if (prev.activeTable?.slug !== slug) return prev;
          return { query: '', activeTable: null };
        });
      }, []);

      const value = useMemo<ActiveTableSearchContextValue>(
        () => ({
          query: state.query,
          setQuery,
          clearQuery,
          activeTable: state.activeTable,
          registerActiveTable,
          unregisterActiveTable,
        }),
        [state.query, state.activeTable, setQuery, clearQuery, registerActiveTable, unregisterActiveTable],
      );

      return (
        <ActiveTableSearchContext.Provider value={value}>
          {children}
        </ActiveTableSearchContext.Provider>
      );
    }

    export function useActiveTableSearch(): ActiveTableSearchContextValue {
      const ctx = use(ActiveTableSearchContext);
      if (!ctx) {
        throw new Error(
          'useActiveTableSearch must be used inside <ActiveTableSearchProvider>',
        );
      }
      return ctx;
    }

    /**
     * Registers the calling list view as the currently-active searchable table.
     * Clears its own registration on unmount (or when slug/displayName changes).
     *
     * useEffect is justified here: mount/unmount side effect with cleanup — no
     * alternative (route-driven registration has no event to observe).
     */
    export function useRegisterActiveTable(slug: string, displayName: string) {
      const { registerActiveTable, unregisterActiveTable } = useActiveTableSearch();
      // Capture the slug used at register time so cleanup targets the right entry
      // even if `slug` changes between renders.
      const registeredSlugRef = useRef(slug);

      useEffect(() => {
        registerActiveTable(slug, displayName);
        registeredSlugRef.current = slug;
        return () => {
          unregisterActiveTable(registeredSlugRef.current);
        };
      }, [slug, displayName, registerActiveTable, unregisterActiveTable]);
    }
    ```

    Modify `app/routes/workspace/layout.tsx`:
    - Add import: `import { ActiveTableSearchProvider } from '~/components/active-table-search-context';`
    - Wrap the existing tree. Change:
      ```tsx
      <SidebarProvider defaultOpen={layoutState.open}>
        <div className="flex h-svh w-full flex-col">
          ...
        </div>
      </SidebarProvider>
      ```
      to:
      ```tsx
      <SidebarProvider defaultOpen={layoutState.open}>
        <ActiveTableSearchProvider>
          <div className="flex h-svh w-full flex-col">
            ...
          </div>
        </ActiveTableSearchProvider>
      </SidebarProvider>
      ```

    Modify `app/components/ag-grid/ag-grid-list-view.tsx`:
    - Add import: `import { useActiveTableSearch, useRegisterActiveTable } from '~/components/active-table-search-context';`
    - After the existing `subModuleSlug`/`pkColumn` resolution (around line 87-88), add:
      ```tsx
      const { query } = useActiveTableSearch();
      useRegisterActiveTable(subModuleSlug, subModuleDisplayName ?? subModuleSlug);
      ```
    - In the existing `<AgGridWrapper ...>` JSX (around line 219), add one prop: `quickFilterText={query}`. Do NOT change any other prop or callback.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
    <automated>pnpm lint -- app/components/active-table-search-context.tsx app/components/ag-grid/ag-grid-list-view.tsx app/routes/workspace/layout.tsx</automated>
  </verify>
  <done>
    - `app/components/active-table-search-context.tsx` exists with all three exports; typecheck clean.
    - `layout.tsx` mounts `ActiveTableSearchProvider` between `SidebarProvider` and the inner wrapper div.
    - `ag-grid-list-view.tsx` calls `useRegisterActiveTable` once, reads `query`, forwards it to `AgGridWrapper.quickFilterText`.
    - `pnpm typecheck` passes for the app.
    - No new ESLint errors in the three touched files.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Extend NavbarSearch with "Filter &lt;active page&gt;" command row + hook to context</name>
  <files>
    app/components/navbar-search.tsx (modify)
  </files>
  <behavior>
    - `CommandInput` becomes controlled: add local state `const [input, setInput] = useState('')` and pass `value={input} onValueChange={setInput}`. Reset `input` to `''` whenever the dialog opens (not on close — cmdk already clears on unmount, but controlled mode requires explicit reset).
    - When `activeTable` from context is non-null AND `input.trim().length > 0`, render an ADDITIONAL `<CommandGroup heading="Active Page">` ABOVE the existing module/page groups containing ONE `<CommandItem>` with:
      - `value={\`filter-active-table ${input}\`}` so cmdk doesn't fuzzy-match it away (value contains the input, always matches itself)
      - `keywords={[input, activeTable.displayName, 'filter', 'rows']}` so typing the sub-module name also surfaces it
      - Label: `Filter ${activeTable.displayName} rows matching "${input}"`
      - `onSelect` → `setQuery(input.trim()); setOpen(false);`
      - `data-test="navbar-search-filter-active-table"`
    - Keep all existing module/page CommandGroups and their handlers untouched.
    - When `activeTable` is null OR input is whitespace-only, the extra group is not rendered — palette degrades exactly to today's behavior (home page, auth pages, detail/create routes, non-AG-Grid sub-modules).
    - Opening the palette does NOT clear the existing active-table filter (the typed input is ephemeral; persisted filter lives in context and is only overwritten when the user explicitly selects the "Filter ..." row).
    - Keep the existing Cmd/Ctrl+K keyboard handler unchanged. Do NOT add `/` shortcut in this task (out of scope).
  </behavior>
  <action>
    Modify `app/components/navbar-search.tsx`:

    1. Update imports:
       ```tsx
       import { type ReactNode, useEffect, useState } from 'react';
       import { useNavigate } from 'react-router';
       import { Filter, Search } from 'lucide-react';
       import {
         CommandDialog,
         CommandEmpty,
         CommandGroup,
         CommandInput,
         CommandItem,
         CommandList,
       } from '@aloha/ui/command';
       import { Kbd } from '@aloha/ui/kbd';
       import { useActiveTableSearch } from '~/components/active-table-search-context';
       ```

    2. Inside the component body, AFTER the existing `useNavigate()` call, read context:
       ```tsx
       const { activeTable, setQuery } = useActiveTableSearch();
       const [input, setInput] = useState('');
       ```

    3. Reset input whenever dialog opens (justified useEffect — observing `open` state transition; no event fires for controlled reset):
       ```tsx
       useEffect(() => {
         if (open) setInput('');
       }, [open]);
       ```

    4. Add a memoized handler for selecting the filter row:
       ```tsx
       const handleFilterActiveTable = () => {
         const trimmed = input.trim();
         if (!trimmed || !activeTable) return;
         setQuery(trimmed);
         setOpen(false);
       };
       ```

    5. Make `CommandInput` controlled:
       Change `<CommandInput placeholder="Type a command or search..." />` to
       `<CommandInput placeholder="Type a command or search..." value={input} onValueChange={setInput} />`.

    6. Inside `<CommandList>`, BEFORE the existing `{Array.from(grouped.entries()).map(...)}` block, add the conditional filter group:
       ```tsx
       {activeTable && input.trim().length > 0 && (
         <CommandGroup heading="Active Page">
           <CommandItem
             value={`filter-active-table ${input}`}
             keywords={[input, activeTable.displayName, 'filter', 'rows']}
             onSelect={handleFilterActiveTable}
             data-test="navbar-search-filter-active-table"
           >
             <Filter className="mr-2 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
             <span>
               Filter {activeTable.displayName} rows matching "{input.trim()}"
             </span>
           </CommandItem>
         </CommandGroup>
       )}
       ```

    7. Do NOT change the existing `renderTrigger` fallback button, `Cmd+K` effect, or the module/pages groups rendering.

    No changes needed to `app/components/workspace-shell/workspace-navbar.tsx` — it mounts `<NavbarSearch items={searchItems} .../>` as today; the new context is read internally.

    **Note on frontmatter mismatch:** `files_modified` lists `workspace-navbar.tsx` only as a defensive safety net — a later reviewer may want a `data-test` tweak. If the mod is not actually needed at execution time, leave the file untouched and update the SUMMARY to reflect actual files changed.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
    <automated>pnpm lint -- app/components/navbar-search.tsx</automated>
    <automated>pnpm format:fix -- app/components/navbar-search.tsx app/components/active-table-search-context.tsx app/components/ag-grid/ag-grid-list-view.tsx app/routes/workspace/layout.tsx</automated>
  </verify>
  <done>
    - `NavbarSearch` renders an "Active Page" CommandGroup with a single CommandItem when (a) context has an `activeTable` and (b) the controlled input has non-whitespace characters.
    - Selecting that item writes the query to the context and closes the dialog; existing module/page items still navigate as today.
    - `CommandInput` is controlled; reopening the dialog resets the typed text.
    - `pnpm typecheck` passes. `pnpm lint` has no new errors for this file. `pnpm format:fix` applied.
    - Existing behavior on routes WITHOUT an active table (home, auth, detail, create) is identical to before this plan.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human smoke-test the unified navbar search</name>
  <what-built>
    Context-backed "Filter active page" row in the navbar command palette that applies AG Grid quickFilterText to the visible table, preserving all existing navigation search behavior.
  </what-built>
  <how-to-verify>
    1. `pnpm dev` and sign in.
    2. Navigate to any AG Grid list page (e.g. `/home/<account>/human_resources/register`). Confirm the table renders.
    3. Press `Cmd+K` (or `Ctrl+K`). Type a substring that matches at least one visible row's cell text (e.g. part of an employee's last name).
    4. EXPECT: The palette shows the existing "Modules"/"Pages" groups AND a new top group "Active Page" with one item: `Filter Register rows matching "<query>"`. Existing nav items still fuzzy-filter by your query.
    5. Select that "Filter ..." item (Enter or click). The palette closes. The Register table is now filtered to rows whose cells contain `<query>` (case-insensitive). Row count drops.
    6. Re-open the palette (`Cmd+K`). Input should be empty. Table filter is still applied. Close again with Escape — no change.
    7. Re-open palette, type a new query, select "Filter ..." again. Table re-filters to the new query.
    8. Navigate to a different sub-module's list page (e.g. `/home/<account>/hr/departments` if AG Grid, else any AG Grid list). EXPECT: table is unfiltered (previous filter cleared on unmount).
    9. Navigate to the home page (`/home/<account>`). Open the palette. EXPECT: no "Active Page" group appears no matter what you type.
    10. Navigate to a detail route (click a row on Register). Open palette. EXPECT: no "Active Page" group (detail route does not register).
    11. Confirm no per-table search input was added anywhere (UI-RULES.md §Search upheld).
    12. Toggle dark mode — palette + filter command row readable in both themes.
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues.</resume-signal>
</task>

</tasks>

<verification>
- TypeScript clean across the app (`pnpm typecheck`).
- No new ESLint errors in the 4 touched files (`pnpm lint`).
- Prettier applied (`pnpm format:fix`).
- Manual smoke (Task 3) passes all 12 checks.
- Existing `NavbarSearch` E2E selectors (`data-test="workspace-navbar-search-trigger"`, `data-test="navbar-search-item-${item.path}"`) still resolve — existing behavior is additive-only.
- UI-RULES.md §Search rule upheld: no new per-table input.
- DESIGN.md tokens untouched: no new colors, spacing, or primitives introduced (Lucide `Filter` icon reused, existing text sizing).
</verification>

<success_criteria>
- On an AG Grid list page, typing in the navbar palette + selecting "Filter &lt;page&gt; rows matching..." filters the table via AG Grid `quickFilterText` and closes the dialog.
- On non-list routes, the palette behaves identically to today.
- Navigating away clears the active-table filter.
- No regressions in existing module/sub-module navigation search.
- `pnpm typecheck` + `pnpm lint` pass on the branch.
</success_criteria>

<output>
After completion, create `.planning/quick/260417-lbu-navbar-search-bar-should-search-active-p/260417-lbu-SUMMARY.md` listing: files actually changed, a snippet showing the new context hook call site inside `AgGridListView`, the new CommandItem render block in `NavbarSearch`, and notes on any follow-up (e.g. `TableListView` legacy path deliberately not wired; `/` shortcut not added; server-paged tables filter only the loaded page).
</output>
