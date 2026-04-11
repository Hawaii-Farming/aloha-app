# Milestones

## v2.0 Aloha Design System Retheme (Shipped: 2026-04-10)

**Phases completed:** 4 phases, 22 plans, 40 requirement IDs

**Stats:** 166 commits, 144 files changed, +21,255 / −1,445 lines. Timeline: 1 day (2026-04-10, ~12h sprint).

**Key accomplishments:**

- DESIGN.md rewritten as Aloha theme source of truth (Inter 16px, slate neutrals, green-500→emerald-600 gradient primary, rounded-2xl scale, shadow tokens, light-first). Tailwind 4 `@theme` block carries palette, font, radius, and shadow tokens; Inter Variable loaded via `@fontsource-variable/inter` replacing Geist.
- `scripts/verify-wcag.mjs` enforces 24 contrast assertions across shell chrome, primitives, and AG Grid token pairs; derived dark palette passes WCAG AA in both themes.
- Shared primitives restyled via cva + Phase 7 tokens — Button (green gradient, py-3, rounded-2xl), Card (rounded-2xl + slate border + soft shadow), Input/Textarea/Select (text-base, green focus halo), Badge (pill + 7 semantic variants), Avatar (sm/md/lg + gradient fallback), Sheet (leading-corner radius + form-field spacing). Zero caller prop changes.
- §9.1 Option A focus ring (`ring-2 ring-primary ring-offset-2 ring-offset-background`) applied uniformly to all form primitives.
- WorkspaceNavbar (72px desktop header) with AlohaLogoSquare gradient primitive, `renderTrigger`-seamed ⌘K search trigger, WorkspaceNavbarProfileMenu, and `getOrgInitials`-derived avatar fallback ("HF" for Hawaii Farming).
- Workspace sidebar bumped to 220/68px with gradient active pill, accordion sub-items (green-50 chip + green-200 left rail), persisted collapse cookie, NAVIGATION/MODULES section headers, chevron module dropdowns, and "Focused" footer — all ported onto the existing Shadcn sidebar primitive.
- Sidebar toggle relocated to navbar leftmost position (before the Aloha logo square), retiring the detached edge toggle.
- WorkspaceMobileHeader + WorkspaceMobileDrawer (Framer Motion spring + fade, black/30 backdrop, explicit X close, auto-close on route change). Drawer reuses the desktop sidebar nav source — no duplicated config.
- Scrollbars on sidebar and main content themed (thin, tokenized thumb) in both light and dark modes, matching the prototype.
- `ag-grid-theme.ts` rewritten via `themeQuartz.withParams` to Aloha hexes and Inter Variable for both themes; every HR grid (Register, Scheduler, Time Off, Payroll ×3, Hours Comparison, Housing, Employee Review) inherits the new look without per-grid code changes.
- Workspace layout bounded flex chain eliminates AG Grid shrink/collapse; toolbar search input overridden to rounded-md (squared) matching the prototype.
- Dark mode renders navbar and sidebar on distinct elevated dark surfaces (not page background); `next-themes` toggle produces no layout shifts or contrast regressions.
- BUG-01 fixed — active-module gradient pill renders immediately on click and on initial route load, unified across module/sub-module states.
- BUG-02 fixed — cmdk command-palette now navigates to module-level links reliably via `NavbarSearchItem` + `onSelect`-driven navigation.
- Phase 10 full regression: WCAG AA audit passed, PARITY-02 static verification, zero CRUD/loader/action/i18n/CSRF regressions.
- Post-ship quick task 260410-sl6 landed a mobile responsiveness pass (AG Grid search shrink, mobile search dialog, container-query detail rows, toolbar reorder, navbar search label-inclusive filtering).

---

## v1.0 HR Module Submodules (Shipped: 2026-04-09)

**Phases completed:** 6 phases, 21 plans, 43 tasks

**Key accomplishments:**

- AG Grid Community v35.2.1 installed with DESIGN.md-themed light/dark config, Shadcn Badge status renderer, employee avatar renderer, and date/currency value formatters
- AgGridWrapper with ClientOnly SSR safety, next-themes dark/light bridging, and mapColumnsToColDefs utility that auto-converts CrudModuleConfig columns to AG Grid ColDef[]
- Detail row expansion hook with accordion behavior, column state persistence to localStorage, CSV export button, and conditional row/cell styling utilities with Tailwind classes
- AgGridListView drop-in component replacing TableListView for register submodule with search, bulk actions, CSV export, column visibility, and column state persistence
- Updated ops_task_weekly_schedule view with employee photo/department/work-auth columns, CRUD config with custom list viewType, and Zod schema for schedule creation
- SchedulerListView component with week navigation toolbar, department filter, OT row highlighting, and custom sub-module loader for weekly schedule view
- Schedule history API with per-employee detail expansion, date-aggregated summary toggle, and CreatePanel for new schedule entries
- SQL view app_hr_time_off_requests joining employee profile, department, work auth, comp manager, and request/review names with org-scoped RLS policies
- Updated hrTimeOffConfig with agGrid viewType, 14 TOFF-01 columns, required request_reason, workflow transitionFields, and extended CRUD actions with extraFields/additionalFields parameters
- StatusFilterTabs button group for status filtering, TimeOffActionsRenderer with inline approve/deny and denial reason popover, filterSlot wiring through AgGridListView toolbar
- Four SQL payroll views, three CRUD configs with ColGroupDef column groups, and generalized sub-module loader for payroll period/manager filtering
- Payroll Comparison custom list view with by-task/by-employee toggle, pay period filter, pinned grand totals, and CSV export
- Payroll Comp Manager custom list view with manager selector dropdown, pay period filter, pinned summary totals row, and CSV export
- PayrollDataFilterBar with pay period and employee filters, Create button hidden for read-only payroll configs, default pay period selection
- SQL view comparing scheduled vs payroll hours per employee per pay period, plus API endpoint for daily schedule drill-down
- Hours Comparison AG Grid with pay period filter, variance highlighting (amber >0h, red >=4h), and API-driven daily schedule detail rows
- Applied app_hr_hours_comparison view migration to hosted Supabase and verified all HCMP requirements end-to-end
- 4 SQL migrations: org_site max_beds column, app_hr_housing occupancy view, hr_employee_review table with scored averages and RLS, app_hr_employee_reviews display view
- Housing AG Grid config with occupancy columns, tenant detail row via API fetch, and auto-resolved category on create
- Employee review AG Grid with score color coding (1=red/2=amber/3=green), Year-Quarter filter, lock enforcement, and detail row expansion
- Pushed 4 SQL migrations to hosted Supabase (org_site_max_beds, app_hr_housing, hr_employee_review, app_hr_employee_reviews) and regenerated TypeScript types

---
