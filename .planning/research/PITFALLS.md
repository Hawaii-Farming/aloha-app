# Domain Pitfalls

**Domain:** AG Grid Community + React Router 7 SSR + Tailwind CSS 4 Theming + CRUD Forms
**Researched:** 2026-04-07

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: AG Grid SSR Hydration Crash ("window is not defined")

**What goes wrong:** AG Grid depends on browser APIs (`window`, `document`, `ResizeObserver`). When React Router 7 server-renders a route containing `<AgGridReact>`, the server attempts to evaluate AG Grid code, crashing with `ReferenceError: window is not defined` or producing a hydration mismatch when the server HTML differs from the client render.

**Why it happens:** React Router 7 in framework/SSR mode renders every route component on the server first. AG Grid is a purely client-side library -- it measures DOM elements, attaches resize observers, and manipulates the DOM directly. None of this works in a Node.js server environment.

**Consequences:** The route crashes on the server (500 error) or, if partially caught, produces hydration mismatch warnings and a broken/empty grid that re-renders on the client.

**Prevention:**
- Wrap all `<AgGridReact>` usage inside the existing `<ClientOnly>` component from `@aloha/ui/client-only`. This is already in the codebase (`packages/ui/src/kit/client-only.tsx`) and uses `useSyncExternalStore` to gate rendering.
- Provide a meaningful `fallback` prop (skeleton/loading state matching grid dimensions) to prevent layout shift during hydration.
- Never import AG Grid modules at the top level of a `.server.ts` file or a loader function.
- Keep AG Grid in a dedicated wrapper component (e.g., `DataGrid.tsx`) so the client-only boundary is centralized.

**Detection:** Any server-side error mentioning `window`, `document`, `ResizeObserver`, or `HTMLElement` in a route that contains AG Grid. Also: hydration mismatch console warnings on pages with grids.

**Phase:** Must be solved in Phase 1 (AG Grid foundation) before any submodule work begins.

**Confidence:** HIGH -- well-documented pattern across all SSR frameworks. AG Grid's own Remix blog post confirms this approach.

---

### Pitfall 2: Theme Mode Mismatch Between next-themes and AG Grid

**What goes wrong:** The app uses `next-themes` with `attribute="class"` (toggling `.dark` class on `<html>`). AG Grid's new Theming API (v33+) uses a separate `data-ag-theme-mode` attribute to switch between light/dark color schemes. These two systems do not automatically synchronize. The grid renders in light mode while the rest of the app is dark, or vice versa.

**Why it happens:** AG Grid v33+ theming is controlled either by the `theme` prop on `<AgGridReact>` or by `data-ag-theme-mode` on a parent element. The `next-themes` `.dark` class toggle does not set `data-ag-theme-mode`. Without explicit bridging, the two theme systems are completely independent.

**Consequences:** Visual breakage -- the grid appears as a bright white rectangle in an otherwise dark UI (or dark grid on light UI). Users see a jarring, unprofessional inconsistency. Fixing it after the fact means refactoring the theme wiring for every grid instance.

**Prevention:**
- Use AG Grid's `data-ag-theme-mode` attribute approach. Set this attribute on the `<html>` element (or a shared parent) alongside the `.dark` class that `next-themes` manages.
- Create a `useAgGridThemeMode` hook that reads `next-themes`' `resolvedTheme` via `useTheme()` and syncs `data-ag-theme-mode` on the document element. Something like:
  ```typescript
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    document.documentElement.dataset.agThemeMode = resolvedTheme === 'dark' ? 'dark' : 'light';
  }, [resolvedTheme]);
  ```
- Define the AG Grid theme with explicit light and dark color schemes using `themeQuartz.withParams({...}, 'light').withParams({...}, 'dark')` that map to DESIGN.md tokens.
- Test theme toggle on every grid page during development.

**Detection:** Toggle dark/light mode and visually inspect any page with a grid. If the grid does not follow the toggle, the bridge is broken.

**Phase:** Must be solved in Phase 1 (AG Grid foundation) alongside the base theme setup.

**Confidence:** HIGH -- verified from AG Grid theming docs and the codebase's `root-providers.tsx` showing `attribute="class"` config.

---

### Pitfall 3: Using Legacy Theming API Instead of New Theming API (v33+)

**What goes wrong:** Developers follow outdated tutorials or Stack Overflow answers that use the legacy approach: importing CSS files (`ag-grid-community/styles/ag-theme-quartz.css`), applying CSS class names (`className="ag-theme-quartz-dark"`), and overriding `--ag-*` CSS custom properties. This conflicts with the new Theming API in AG Grid v33+/v35.

**Why it happens:** Most AG Grid tutorials online (pre-2025) use the legacy theming approach. The new Theming API was introduced in v32 and became the default in v33. The legacy approach still "works" with `theme: "legacy"` but is deprecated and creates maintenance debt.

**Consequences:** Mixed CSS specificity conflicts, double-loaded stylesheets, theme parameters that silently fail because variable names changed (e.g., `--ag-grid-size` became `spacing`, `--ag-active-color` became `accentColor`). Debugging invisible CSS conflicts wastes significant time.

**Prevention:**
- Use AG Grid v35 (latest) with the new Theming API exclusively.
- Define theme in JavaScript: `themeQuartz.withParams({ backgroundColor, foregroundColor, accentColor, ... })`.
- Pass theme via the `theme` prop on `<AgGridReact>`, not via CSS class names.
- Do NOT import `ag-grid-community/styles/*.css` -- the new API auto-injects only needed CSS.
- Create a single `ag-grid-theme.ts` config file that maps DESIGN.md tokens to AG Grid theme parameters.

**Detection:** Any import of `ag-grid-community/styles/` or use of `className="ag-theme-*"` in the codebase is a red flag.

**Phase:** Phase 1 -- establish the correct theming approach from day one.

**Confidence:** HIGH -- confirmed from AG Grid's official migration guide.

---

### Pitfall 4: Full-Width Detail Rows Losing Keyboard Navigation and Selection

**What goes wrong:** Full-width rows (the Community alternative to Enterprise Master/Detail) do not participate in AG Grid's built-in keyboard navigation, cell selection, or context menu. Users click a row to expand it, but then cannot tab through the detail content or navigate back to the grid with keyboard alone.

**Why it happens:** Full-width rows render a custom React component that spans the entire grid width, bypassing AG Grid's cell-based navigation model. AG Grid explicitly documents this: "A full width component does not participate in the navigation."

**Consequences:** Accessibility regression (keyboard users get trapped or lost), poor UX for power users who navigate with keyboard, potential WCAG compliance issues.

**Prevention:**
- Implement custom `suppressKeyboardEvent` on the grid to handle Enter (expand/collapse) and Escape (collapse and return focus to row).
- Inside full-width detail components, manage focus explicitly: auto-focus the first interactive element on expand, trap focus within the detail panel, return focus to the parent row on collapse.
- Add `tabIndex`, `role`, and `aria-expanded` attributes to the detail row container.
- Test keyboard navigation flow: arrow keys in grid -> Enter to expand -> Tab through detail -> Escape to collapse -> arrow keys resume.

**Detection:** Try navigating the grid using only keyboard. If focus disappears or gets stuck when expanding a row, this pitfall is active.

**Phase:** Phase 1 (foundation) for the base pattern; validate in Phase 2 when applying to real submodules.

**Confidence:** HIGH -- documented limitation in AG Grid official docs.

## Moderate Pitfalls

### Pitfall 5: AG Grid + React 19 Strict Mode Double-Render Performance

**What goes wrong:** React 19 Strict Mode double-invokes effects and renders in development. AG Grid creates expensive internal state (column models, row models, event listeners) on mount. Double-mounting in Strict Mode causes the grid to initialize, tear down, and reinitialize -- producing a visible flicker and doubled initialization time in dev.

**Why it happens:** React 19 enforces Strict Mode double-rendering to catch impure components. AG Grid's `AgGridReact` component performs significant side effects on mount (DOM measurement, grid creation). While AG Grid v32.2+ officially supports React 19, the double-mount behavior is inherent to Strict Mode.

**Prevention:**
- Accept the double-render in development -- it does not occur in production builds.
- Do NOT disable Strict Mode to "fix" this; it masks real bugs.
- Ensure AG Grid's `onGridReady` callback is idempotent (no side effects that break on double-call).
- If dev performance is unacceptable with many grids, use `React.memo` on the grid wrapper and stabilize all props with `useMemo`/`useState` per AG Grid's React best practices.

**Detection:** Visible grid flicker on initial page load in development mode only.

**Phase:** Phase 1 -- understand and document this behavior so developers don't chase a phantom bug.

**Confidence:** HIGH -- confirmed AG Grid GitHub issues #9143, #7948 and React 19 Strict Mode documentation.

---

### Pitfall 6: Unstable Column/Row Props Causing Infinite Re-renders

**What goes wrong:** Passing inline arrays or objects to `columnDefs`, `defaultColDef`, or `rowData` causes AG Grid to detect "new" props on every React render, triggering full grid resets (columns rebuild, scroll position lost, selection cleared).

**Why it happens:** React compares props by reference. `columnDefs={[...]}` creates a new array every render. AG Grid interprets new references as intentional updates and rebuilds its internal column model.

**Consequences:** Grid flickers on any parent re-render, scroll position resets, expanded detail rows collapse, cell editing is interrupted, severe performance degradation.

**Prevention:**
- Define `columnDefs` with `useState` (if mutable) or `useMemo` (if derived from props/loader data) -- never inline.
- Define `defaultColDef` with `useMemo` or as a module-level constant.
- Pass `rowData` from loader data via `useState` initialized from `loaderData`, or use `useMemo`.
- For callbacks like `getRowId`, `isFullWidthRow`, and `onRowClicked`, use `useCallback` with stable dependency arrays.
- AG Grid docs explicitly state: "For object properties like defaultColDef, use useState or useMemo."

**Detection:** Grid flickers or resets scroll/selection when unrelated state changes. React DevTools Profiler shows the grid component re-rendering on every parent render.

**Phase:** Phase 1 -- establish the wrapper component pattern with stable props from the start.

**Confidence:** HIGH -- documented in AG Grid's official React best practices page.

---

### Pitfall 7: DESIGN.md Token Mapping Drift

**What goes wrong:** AG Grid theme parameters (backgroundColor, foregroundColor, headerBackgroundColor, borderColor, accentColor, etc.) are set once during initial integration but drift from DESIGN.md's CSS custom properties as the design system evolves. The grid becomes visually inconsistent with the rest of the app -- slightly wrong border colors, wrong hover states, wrong selection colors.

**Why it happens:** AG Grid's theming system is separate from Tailwind/Shadcn's CSS variable system. There is no automatic inheritance. If someone updates `--border` in the app's CSS, AG Grid's `borderColor` parameter does not change unless explicitly updated.

**Prevention:**
- Create a single `ag-grid-theme.ts` file that reads from CSS custom properties at runtime using `getComputedStyle()`, or that hardcodes the same oklch/hex values from DESIGN.md with comments referencing the source token.
- Better approach: use AG Grid's CSS custom property inheritance. Since `withParams()` sets CSS custom properties, you can override them in your app CSS using `--ag-background-color: var(--background)` etc. This creates automatic inheritance from the design system.
- Add a visual regression test or screenshot comparison for the grid in both themes.

**Detection:** Side-by-side comparison of grid borders/backgrounds with adjacent Shadcn card/table components reveals subtle color mismatches.

**Phase:** Phase 1 (initial theme mapping) with ongoing vigilance in all phases.

**Confidence:** MEDIUM -- based on general pattern of parallel design systems drifting; specific to how AG Grid's CSS variables interact with Tailwind.

---

### Pitfall 8: Form State Sync Between Side Panel and Grid Row Data

**What goes wrong:** When editing a row via the side-panel form (react-hook-form + Zod), the grid's `rowData` is not updated to reflect the mutation until a full page reload. The user saves the form, the side panel closes, but the grid still shows stale data. Or worse: optimistic updates are applied to `rowData` state but the server action fails, leaving the grid out of sync with the database.

**Why it happens:** The side-panel form submits via `useFetcher()` (React Router action). The grid's `rowData` comes from the route `loader`. After a successful action, React Router revalidates the loader -- but AG Grid may not pick up the new `rowData` if the reference is stale or the grid was initialized with a separate state copy.

**Prevention:**
- Let React Router's revalidation handle data freshness. After an action completes, the loader re-runs and provides new data. Pass `loaderData.rows` directly to AG Grid's `rowData` (via `useMemo` that depends on `loaderData`).
- Do NOT maintain a separate `useState` copy of row data that diverges from loader data.
- For optimistic UI: use AG Grid's `api.applyTransaction()` for immediate visual feedback, but reconcile with loader data after revalidation.
- Test the flow: edit row -> save -> verify grid updates without page reload.

**Detection:** Edit a row, save, and check if the grid reflects the change. If it requires a manual refresh, this pitfall is active.

**Phase:** Phase 2 (first CRUD submodule implementation) -- this is where the pattern gets established.

**Confidence:** MEDIUM -- specific to the React Router loader/action revalidation pattern combined with AG Grid's state model.

## Minor Pitfalls

### Pitfall 9: AG Grid CSS Conflicting with Tailwind CSS Reset

**What goes wrong:** Tailwind CSS 4's preflight/reset styles override AG Grid's internal element styling. Buttons inside the grid lose padding, inputs lose borders, scrollbars look wrong, or icons are misaligned.

**Why it happens:** Tailwind's CSS reset normalizes all elements. AG Grid's internal components (filter popups, cell editors, header menus) rely on default browser styles or their own CSS that can be overridden by Tailwind's aggressive resets.

**Prevention:**
- AG Grid v33+ auto-injects its CSS which should have sufficient specificity, but verify after installation.
- If conflicts appear, scope Tailwind's preflight using `@layer` or exclude AG Grid containers from the reset.
- Test: open a column filter popup, check header sort icons, verify scrollbar appearance.

**Detection:** Visual glitches inside AG Grid UI elements (not your custom cell renderers, but AG Grid's built-in controls).

**Phase:** Phase 1 -- verify immediately after first AG Grid render.

**Confidence:** MEDIUM -- common with CSS-heavy libraries + Tailwind; AG Grid v33+ mitigates most issues but edge cases remain.

---

### Pitfall 10: Bundle Size Surprise from AG Grid Community

**What goes wrong:** AG Grid Community adds significant JavaScript to the bundle (~300-400KB minified). In an SSR app where the grid is client-only, this becomes part of the client bundle for every route that uses a grid, increasing time-to-interactive.

**Why it happens:** AG Grid is a full-featured grid library. Even Community includes sorting, filtering, column resizing, cell rendering, and row virtualization. Tree-shaking helps but the core is substantial.

**Prevention:**
- Use code-splitting: AG Grid routes should lazy-load the grid wrapper component. React Router 7's route-based code splitting handles this naturally if AG Grid is only imported in route components (not in shared layouts).
- Verify with `pnpm build` and analyze the output chunks -- AG Grid code should only appear in HR module route chunks, not the main bundle.
- Consider the `ModuleRegistry` approach to register only needed AG Grid features, reducing bundle size.

**Detection:** Check build output chunk sizes. If the main/shared chunk grows by 300KB+ after adding AG Grid, it is being imported too broadly.

**Phase:** Phase 1 -- verify bundle isolation after initial integration.

**Confidence:** MEDIUM -- AG Grid's size is well-known; mitigation depends on route-level code splitting working correctly with React Router 7.

---

### Pitfall 11: Full-Width Detail Row Height Calculation

**What goes wrong:** Full-width detail rows render custom React components whose height is unknown to AG Grid at render time. The grid either clips the content (too short) or leaves excessive whitespace (too tall). Dynamic content like forms or expandable sections within the detail row are even worse -- the height set at expand time becomes wrong as content changes.

**Why it happens:** AG Grid needs to know row heights for virtualized scrolling. Full-width rows use `getRowHeight` or a fixed `rowHeight`. If the detail content is dynamic, the initial height calculation is stale.

**Prevention:**
- Use `getRowHeight(params)` callback that returns an appropriate height based on whether the row is expanded.
- For dynamic content inside detail rows, call `api.resetRowHeights()` or `api.onRowHeightChanged()` after content changes (e.g., after a sub-section expands inside the detail panel).
- Alternatively, set a generous fixed height for detail rows and use internal scrolling within the detail component.
- Test with varying data lengths -- a detail row with 2 fields vs 10 fields should both render correctly.

**Detection:** Clipped content or excessive whitespace in expanded detail rows. Content overflow visible when scrolling.

**Phase:** Phase 2 -- when implementing the first submodule with detail rows.

**Confidence:** MEDIUM -- documented AG Grid behavior for virtualized row height management.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: AG Grid Foundation | SSR crash (Pitfall 1) | `ClientOnly` wrapper + skeleton fallback from day one |
| Phase 1: AG Grid Foundation | Theme mismatch (Pitfall 2) | Build `useAgGridThemeMode` hook syncing next-themes with data-ag-theme-mode |
| Phase 1: AG Grid Foundation | Legacy theming API (Pitfall 3) | Use JS Theming API only; ban CSS imports from ag-grid-community/styles |
| Phase 1: AG Grid Foundation | Unstable props (Pitfall 6) | Establish wrapper component with useMemo/useState for all grid props |
| Phase 1: AG Grid Foundation | Tailwind CSS conflict (Pitfall 9) | Test built-in AG Grid controls (filters, menus) immediately |
| Phase 1: AG Grid Foundation | Bundle size (Pitfall 10) | Verify route-level code splitting isolates AG Grid to HR chunks |
| Phase 2: First CRUD Submodule | Form-grid sync (Pitfall 8) | Use loaderData as source of truth; useMemo rowData from loaderData |
| Phase 2: First CRUD Submodule | Detail row height (Pitfall 11) | Test with varying content lengths; implement resetRowHeights |
| Phase 2: First CRUD Submodule | Keyboard nav in detail rows (Pitfall 4) | Custom suppressKeyboardEvent + focus management |
| All Phases | Token drift (Pitfall 7) | Single ag-grid-theme.ts file; map AG Grid params to CSS vars |
| All Phases | React 19 double-render (Pitfall 5) | Document expected dev behavior; don't disable Strict Mode |

## Sources

- [AG Grid React Theming: Colours & Dark Mode](https://www.ag-grid.com/react-data-grid/theming-colors/) -- HIGH confidence
- [AG Grid Theming Migration Guide](https://www.ag-grid.com/react-data-grid/theming-migration/) -- HIGH confidence
- [AG Grid Full Width Rows](https://www.ag-grid.com/react-data-grid/full-width-rows/) -- HIGH confidence
- [AG Grid React Best Practices (Hooks)](https://www.ag-grid.com/react-data-grid/react-hooks/) -- HIGH confidence
- [AG Grid + Remix Blog Post](https://blog.ag-grid.com/using-ag-grid-react-ui-with-remix-run/) -- MEDIUM confidence (older, Remix v1 era)
- [AG Grid + React Hook Form Blog](https://blog.ag-grid.com/using-react-hook-form-with-ag-grid/) -- MEDIUM confidence
- [AG Grid React 19 Compatibility Issue #9143](https://github.com/ag-grid/ag-grid/issues/9143) -- HIGH confidence
- [AG Grid React 19.2 Activity Issue #12268](https://github.com/ag-grid/ag-grid/issues/12268) -- HIGH confidence
- [AG Grid Version Compatibility](https://www.ag-grid.com/react-data-grid/compatibility/) -- HIGH confidence
- [AG Grid Theme First-Load Issue #8325](https://github.com/ag-grid/ag-grid/issues/8325) -- MEDIUM confidence
