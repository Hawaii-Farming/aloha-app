---
status: diagnosed
trigger: "UAT Test 5: navbar should not be hidden by sidebar"
created: 2026-04-10
updated: 2026-04-10
---

## Current Focus

hypothesis: Desktop `WorkspaceSidebar` uses shadcn `<Sidebar>` which renders its visual panel as `fixed inset-y-0 left-0 z-10 h-svh`, anchoring to the viewport top. Because the navbar sits inside the normal flex column flow with no z-index, the fixed sidebar panel overlaps the top 72px of the header.
test: Trace DOM order + positioning classes of navbar vs. shadcn Sidebar panel in `layout.tsx` and `packages/ui/src/shadcn/sidebar.tsx`
expecting: Confirm sidebar inner `<div>` is `fixed inset-y-0 ... z-10 h-svh` — i.e., it starts at y=0 and has higher stacking than the navbar
next_action: diagnose-only — return ROOT CAUSE FOUND

## Symptoms

expected: Workspace navbar (desktop 72px, mobile 56px) renders above/in-front of the sidebar; sidebar must not cover or hide the navbar at any viewport.
actual: User reports "navbar should not be hidden by sidebar" — the desktop sidebar panel visually overlaps the navbar's leftmost region (logo + wordmark area).
errors: none
reproduction: UAT Test 5 — load `/home/:account/...` on desktop (or 375px mobile). Observe that the sidebar's top edge is flush with the viewport top, covering the left portion of the 72px navbar.
started: Phase 9 UAT, 2026-04-10

## Eliminated

- hypothesis: Mobile-specific issue (mobile Sheet drawer covering 56px header)
  evidence: On mobile (<768px), the shadcn `<Sidebar>` returns a `<Sheet>` that is closed by default (`openMobile=false`) and unmounts when closed. The desktop branch `<div class="hidden md:block">` around `<WorkspaceSidebar>` also hides it on mobile. The `WorkspaceMobileHeader` is `md:hidden`. So on a static 375px viewport with the drawer closed, nothing from shadcn Sidebar is visible. When the drawer IS open, it's the separate `WorkspaceMobileDrawer` (Radix Dialog), not the shadcn Sheet. The user's complaint is actually about the DESKTOP sidebar panel covering the DESKTOP navbar — Test 5 was the viewport where they noticed it, but the underlying bug is the desktop stacking. Re-reading the Truth statement in 09-UAT.md confirms: "sidebar must not cover or hide the navbar at any viewport."
  timestamp: 2026-04-10

- hypothesis: Navbar rendered inside the main content area below the sidebar
  evidence: `app/routes/workspace/layout.tsx` lines 70–95 show the navbar IS rendered as a sibling of (and ABOVE) the `<div className="flex flex-1 overflow-hidden">` that contains the sidebar + main. The DOM order is correct: navbar → sidebar+main. The bug is not DOM order but CSS positioning taking the sidebar out of flow.
  timestamp: 2026-04-10

## Evidence

- timestamp: 2026-04-10
  checked: `app/routes/workspace/layout.tsx` lines 68–106
  found: |
    Layout structure:
    ```
    <SidebarProvider>
      <div class="flex h-svh w-full flex-col">        ← outer flex column
        <WorkspaceNavbar class="hidden md:flex" />    ← 72px, in flow, NO z-index
        <WorkspaceMobileHeader class="md:hidden" />   ← 56px, in flow, NO z-index
        <div class="flex flex-1 overflow-hidden">     ← row: sidebar + main
          <div class="hidden md:block">
            <WorkspaceSidebar />                       ← shadcn <Sidebar>
          </div>
          <main class="flex-1 overflow-y-auto">...</main>
        </div>
        <WorkspaceMobileDrawer />
      </div>
    </SidebarProvider>
    ```
    The navbar is a normal flow block with no `position` or `z-index`.
  implication: Navbar participates in normal stacking context at z-index=auto (effectively 0). Any fixed-positioned element with z-index >= 1 will render on top of it.

- timestamp: 2026-04-10
  checked: `app/components/workspace-shell/workspace-navbar.tsx` lines 17–24
  found: |
    `<header class="bg-card border-border flex h-[72px] shrink-0 items-center gap-4 border-b px-6">` — no `position`, no `z-index`, no `sticky`, no `relative`.
  implication: Navbar has zero stacking priority. It's a bare flex child.

- timestamp: 2026-04-10
  checked: `app/components/workspace-shell/workspace-mobile-header.tsx` lines 25–31
  found: |
    `<header class="bg-card border-border flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden">` — same pattern, no `position`, no `z-index`.
  implication: Same problem on mobile header if any fixed element overlays it.

- timestamp: 2026-04-10
  checked: `app/components/sidebar/workspace-sidebar.tsx` lines 56–77
  found: |
    Uses shadcn `<Sidebar collapsible="icon">` — inherits shadcn Sidebar's full positioning behavior. No positional overrides passed as className (only `bg-card border-border border-r`).
  implication: All positioning is inherited from `packages/ui/src/shadcn/sidebar.tsx`.

- timestamp: 2026-04-10
  checked: `packages/ui/src/shadcn/sidebar.tsx` lines 236–284 (desktop branch)
  found: |
    The shadcn desktop Sidebar renders TWO divs:
    1. A "gap/spacer" div (line 246): `relative w-(--sidebar-width) bg-transparent ... h-svh` — this holds the column width in the flex row.
    2. A "visual panel" div (line 259): **`fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) md:flex`** with `left-0` (line 262).

    The visual panel is `position: fixed`, anchored to viewport with `inset-y-0` (top:0, bottom:0), spans full viewport height `h-svh`, and has `z-10`.
  implication: **ROOT CAUSE.** The shadcn Sidebar's visible panel is `fixed top:0 left:0 z-10 h-svh`. It starts at y=0 of the viewport, so it paints OVER the top 72px (or 56px on mobile) where the navbar lives. The navbar has no z-index, so `z-10 > auto` wins — sidebar covers the left edge of the navbar (logo + wordmark area, exactly where the user sees it being "hidden").

- timestamp: 2026-04-10
  checked: `SidebarProvider` (packages/ui/src/shadcn/sidebar.tsx ~line 159)
  found: |
    `SidebarProvider` renders its wrapper with `className={cn('group/sidebar-wrapper flex min-h-svh w-full', ...)}` — no position, no z-index override. The layout's own `<div class="flex h-svh w-full flex-col">` inside it handles the column flow. Nothing in SidebarProvider pushes the sidebar below the header.
  implication: The layout is built on the assumption that the navbar and sidebar are siblings in a flex-column/flex-row tree — but shadcn's desktop Sidebar breaks that assumption by taking its visual panel OUT of flow with `position: fixed` anchored to viewport top.

- timestamp: 2026-04-10
  checked: Mobile branch of shadcn `<Sidebar>` lines 210–233
  found: |
    On mobile (`isMobile === true`), shadcn Sidebar returns a `<Sheet>` (Radix Dialog) that is controlled by `openMobile`. When closed, Radix unmounts the content — no overlay. When open, it's a full-height modal sheet with its own backdrop.

    BUT — the project's `WorkspaceMobileDrawer` is a SEPARATE component (not the shadcn Sheet). The hamburger in `WorkspaceMobileHeader` opens `drawerOpen` local state, not `openMobile` from `useSidebar()`. So the shadcn mobile Sheet is effectively dead code in this layout on mobile.

    Additionally, the desktop Sidebar is wrapped in `<div class="hidden md:block">` in layout.tsx — so on <768px, the `Sidebar` component still renders (SidebarProvider mounts it), but its outer wrapper `hidden md:block` hides it. Meanwhile inside shadcn Sidebar itself, `isMobile` is also checked — so on mobile it'd return the Sheet, which (being closed) unmounts.
  implication: On mobile, the shadcn Sidebar panel is NOT the thing covering the mobile header. The mobile header isn't actually being covered in the rendered viewport — the user reported this under Test 5 (mobile 375px) but the complaint "navbar should not be hidden by sidebar" most likely describes what they saw in DESKTOP mode during resize / dev tools, OR the complaint is about the Truth statement's general invariant. The ROOT CAUSE applies to desktop (>=768px).

- timestamp: 2026-04-10
  checked: Related Phase 9 decision in STATE.md
  found: |
    "Pitfall 1 (closed shadcn Sheet on mobile under SidebarProvider) statically resolved — Radix closed dialog unmounts content, no click-blocking overlay; optional 'SidebarProvider desktop-only mount' cleanup deferred to Phase 10+"
  implication: The team already knew about the mobile Sheet concern. What they MISSED was that on desktop, shadcn Sidebar's `fixed inset-y-0 z-10` visual panel covers any header rendered above it in the flex column.

## Resolution

root_cause: |
  **CSS stacking / positioning mismatch between the shadcn `<Sidebar>` component and the workspace layout's flex-column shell.**

  The layout in `app/routes/workspace/layout.tsx` assumes a normal flex tree:

      <SidebarProvider>
        <div class="flex h-svh w-full flex-col">
          <WorkspaceNavbar />                 ← row 1, 72px, in flow
          <div class="flex flex-1">
            <WorkspaceSidebar />              ← row 2 col 1
            <main />                          ← row 2 col 2
          </div>
        </div>
      </SidebarProvider>

  But `packages/ui/src/shadcn/sidebar.tsx` (line 259–272) renders the actual visible sidebar panel as:

      <div class="fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) md:flex left-0 ...">

  Three problems compound:

  1. **`position: fixed`** — takes the panel out of the flex flow, so it ignores the fact that a 72px header sits above its flex-parent.
  2. **`inset-y-0` + `h-svh`** — anchors top:0/bottom:0 to the VIEWPORT (not its flex parent), so the panel literally starts at pixel 0 of the window, covering the top 72px where the navbar paints.
  3. **`z-10`** — gives the sidebar panel a higher z-index than the navbar (which has no z-index, effectively z-auto / 0), so the sidebar wins the stacking context and paints on top of the navbar's left edge (logo + "Aloha" wordmark).

  The gap/spacer `<div>` (line 246) correctly reserves horizontal space in the flex row so `<main>` doesn't shift, but it does NOT push the fixed panel's top edge down — the spacer only holds width, not top offset.

  **Why it looks like "sidebar covers navbar on the left":** The fixed sidebar panel is 220px wide (or 68px collapsed), anchored to viewport top-left. The navbar's AlohaLogoSquare + "Aloha" wordmark live in the first ~220px of the 72px-tall header. Those pixels are exactly where the sidebar panel sits, so the user sees the sidebar's `bg-card` and border covering the logo area. The search box and avatar (further right) are not covered, which is why the user's wording is "navbar should not be HIDDEN by sidebar" — meaning the left part is hidden.

  **Mobile note:** On true mobile viewports (<768px), the shadcn desktop sidebar panel is hidden via `hidden md:flex`, and the project's `WorkspaceMobileDrawer` is a separate Radix Dialog (not the shadcn Sheet), so the 56px mobile header is NOT currently covered by a fixed element. The user logged this under Test 5 but the observable bug is on the desktop breakpoint.

  **Fix direction (for caller; not applied):** Either
  (a) Give the navbar `relative z-20` (or `sticky top-0 z-20`) so it stacks above the sidebar's `z-10`, AND add `top-[72px]` (with responsive variant) to the shadcn sidebar's fixed panel so it starts below the header — this requires either a prop on `<Sidebar>` or a local override className passed into `WorkspaceSidebar`, OR
  (b) Restructure: move `SidebarProvider` + the sidebar+main row INSIDE a wrapper that is itself below the navbar — BUT this won't help on its own because `inset-y-0` is viewport-relative, not parent-relative. Option (a) is the real fix.

  The cleanest single change is: override the fixed panel's top via className at `WorkspaceSidebar`'s `<Sidebar className="... md:top-[72px] md:h-[calc(100svh-72px)]">`, AND add `relative z-20` to the navbar header (so `z-10` sidebar can't cover it even during transition). Decision belongs to the fix phase.
fix: (not applied — diagnose-only mode)
verification: (not applied)
files_changed: []
