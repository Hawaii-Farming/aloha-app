# Technology Stack: AG Grid Integration

**Project:** HR Module Submodules (AG Grid)
**Researched:** 2026-04-07

## Recommended Stack

### Core AG Grid Packages

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `ag-grid-react` | ^35.2.1 | React wrapper + AgGridReact component | Single install pulls in ag-grid-community automatically. v35+ supports React 19, TypeScript 5.4.5+. MIT licensed Community edition. |
| `ag-grid-community` | (transitive) | Core grid engine, theming API, modules | Installed as dependency of ag-grid-react. Do NOT install separately. |

**Confidence:** HIGH -- verified via npm registry (35.2.1 published 2026-04-07) and AG Grid compatibility docs confirming React 19 support since v32.3.

### Existing Stack (No Changes Needed)

| Technology | Current Version | Relevance |
|------------|----------------|-----------|
| React | 19.x (catalog) | AG Grid 35.x fully supports React 19 |
| TypeScript | ^5.9.3 | Exceeds AG Grid's 5.4.5 minimum |
| Tailwind CSS | 4.1.18 | AG Grid theming is independent; CSS vars bridge the two |
| Shadcn UI / Radix | existing | Side-panel forms, buttons, dialogs remain Shadcn |
| @tanstack/react-table | ^8.21.3 | Keep for non-HR modules; AG Grid only replaces HR tables |
| next-themes | 0.4.6 | Dark/light mode -- AG Grid must sync with this |
| react-hook-form + zod | existing | CRUD forms remain react-hook-form; AG Grid handles display only |
| Supabase | existing | Data source via loaders; AG Grid receives data as props |

## AG Grid Configuration Approach

### Module Registration (v35+ Pattern)

AG Grid v35.1 introduced `AgGridProvider` for module scoping. Use it at the HR layout level:

```typescript
import { AllCommunityModule } from 'ag-grid-community';
import { AgGridProvider } from 'ag-grid-react';

// Wrap HR module layout, not entire app
<AgGridProvider modules={[AllCommunityModule]}>
  {children}
</AgGridProvider>
```

**Why `AgGridProvider` over `ModuleRegistry.registerModules()`:** Scoped to the component tree that needs it. Avoids global side effects. Cleaner for a monorepo where other modules use TanStack Table.

**Confidence:** HIGH -- official AG Grid docs describe this as the recommended v35+ approach.

### SSR Handling (Critical)

AG Grid depends on browser APIs (`window`, `document`) and cannot render server-side. React Router 7 runs loaders on the server and renders components during SSR.

**Solution:** Use the existing `<ClientOnly>` component from `@aloha/ui/client-only` already in the codebase. Wrap the `AgGridReact` component (not the entire route) so the loader still runs server-side:

```typescript
import { ClientOnly } from '@aloha/ui/client-only';

function HRGridView({ data, columns }) {
  return (
    <ClientOnly fallback={<GridSkeleton />}>
      <AgGridWrapper data={data} columns={columns} />
    </ClientOnly>
  );
}
```

**Why this pattern:**
- Loader data still fetches server-side (SSR benefit preserved)
- Grid only instantiates in browser where `window` exists
- Skeleton fallback prevents layout shift
- Already proven in the codebase (`root-providers.tsx` uses `<ClientOnly>`)

**Alternative considered:** `React.lazy()` with dynamic import. The codebase uses this in `sub-module.tsx` for custom views. Either works; `ClientOnly` is simpler for a component that always renders (not conditionally loaded).

**Confidence:** HIGH -- AG Grid's Next.js docs confirm browser-only requirement; the app's existing `ClientOnly` pattern is proven.

### Theming Strategy

AG Grid v35 uses a programmatic Theming API, not CSS class-based themes. The approach:

#### 1. Base Theme: Quartz with Dark Mode Support

```typescript
import { themeQuartz, colorSchemeDark, colorSchemeVariable } from 'ag-grid-community';

// Use colorSchemeVariable to support dynamic dark/light switching
const alohaGridTheme = themeQuartz.withPart(colorSchemeVariable);
```

`colorSchemeVariable` (the default) reads `data-ag-theme-mode` from ancestor elements to switch between light and dark. Since the app uses `next-themes` with `attribute="class"` (adds `.dark` to `<html>`), a small bridge is needed.

#### 2. Syncing next-themes with AG Grid

Set `data-ag-theme-mode` on a wrapper element based on the current theme:

```typescript
import { useTheme } from 'next-themes';

function AgGridThemeWrapper({ children }) {
  const { resolvedTheme } = useTheme();
  return (
    <div data-ag-theme-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}>
      {children}
    </div>
  );
}
```

**Why not set it on `<html>`:** Avoid polluting the root element; keep AG Grid concerns scoped to where AG Grid lives.

#### 3. Custom Theme Parameters (DESIGN.md Alignment)

Override Quartz defaults to match the Supabase-inspired design system:

```typescript
const alohaGridTheme = themeQuartz
  .withPart(colorSchemeVariable)
  .withParams({
    // Typography -- match DESIGN.md Geist font
    fontFamily: ['Geist', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
    fontSize: 14,
    headerFontWeight: 500,

    // Spacing -- DESIGN.md 8px base unit
    spacing: 8,
    headerHeight: 40,
    rowHeight: 40,

    // Colors -- use CSS vars so dark/light auto-switch
    accentColor: 'var(--supabase-green)',

    // Borders -- DESIGN.md border-defined depth, no shadows
    borderColor: 'var(--border)',
    borderRadius: 6,
    wrapperBorderRadius: 8,

    // Selection
    rowHoverColor: 'var(--accent)',
    selectedRowBackgroundColor: 'var(--accent)',
  });
```

**Why CSS custom properties in theme params:** The app already defines `--border`, `--accent`, `--supabase-green` etc. in both `:root` and `.dark` blocks. Referencing them means AG Grid automatically inherits the correct colors when the theme switches. No duplicate color definitions.

#### 4. Additional CSS Overrides

For styling not covered by theme params (e.g., removing shadows per DESIGN.md "no box-shadows" rule):

```css
/* ag-grid-overrides.css */
.ag-root-wrapper {
  --ag-wrapper-border: 1px solid var(--border);
  box-shadow: none;
}

.ag-header {
  border-bottom: 1px solid var(--border);
}

.ag-row {
  border-bottom: 1px solid var(--border);
}
```

**Confidence:** MEDIUM -- the Theming API approach is well-documented, but the exact CSS var bridging (`var(--border)` inside `withParams`) needs validation. AG Grid docs show `var()` in params is supported, but edge cases with oklch values should be tested.

### Full-Width Detail Rows

Full-width rows are a **Community feature** (confirmed in AG Grid docs). This is the pattern for row-click-to-expand detail views.

```typescript
// Grid configuration
<AgGridReact
  theme={alohaGridTheme}
  rowData={data}
  columnDefs={columns}
  isFullWidthRow={(params) => params.rowNode.data?.isDetailRow === true}
  fullWidthCellRenderer={DetailRowRenderer}
/>
```

**Implementation approach:**
1. When a row is clicked, insert a "detail row" object into `rowData` immediately after the clicked row
2. Mark it with `isDetailRow: true`
3. `isFullWidthRow` callback detects it
4. `fullWidthCellRenderer` renders a custom React component spanning full width
5. The detail component receives the parent row's data and renders Shadcn UI cards/forms

**Why not Master/Detail:** Master/Detail is Enterprise-only. Full-width rows achieve the same UX (click row, expand detail below) using Community features. The detail renderer is a regular React component, so it can use Shadcn UI, forms, etc.

**Confidence:** HIGH -- full-width rows confirmed as Community feature in official docs.

## What NOT to Use

| Package/Approach | Why Not |
|-----------------|---------|
| `@ag-grid-community/react` (modular) | The modular package system (`@ag-grid-community/*`) is the old approach. v33+ consolidated into `ag-grid-community` + `ag-grid-react`. Using the modular packages adds complexity for no benefit. |
| `ag-grid-enterprise` | Project constraint: Community only. No Master/Detail, Row Grouping, Server-Side Row Model needed. |
| AG Grid CSS class themes (`ag-theme-quartz`) | v33+ deprecated CSS class themes in favor of the Theming API (`themeQuartz` object). Don't add `className="ag-theme-quartz"` -- use the `theme` prop. |
| `ag-grid-community/styles` CSS imports | Not needed with v33+ Theming API. The theme object auto-injects CSS. No manual CSS imports required. |
| AG Grid Server-Side Row Model | Enterprise feature. Data loads via React Router loaders (server-side fetch) and passes to grid as `rowData` (Client-Side Row Model). |
| Replacing TanStack Table globally | AG Grid is only for HR module submodules. Other modules keep TanStack Table. Don't create a dependency on AG Grid outside HR. |
| `ModuleRegistry.registerModules()` | Global side effect. Use `AgGridProvider` for scoped module registration. |

## Installation

```bash
# Single package -- pulls in ag-grid-community as dependency
pnpm add ag-grid-react
```

That's it. No additional AG Grid packages needed for Community features.

## Integration Architecture Summary

```
React Router 7 Route (SSR)
  |
  +-- loader() runs on server
  |     -> Supabase query -> returns data
  |
  +-- Component renders (SSR + client hydration)
        |
        +-- <ClientOnly fallback={<Skeleton />}>
              |
              +-- <AgGridThemeWrapper>  (syncs next-themes -> data-ag-theme-mode)
                    |
                    +-- <AgGridProvider modules={[AllCommunityModule]}>
                          |
                          +-- <AgGridReact
                                theme={alohaGridTheme}
                                rowData={loaderData.rows}
                                columnDefs={columnDefs}
                                isFullWidthRow={...}
                                fullWidthCellRenderer={DetailRow}
                              />
```

## Sources

- [AG Grid React Quick Start](https://www.ag-grid.com/react-data-grid/getting-started/) -- package setup, AgGridProvider pattern
- [AG Grid Version Compatibility](https://www.ag-grid.com/react-data-grid/compatibility/) -- React 19 support confirmed v32.3+
- [AG Grid Theming](https://www.ag-grid.com/react-data-grid/theming/) -- Theming API overview, themeStyleContainer
- [AG Grid Theme Parts](https://www.ag-grid.com/react-data-grid/theming-parts/) -- themeQuartz, colorSchemeVariable, withPart()
- [AG Grid Theme Parameters](https://www.ag-grid.com/react-data-grid/theming-parameters/) -- withParams() API, CSS var support
- [AG Grid Theme Colors](https://www.ag-grid.com/react-data-grid/theming-colors/) -- backgroundColor, foregroundColor, accentColor, data-ag-theme-mode
- [AG Grid Full-Width Rows](https://www.ag-grid.com/react-data-grid/full-width-rows/) -- Community feature, isFullWidthRow, fullWidthCellRenderer
- [AG Grid Built-in Themes](https://www.ag-grid.com/javascript-data-grid/themes/) -- Quartz, Balham, Material, Alpine
- [AG Grid CSS Customization](https://www.ag-grid.com/react-data-grid/theming-css/) -- --ag- custom properties, CSS class targeting
- [AG Grid npm](https://www.npmjs.com/package/ag-grid-react) -- v35.2.1 latest (2026-04-07)
- [AG Grid What's New](https://www.ag-grid.com/whats-new/) -- v35.0.0 (Dec 2025), v34.3.0 React 19.2 support
- [AG Grid + Next.js SSR](https://blog.ag-grid.com/using-ag-grid-with-next-js-to-build-a-react-table/) -- client-only requirement confirmed
- [AG Grid GitHub Releases](https://github.com/ag-grid/ag-grid/releases) -- version history
