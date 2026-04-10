---
status: diagnosed
trigger: "active module is green→emerald gradient only for Human resources. all others are grey"
created: 2026-04-10
updated: 2026-04-10
---

## Current Focus

hypothesis: Module headers are `CollapsibleTrigger` wrappers only (not `<Link>`), so clicking a non-HR module header merely toggles the accordion and does NOT change the URL. The active-module gradient is driven by `currentPath.startsWith(modulePath)`, which only matches the module whose sub-item the user last visited. In the UAT session the user landed on HR (the seeded/default module), clicked other module headers expecting navigation, got no URL change, and therefore saw the gradient stuck on HR — the only module actually matching `currentPath`.
test: Read `ModuleSidebarNavigation` collapsed + expanded branches and confirm neither branch wraps the module header in a `<Link>` or otherwise navigates on click.
expecting: Both branches only call `toggleModule()` via `CollapsibleTrigger` — there is no navigation side-effect on the module header itself.
next_action: Document root cause, do NOT apply fix (goal: find_root_cause_only).

## Symptoms

expected: All active modules in the desktop sidebar render with the green→emerald gradient pill (not just Human Resources). `bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 rounded-xl` should apply to ANY module whose slug matches the current URL's module segment.
actual: "active module is green→emerald gradient only for Human resources. all others are grey" — user perceives the gradient as permanently stuck on HR no matter which other module they try to visit.
errors: None.
reproduction: UAT Test 1, Phase 9. On desktop (expanded sidebar), start at a URL under HR (e.g. `/home/{account}/human_resources/employees`), click another module name (e.g. "Operations") in the sidebar, observe that the gradient does not move to Operations.
started: Discovered 2026-04-10 during Phase 9 UAT. Phase 9 Plan 1 added the gradient active-module pill.

## Eliminated

- hypothesis: Hardcoded HR / `human_resources` comparison in `isActive` derivation
  evidence: `app/components/sidebar/module-sidebar-navigation.tsx:85` computes `isModuleActive = currentPath.startsWith(modulePath)` where `modulePath = /home/${account}/${mod.module_slug}` — fully parameterized, no HR hardcoding. Same pattern at line 176 (expanded branch SidebarGroupLabel). Confirmed by grep.
  timestamp: 2026-04-10

- hypothesis: `cn()` / tailwind-merge strips the gradient classes because `SidebarGroupLabel` base class ships `text-muted-foreground`
  evidence: `packages/ui/src/lib/utils/cn.ts` uses `twMerge(clsx(...))`. twMerge correctly picks later `text-white` over earlier `text-muted-foreground`. `bg-gradient-to-r` sets `background-image`, independent of any `background-color` base. Final class string still contains `from-green-500 to-emerald-600` and `text-white`. Verified HR DOES render with gradient — same code path — so twMerge is not dropping the classes.
  timestamp: 2026-04-10

- hypothesis: `SidebarMenuButton`'s `data-[active=true]:bg-sidebar-accent` variant (cva base, `packages/ui/src/shadcn/sidebar.tsx:535`) paints over the gradient in collapsed mode
  evidence: `data-[active=true]:bg-sidebar-accent` sets `background-color`; `bg-gradient-to-r` sets `background-image`. Both apply; gradient covers color — HR renders gradient in collapsed mode proving it works. Same cva applies to every module equally, so cannot explain HR-only behavior.
  timestamp: 2026-04-10

- hypothesis: Module landing route `/home/:account/:module` redirects to HR specifically, so clicking a non-HR module bounces back to HR
  evidence: `app/routes/workspace/module.tsx` redirects to `/home/${accountSlug}/${moduleSlug}/${first.sub_module_slug}` — it redirects to the FIRST sub-module of the SAME module the user requested. No HR bias. But this route is only hit if the module header is actually a link to `/home/:account/:module`, which it is NOT (see root cause).
  timestamp: 2026-04-10

- hypothesis: Workspace sidebar is mounted at the layout level and does not re-render on route changes
  evidence: `ModuleSidebarNavigation` reads `useLocation()` from `react-router`, which subscribes to the router context. React re-renders on every location change regardless of where the component is mounted. Auto-expand `useState` only initializes from `activeModuleSlug` once, but the per-render `isModuleActive = currentPath.startsWith(modulePath)` reflects the live location.
  timestamp: 2026-04-10

## Evidence

- timestamp: 2026-04-10
  checked: `app/components/sidebar/module-sidebar-navigation.tsx` full file
  found: Both the collapsed branch (lines 94–159) and the expanded branch (lines 162–252) wire the module header exclusively inside a `<CollapsibleTrigger asChild>`. The collapsed branch uses `<SidebarMenuButton>` with NO `<Link>` child. The expanded branch uses `<SidebarGroupLabel>` — a plain `<div>` — with NO `<Link>`. Only the **sub-item** `<SidebarMenuButton asChild><Link to={subModulePath}>` elements (lines 141, 231) actually navigate.
  implication: Clicking a module name in the sidebar only toggles the accordion; it never changes the URL. The "active module" gradient is driven entirely by `currentPath.startsWith(modulePath)`, so a module can only become active when the user clicks one of its sub-items (or arrives at a URL under it via some other path).

- timestamp: 2026-04-10
  checked: `isModuleActive` derivation, lines 84–85 and 176–177
  found: `const modulePath = /home/${account}/${mod.module_slug}; const isModuleActive = currentPath.startsWith(modulePath);`. No hardcoded slug. Fully parameterized across all modules.
  implication: The logic is correct and symmetric for every module. The gradient will apply to whichever module's slug is currently in the URL. HR is not privileged in code.

- timestamp: 2026-04-10
  checked: `supabase/migrations/20260401000142_app_views.sql` lines 138–160 (`app_nav_modules` view)
  found: `module_slug = sys_module.id` (e.g. `'human_resources'`). Module and sub-module slugs are the same snake_case identifiers used in the URL. Both `modulePath` (built from `mod.module_slug`) and `subModulePath` (built from `sm.module_slug`) use the SAME `module_slug` field, so `startsWith` always matches consistently.
  implication: No slug mismatch between the module row and its sub-module rows. Data shape does not explain the bug.

- timestamp: 2026-04-10
  checked: `app/routes/workspace/module.tsx`
  found: `/home/:account/:module` loader redirects to the first sub-module of THAT module (`/home/${accountSlug}/${moduleSlug}/${first.sub_module_slug}`), no HR-specific redirect.
  implication: IF the module header were a link to `/home/:account/:module`, clicking it would redirect to the first sub-module of that module and the gradient would move. But the module header is NOT a link — so this route is never hit from the sidebar, and the gradient never moves.

- timestamp: 2026-04-10
  checked: `app/components/sidebar/workspace-sidebar.tsx`
  found: Passes `navigation.modules` and `navigation.subModules` unchanged to `<ModuleSidebarNavigation>`. No filtering, no HR special case.
  implication: Wrapper is inert — not the cause.

- timestamp: 2026-04-10
  checked: Auto-expand init (`useState(() => new Set(activeModuleSlug ? [activeModuleSlug] : []))`, lines 56–62)
  found: HR is likely the first-landed module after sign-in (Phase 9 UAT sessions start on HR employees), so `activeModuleSlug` initialises to `human_resources` and HR's accordion opens automatically. Other modules' accordions remain collapsed.
  implication: Reinforces the UX perception: HR is both auto-expanded AND gradient-active at session start, so when the user clicks another module's NAME (expecting navigation), the accordion opens but the URL stays on HR — the gradient stays on HR.

## Resolution

root_cause: |
  The module header in `ModuleSidebarNavigation` is NOT a navigation link. Both the collapsed-mode `<SidebarMenuButton>` and the expanded-mode `<SidebarGroupLabel>` are wrapped in `<CollapsibleTrigger asChild>`, so clicking the module name only toggles the accordion open/closed — it never changes the URL. The active-module gradient is computed per render as `isModuleActive = currentPath.startsWith(`/home/${account}/${mod.module_slug}`)`, which requires the URL to actually be inside that module's slug. Sub-items DO navigate (they are `<Link to={subModulePath}>`), but the module header itself does not.

  In the UAT flow the user landed on HR (the default module at sign-in), so `currentPath` started with `/home/{account}/human_resources` and HR received the gradient. When the user then clicked other module headers expecting them to become active, no navigation occurred, `currentPath` did not change, and the gradient stayed on HR. The result is the reported symptom: "active module is green→emerald gradient only for Human resources. all others are grey."

  The code is internally consistent — if the user were to click a sub-item under, say, Operations, the URL would become `/home/{account}/operations/<first-sub>` and Operations' module pill WOULD receive the gradient. So the gradient logic itself is not broken; the bug is that the UI affordance of the module header is misleading (it looks like a nav item, but it is only an accordion trigger).

  Secondary reinforcing factor: the auto-expand `useState` opens only the initially-active module's accordion (HR). All other modules render with their sub-items collapsed, so the user cannot even SEE sub-items to click on them without first performing the accordion-toggle click, further obscuring the correct path to activate a different module.

fix: (deferred — goal: find_root_cause_only)
  Likely fix direction: make the module header navigate to `/home/:account/:module` on click in addition to (or separately from) toggling the accordion. The module route already redirects to the module's first sub-module, which is the desired landing page. Options:
  1. Wrap the `<SidebarMenuButton>` / `<SidebarGroupLabel>` content in a `<Link to={modulePath}>` and move the accordion trigger to a separate affordance (e.g., the chevron at the right of the label).
  2. Render the module header as a `<Link>` and drop the `CollapsibleTrigger` from the header entirely — always-open accordions, or hover-to-open.
  3. Add an `onClick` on the header that programmatically navigates + toggles, keeping `CollapsibleTrigger` for keyboard a11y.
  Option 1 is the closest to the Phase 9 visual spec and preserves the accordion.

verification: (not performed — diagnosis only)
files_changed: []
