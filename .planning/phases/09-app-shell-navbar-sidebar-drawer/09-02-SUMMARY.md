---
phase: 09-app-shell-navbar-sidebar-drawer
plan: 02
subsystem: app-shell
tags: [navbar, shell, avatar, search, renderTrigger]
wave: 2
requires:
  - 09-01 (sidebar restyle shipped; sidebar/workspace layout unchanged)
  - 08 (Avatar primitive at @aloha/ui/avatar)
provides:
  - app/components/workspace-shell/workspace-navbar.tsx (desktop 72px header)
  - app/components/workspace-shell/aloha-logo-square.tsx (gradient logo primitive, sm|md)
  - app/components/navbar-search.tsx (backward-compatible renderTrigger slot prop)
affects:
  - Plan 09-03 (mobile drawer can reuse AlohaLogoSquare size="sm")
  - Plan 09-04 (will mount WorkspaceNavbar into workspace layout)
tech-stack:
  added: []
  patterns:
    - render-prop slot (renderTrigger) to avoid forking NavbarSearch behavior
    - dedicated workspace-shell/ directory for v2 shell chrome components
key-files:
  created:
    - app/components/workspace-shell/workspace-navbar.tsx
    - app/components/workspace-shell/aloha-logo-square.tsx
  modified:
    - app/components/navbar-search.tsx
decisions:
  - NavbarSearch stays the single owner of Cmd+K listener + CommandDialog; consumers only supply a visual trigger via renderTrigger
  - cn import resolved to @aloha/ui/utils (existing app-wide convention) rather than the @aloha/ui/lib/utils path referenced in the plan
  - Tailwind class ordering deferred to Prettier's tailwindcss plugin; the semantic classes from the prototype recipe are preserved exactly, only token order differs
metrics:
  duration: ~6min
  tasks: 3
  files: 3
  completed: 2026-04-10
requirements: [NAVBAR-01, NAVBAR-02, NAVBAR-03]
---

# Phase 9 Plan 02: Workspace Navbar Shell Summary

Desktop 72px workspace header with gradient Aloha logo, centered command-palette search button, and Phase 8 Avatar — wired to the existing NavbarSearch via a new backward-compatible `renderTrigger` render-prop slot so the Cmd+K dialog keeps a single owner.

## What Shipped

- **`NavbarSearch` renderTrigger slot.** Added `interface NavbarSearchProps { renderTrigger?: (props: { open: () => void; isMac: boolean }) => ReactNode }`. When supplied, the default button is replaced by the consumer's node; when omitted, behavior is byte-identical (same classes, same `data-test="navbar-search-trigger"`, same Kbd). The `useEffect` Cmd+K listener and `<CommandDialog>` stay inside this component — mounted exactly once per mount point. Existing callers continue to work untouched.
- **`AlohaLogoSquare` primitive.** New `app/components/workspace-shell/aloha-logo-square.tsx`. Gradient square (`bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 rounded-xl`) with a bold white "A". `size="sm"` → `w-8 h-8`, `size="md"` → `w-9 h-9` (default). `aria-hidden` since it is decorative next to the wordmark. Ready for reuse by the mobile drawer header in Plan 09-03.
- **`WorkspaceNavbar` desktop header.** New `app/components/workspace-shell/workspace-navbar.tsx`. 72px (`h-[72px]`) `bg-card` header with `border-b border-border`, left cluster of `AlohaLogoSquare` + "Aloha" wordmark, centered search button (`max-w-md mx-auto flex-1`, `bg-muted rounded-2xl`, Search icon + "Search..." label + Cmd/K hint) wired through `NavbarSearch renderTrigger`, and a `Avatar size="md"` with fallback initial derived from `user.email[0]`. `data-test` attributes: `workspace-navbar`, `workspace-navbar-search-trigger`, `workspace-navbar-avatar`. Not yet mounted — Plan 09-04 integrates it into the workspace layout.

## How It Satisfies the Requirements

- **NAVBAR-01 (72px header + gradient logo + wordmark):** `<header class="h-[72px] … bg-card border-b border-border …">` with `<AlohaLogoSquare size="md" />` and `<span>Aloha</span>`.
- **NAVBAR-02 (search wired to existing behavior):** The centered button only calls `open()` from the render-prop; all search state lives in `NavbarSearch`. Cmd/Ctrl+K still toggles the existing dialog (listener unchanged).
- **NAVBAR-03 (Phase 8 Avatar):** `<Avatar size="md">` from `@aloha/ui/avatar` with `<AvatarFallback>{initial}</AvatarFallback>`.

## Commits

| Task | Name                                                    | Commit  |
| ---- | ------------------------------------------------------- | ------- |
| 1    | Add optional renderTrigger slot to NavbarSearch         | 5c60e7d |
| 2    | Create AlohaLogoSquare component                        | 958b865 |
| 3    | Create WorkspaceNavbar desktop 72px header              | cbb2c38 |

## Deviations from Plan

**1. [Rule 3 - Import path correction] `cn` imported from `@aloha/ui/utils`, not `@aloha/ui/lib/utils`**
- **Found during:** Task 2
- **Issue:** Plan snippet used `@aloha/ui/lib/utils`, but every existing file in the app (`app/root.tsx`, `app/components/sidebar/workspace-sidebar.tsx`, `app/components/app-logo.tsx`, etc.) imports `cn` from `@aloha/ui/utils`. The plan's "Notes" explicitly told me to mirror the existing convention if paths differed.
- **Fix:** Used `import { cn } from '@aloha/ui/utils'` in both new files.
- **Files:** `aloha-logo-square.tsx`, `workspace-navbar.tsx`
- **Commits:** 958b865, cbb2c38

**2. [Prettier tailwindcss plugin - class reorder] Tailwind class ordering differs from plan literals**
- **Found during:** Tasks 2 and 3 pre-commit lint-staged.
- **Issue:** Prettier's `prettier-plugin-tailwindcss` automatically re-sorts Tailwind class tokens in `className` strings. This reordered the exact literal recipes from the plan (e.g. the navbar header class becomes `"bg-card border-border flex h-[72px] shrink-0 items-center gap-4 border-b px-6"` instead of `"h-[72px] px-6 bg-card border-b border-border flex items-center gap-4 shrink-0"`). Every semantic class is preserved — only token order changed.
- **Impact:** Some of the plan's strict multi-token grep acceptance criteria (e.g. `rg "bg-card border-b border-border"`, `rg "flex items-center gap-4 shrink-0"`, `rg "flex-1 max-w-md mx-auto flex items-center gap-2 px-4 py-2.5 bg-muted rounded-2xl"`) no longer match as contiguous substrings. Individual token checks and the visual result are unchanged.
- **Fix:** None needed — this is codebase-wide tooling. Plan's grep assertions would need to be split per-token or updated to tolerate reordering in future plans.
- **Files:** `workspace-navbar.tsx`, `aloha-logo-square.tsx`

## Verification

- `pnpm typecheck` — 0 errors
- `pnpm lint` — 0 errors (4 pre-existing warnings in unrelated `data-table.tsx` from `react-hooks/incompatible-library`)
- `rg ">Aloha<" app/components/workspace-shell/workspace-navbar.tsx` — 1 match
- `rg "h-\[72px\]" app/components/workspace-shell/workspace-navbar.tsx` — 1 match
- `rg "AlohaLogoSquare" app/components/workspace-shell/workspace-navbar.tsx` — 2 matches
- `rg "renderTrigger" app/components/workspace-shell/workspace-navbar.tsx` — 1 match
- `rg "data-test=\"navbar-search-trigger\"" app/components/navbar-search.tsx` — 1 match (default path preserved)
- `rg "from-green-500 to-emerald-600" app/components/workspace-shell/aloha-logo-square.tsx` — 1 match
- `rg "shadow-lg shadow-green-500/25" app/components/workspace-shell/aloha-logo-square.tsx` — 1 match

## Downstream Notes for Plan 09-03 / 09-04

- Plan 09-03 (mobile drawer): Import `AlohaLogoSquare` with `size="sm"` for the mobile header; do NOT duplicate the gradient.
- Plan 09-04 (layout integration): Mount `<WorkspaceNavbar user={workspace.user} />` in `app/routes/workspace/layout.tsx`. `user.email` is available on the JwtPayload. Remove any stray existing navbar and ensure `<NavbarSearch />` is NOT also mounted elsewhere in the workspace layout (only the one inside `WorkspaceNavbar` should exist, otherwise Cmd+K listeners will double-fire).

## Self-Check: PASSED

- FOUND: app/components/navbar-search.tsx (modified)
- FOUND: app/components/workspace-shell/aloha-logo-square.tsx
- FOUND: app/components/workspace-shell/workspace-navbar.tsx
- FOUND: commit 5c60e7d
- FOUND: commit 958b865
- FOUND: commit cbb2c38
