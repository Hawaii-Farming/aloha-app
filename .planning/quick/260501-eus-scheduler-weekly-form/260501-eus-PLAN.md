---
phase: quick-260501-eus
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/scheduler/scheduler-create-panel.tsx
  - app/components/ag-grid/scheduler-list-view.tsx
  - app/routes/api/scheduler/create-weekly.ts
  - app/routes.ts
  - app/lib/crud/ops-task-schedule.schema.ts
autonomous: false
requirements:
  - SCHED-WEEKLY-FORM
must_haves:
  truths:
    - "Clicking the '+' button on the Scheduler page opens a 7-day weekly form drawer (NOT the generic CreatePanel)."
    - "All other submodules (Employees, Tasks, etc.) still open the generic CreatePanel — unchanged."
    - "The drawer shows 7 day cards (Sun→Sat) prefilled with the dates of the currently-viewed week (the `?week` query param of the scheduler list view)."
    - "Each day card has: employee selector (top of form, applies to whole week), date input, start time, stop time, task selector. Empty days are skipped."
    - "On open, the drawer fetches the selected employee's most recent week of `ops_task_schedule` rows and prefills each day card by weekday match."
    - "A sticky footer at the bottom of the drawer shows the total weekly hours, recomputed live from form state."
    - "Submit posts the non-empty day rows to a Scheduler-specific endpoint that batch-inserts one `ops_task_schedule` row per filled day, skipping empty days, validating per-day (date present, start<stop, task selected) before insert."
    - "On success the drawer closes, a toast confirms `N entries created`, and the scheduler list view revalidates so new rows appear."
    - "Per-day validation errors surface inline on the offending day card (red border + message); the form does not submit if any filled day fails."
    - "UI is compact, mobile-first: vertical stacking by default, no horizontal overflow at 360px width; on `sm:` and up day cards may share a 2-column grid."
    - "The generic `app/components/crud/create-panel.tsx` file is byte-for-byte unchanged (verified by `git diff`)."
  artifacts:
    - path: "app/components/scheduler/scheduler-create-panel.tsx"
      provides: "Scheduler-only 7-day weekly form drawer (Sheet + per-day rows + sticky total footer)"
      min_lines: 200
    - path: "app/routes/api/scheduler/create-weekly.ts"
      provides: "Action that batch-inserts up to 7 ops_task_schedule rows for a single submit"
      exports: ["action"]
    - path: "app/routes.ts"
      provides: "Wires the new api/scheduler/create-weekly route"
      contains: "api/scheduler/create-weekly"
    - path: "app/lib/crud/ops-task-schedule.schema.ts"
      provides: "Existing single-entry schema PLUS new `opsTaskScheduleWeeklySchema` (array of day entries) used by the batch action"
      contains: "opsTaskScheduleWeeklySchema"
  key_links:
    - from: "app/components/ag-grid/scheduler-list-view.tsx"
      to: "app/components/scheduler/scheduler-create-panel.tsx"
      via: "default import — the `<CreatePanel>` JSX at the bottom of the list view is replaced with `<SchedulerCreatePanel>`"
      pattern: "SchedulerCreatePanel"
    - from: "app/components/scheduler/scheduler-create-panel.tsx"
      to: "/api/schedule-history?mode=detail"
      via: "fetch in the open-drawer effect (employeeId + orgId), used to prefill day cards"
      pattern: "schedule-history\\?mode=detail"
    - from: "app/components/scheduler/scheduler-create-panel.tsx"
      to: "/api/scheduler/create-weekly"
      via: "useFetcher().submit({ method: 'POST', encType: 'application/json' })"
      pattern: "api/scheduler/create-weekly"
    - from: "app/routes/api/scheduler/create-weekly.ts"
      to: "ops_task_schedule (Supabase insert)"
      via: "client.from('ops_task_schedule').insert([...])"
      pattern: "from\\('ops_task_schedule'"
---

<objective>
Replace the Scheduler submodule's single-entry create drawer with a 7-day weekly form. Each day has its own date / start / stop / task; submit batch-creates one `ops_task_schedule` row per filled day. Prefill from the employee's most recent week of history. Sticky footer shows total weekly hours.

This is a **frontend + thin orchestration route** change only. No DB schema changes, no migration, no changes to the generic CRUD pipeline used by every other submodule.

**Hard constraint:** `app/components/crud/create-panel.tsx` is the generic drawer used by every submodule and MUST NOT be modified. The Scheduler swap is local to `scheduler-list-view.tsx`.

Purpose: scheduling a worker is a weekly activity (planning a worker's whole week), not a single-row activity. The single-entry form forced 7 round trips for one weekly plan; this collapses that into one drawer with prefill from history.

Output: a Scheduler-only drawer component, a batch insert action, a small schema addition, two file edits to wire it in.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md

@app/components/crud/create-panel.tsx
@app/components/ag-grid/scheduler-list-view.tsx
@app/lib/crud/ops-task-schedule.config.ts
@app/lib/crud/ops-task-schedule.schema.ts
@app/lib/crud/crud-action.server.ts
@app/routes/api/schedule-history.ts
@app/routes/workspace/sub-module-create.tsx
@app/routes.ts
@app/lib/crud/render-form-field.tsx

<interfaces>
<!-- Reusable form atoms — DO NOT reinvent; import these. -->

From `@aloha/ui/form-fields` (packages/ui/src/kit/form-fields.tsx):
```
export function FormTextField<T>({ control, name, label, required, ... })
export function FormNumberField<T>({ control, name, label, required, ... })
export function FormDateField<T>({ control, name, label, required, defaultMonth, ... })
export function FormDateTimeField<T>({ control, name, label, required, ... })
```
- All accept a react-hook-form `Control<T>` and a `name` path.
- `FormDateField` renders a date picker; `FormDateTimeField` renders date+time.
- For day cards we use **separate** `FormDateField` for the date and a plain time `<Input type="time">` for start/stop OR `FormDateTimeField` if combining date+time is simpler. The plan task picks: keep date and times separate fields per day card so the user can change the date independently and the time inputs stay compact.

From `@aloha/ui/fk-combobox` (packages/ui/src/kit/fk-combobox.tsx):
```
export function FkCombobox<T>({ control, name, label, required, options, ... })
// options is `Array<{ value: string; label: string }>`
```
- Already used by the generic FormFieldGrid for `fk` fields.
- Pass `fkOptions['hr_employee_id']` and `fkOptions['ops_task_id']` from props.

From `@aloha/ui/sheet`: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`.
From `@aloha/ui/button`: `Button` (`variant="brand"` for primary submit).
From `@aloha/ui/sonner`: `toast`.
From `@aloha/ui/form`: `Form`.
From `react-hook-form`: `useForm`, `useWatch`, `useFieldArray` (one row per day, fixed length 7).
From `react-router`: `useFetcher`, `useRevalidator`.

From `app/lib/crud/types`:
```
interface ListViewProps {
  tableData, fkOptions, config, comboboxOptions, subModuleDisplayName,
  accountSlug,
  ...
}
```
The new `<SchedulerCreatePanel>` will accept the same `fkOptions` (for employee + task FK lists), `accountSlug` (for the prefill fetch), `currentWeek` (the `yyyy-MM-dd` Sunday already computed in scheduler-list-view), `open`, `onOpenChange`, `subModuleDisplayName`.

From `app/routes/api/schedule-history.ts` (mode=detail) returns rows shaped:
```
{
  id, start_time, stop_time, ops_task_id, hr_employee_id, org_id,
  date, day_of_week, start_time_formatted, end_time_formatted,
  hours, task_name, ...
}
```
Use `start_time`, `stop_time`, `ops_task_id`, and `date` to prefill day cards by weekday match.

</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add weekly batch schema + batch-insert action route</name>
  <files>
    app/lib/crud/ops-task-schedule.schema.ts,
    app/routes/api/scheduler/create-weekly.ts,
    app/routes.ts
  </files>
  <action>
**1a. Extend `app/lib/crud/ops-task-schedule.schema.ts`.** Keep the existing `opsTaskScheduleSchema` (single-row) so the generic CRUD path still type-checks. Add a new export `opsTaskScheduleWeeklySchema`:

```ts
export const opsTaskScheduleEntrySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Start time is required'),
    stop_time: z.string().regex(/^\d{2}:\d{2}$/, 'End time is required'),
    ops_task_id: z.string().min(1, 'Task is required'),
  })
  .refine((v) => v.start_time < v.stop_time, {
    message: 'End time must be after start time',
    path: ['stop_time'],
  });

export const opsTaskScheduleWeeklySchema = z.object({
  hr_employee_id: z.string().min(1, 'Employee is required'),
  entries: z.array(opsTaskScheduleEntrySchema).min(1, 'Add at least one day'),
});

export type OpsTaskScheduleEntry = z.infer<typeof opsTaskScheduleEntrySchema>;
export type OpsTaskScheduleWeekly = z.infer<typeof opsTaskScheduleWeeklySchema>;
```

Notes:
- Per-day shape is **date + start_time + stop_time + ops_task_id** (split, not combined). The action will combine them into ISO timestamps before insert.
- Empty days are filtered client-side BEFORE submission, so the schema's `min(1)` only catches the "submit with zero filled days" case.
- Per-day `start < stop` validation lives here; the client will surface field-level errors from `parsed.error.flatten().fieldErrors` (or Zod's issue path) per day.

**1b. Create `app/routes/api/scheduler/create-weekly.ts`.** Action-only route (no loader). Pattern mirrors `app/routes/workspace/sub-module-create.tsx` action body but calls Supabase `.insert([...])` with a built array. Skeleton:

```ts
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';
import { opsTaskScheduleWeeklySchema } from '~/lib/crud/ops-task-schedule.schema';

export const action = async ({ request }: { request: Request }) => {
  if (request.method !== 'POST') {
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  const client = getSupabaseServerClient(request);
  const body = await request.json();

  // accountSlug comes from body since this route is not nested under :account
  const accountSlug = body.accountSlug as string;
  if (!accountSlug) {
    return Response.json({ success: false, error: 'accountSlug required' }, { status: 400 });
  }

  const parsed = opsTaskScheduleWeeklySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ success: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const workspace = await loadOrgWorkspace({ orgSlug: accountSlug, client, request });
  const employeeId = workspace.currentOrg.employee_id;

  const rows = parsed.data.entries.map((entry) => ({
    org_id: accountSlug,
    hr_employee_id: parsed.data.hr_employee_id,
    ops_task_id: entry.ops_task_id,
    // Combine date + time into a local-time ISO string. The DB column is
    // timestamptz; the existing single-entry path already submits the
    // browser-local datetime-local string, so we follow that contract.
    start_time: `${entry.date}T${entry.start_time}:00`,
    stop_time: `${entry.date}T${entry.stop_time}:00`,
    created_by: employeeId,
    updated_by: employeeId,
  }));

  const { data, error } = await client
    .from('ops_task_schedule')
    .insert(rows)
    .select();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, count: data?.length ?? 0 });
};
```

Why a dedicated route (not branching `sub-module-create`):
- The existing `crudCreateAction` is single-row only (`.insert(insertData).select().single()`). Adding a "is this scheduler? if so, branch to a different shape" check inside the generic action couples the registry to a single submodule's quirks — exactly the kind of leak the constraint is trying to avoid.
- A dedicated route keeps the generic create path untouched and gives the Scheduler drawer a single, type-safe target.

**1c. Wire route in `app/routes.ts`.** Add inside `apiRoutes`, alongside the other `api/schedule-*` entries:
```ts
route('api/scheduler/create-weekly', 'routes/api/scheduler/create-weekly.ts'),
```
Create the `app/routes/api/scheduler/` directory as needed (it doesn't exist yet — verify with `ls app/routes/api/` first).
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
  </verify>
  <done>
- `pnpm typecheck` passes with the new schema export and the new action route.
- `app/routes/api/scheduler/create-weekly.ts` exists, exports `action`, references `opsTaskScheduleWeeklySchema`.
- `app/routes.ts` contains the line `api/scheduler/create-weekly`.
- The single-entry `opsTaskScheduleSchema` is unchanged (the existing CRUD pipeline still compiles).
- `git diff app/components/crud/create-panel.tsx` shows zero changes (sanity check — this task should not touch that file).
  </done>
</task>

<task type="auto">
  <name>Task 2: Build the Scheduler weekly-form drawer component</name>
  <files>
    app/components/scheduler/scheduler-create-panel.tsx
  </files>
  <action>
Create `app/components/scheduler/scheduler-create-panel.tsx` (new directory `app/components/scheduler/`). This is the Scheduler-only replacement for `<CreatePanel>` in scheduler-list-view.

**Component contract:**

```ts
interface SchedulerCreatePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fkOptions: Record<string, Array<{ value: string; label: string }>>;
  subModuleDisplayName: string;
  accountSlug: string;
  /** yyyy-MM-dd Sunday — the currently-viewed week from `?week`. */
  currentWeek: string;
}
```

**Form shape (react-hook-form):**

```ts
type DayEntry = {
  date: string;       // 'yyyy-MM-dd' — defaults to currentWeek + dayIndex
  start_time: string; // 'HH:mm' — '' if empty
  stop_time: string;  // 'HH:mm' — '' if empty
  ops_task_id: string; // '' if empty
};

type WeeklyFormValues = {
  hr_employee_id: string;
  days: DayEntry[]; // fixed length 7, Sun→Sat
};
```

Use `useFieldArray({ name: 'days', control })` for the 7 day rows. Field array length is fixed at 7; we never push/remove — empty rows are simply skipped at submit time. Default values:

```ts
const defaultDays = Array.from({ length: 7 }, (_, i) => ({
  date: format(addDays(parseISO(currentWeek), i), 'yyyy-MM-dd'),
  start_time: '',
  stop_time: '',
  ops_task_id: '',
}));
```

**Validation:** No `zodResolver` on the form itself — server is the source of truth, and per-day Zod refinement runs on submit. Instead, do client-side row-level checks at submit time:

```ts
const filled = days.filter(
  (d) => d.start_time || d.stop_time || d.ops_task_id,
);
const errors: Record<number, string> = {};
filled.forEach((d, i) => {
  if (!d.date) errors[i] = 'Date is required';
  else if (!d.start_time) errors[i] = 'Start time is required';
  else if (!d.stop_time) errors[i] = 'End time is required';
  else if (d.start_time >= d.stop_time) errors[i] = 'End must be after start';
  else if (!d.ops_task_id) errors[i] = 'Task is required';
});
```
Surface errors as a red border + small text below the offending day card. If `filled.length === 0`, show a toast "Add at least one day before saving" and bail.

**Prefill effect (justified `useEffect` — cross-system fetch on open):** when `open` flips true AND `hr_employee_id` is set, fetch:

```ts
const res = await fetch(
  `/api/schedule-history?mode=detail&employeeId=${empId}&orgId=${accountSlug}`,
);
```

The response is sorted desc by `start_time`. Take the first row's `date`, find its Sunday-anchored week start, then walk all rows whose week start matches. For each such row, find its weekday index (0–6) and seed the corresponding day card with:
- `start_time`: parse `start_time` ISO and extract `HH:mm`
- `stop_time`: parse `stop_time` ISO and extract `HH:mm`
- `ops_task_id`: row.ops_task_id

Do NOT overwrite the seeded `date` field — that stays anchored to `currentWeek` (the user is planning the currently-viewed week, not copying historical dates). Rationale: prefill teaches the form the *pattern* the worker normally works (Mon–Fri 7–15, Tasks=Harvesting), to be applied to the upcoming week.

If no employee is selected yet, no prefill — just show the empty 7 day cards. Re-fetch when `hr_employee_id` changes (gate by `open === true`). Cancel via `AbortController` on unmount/employee change.

**Layout (compact, mobile-first):**

- `Sheet side="right"`, content width: `w-full sm:w-[90%] sm:max-w-2xl` (matches the generic CreatePanel for muscle memory).
- Top section (sticky inside the sheet via flex column):
  - Sheet header: `Create {subModuleDisplayName}` (subModuleDisplayName is "Scheduler" or "Schedule" — use as given).
  - Below header, padded: an `<FkCombobox>` for `hr_employee_id`. Full-width.
- Scrollable middle section (`flex-1 overflow-y-auto px-4 py-3`):
  - 7 day cards stacked vertically (`space-y-2`). Each card:
    - Header row: weekday name (`Sun`, `Mon`, ...) + the date input (`FormDateField` wired to `days.{i}.date`). Weekday is plain text, date input compact (`max-w-[140px]`).
    - Body row: a 3-column grid on `sm:` (`grid-cols-1 sm:grid-cols-[1fr_1fr_2fr] gap-2`):
      - Start: `<Input type="time">` bound via `Controller` (no `FormDateTimeField`; we want bare time input)
      - Stop: `<Input type="time">` bound via `Controller`
      - Task: `<FkCombobox>` bound to `days.{i}.ops_task_id`, options=`fkOptions['ops_task_id']`
    - Per-row error message: small `text-destructive text-xs` below if row has an error.
    - Card border: `rounded-md border p-3`. When the row is "filled" (any of start/stop/task set), bump border to `border-primary/30 bg-muted/30`. When row has an error, `border-destructive`.
- Sticky footer (`shrink-0 border-t px-4 py-3 flex items-center justify-between`):
  - Left: `Total: {totalHours}h` — computed via `useWatch({ control, name: 'days' })` then summed:
    ```ts
    const totalHours = days.reduce((sum, d) => {
      if (!d.start_time || !d.stop_time || d.start_time >= d.stop_time) return sum;
      const [sh, sm] = d.start_time.split(':').map(Number);
      const [eh, em] = d.stop_time.split(':').map(Number);
      return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    }, 0);
    ```
    Format: `totalHours.toFixed(2)`.
  - Right: `Cancel` button + `Create N entries` button (disabled while submitting; label updates with `filled.length`).

**Submit:**

```ts
const fetcher = useFetcher();
const onSubmit = (values: WeeklyFormValues) => {
  const filled = values.days.filter(
    (d) => d.start_time || d.stop_time || d.ops_task_id,
  );
  // run client validation as above; if errors, setRowErrors and return.
  fetcher.submit(
    {
      accountSlug,
      hr_employee_id: values.hr_employee_id,
      entries: filled.map((d) => ({
        date: d.date,
        start_time: d.start_time,
        stop_time: d.stop_time,
        ops_task_id: d.ops_task_id,
      })),
    },
    {
      method: 'POST',
      action: '/api/scheduler/create-weekly',
      encType: 'application/json',
    },
  );
};
```

Watch `fetcher.state` + `fetcher.data` (mirror the generic CreatePanel's `useRef(hasHandledSuccess)` pattern):
- On success: `toast.success(\`Created ${count} entries\`)`, `revalidator.revalidate()`, `onOpenChange(false)`, `form.reset(buildDefaults(currentWeek))`.
- On error: `toast.error(fetcherData.error ?? 'Failed to save schedule')`. If `fetcherData.errors` returned (Zod fieldErrors), surface per-row by re-running the same client validator (server is authoritative but the client check should already have caught it).

**Reset on close:** wrap `onOpenChange` so closing resets the form to fresh defaults rebuilt from the (possibly-newer) `currentWeek`. If `currentWeek` prop changes while the drawer is open, do NOT auto-reset — the user is mid-edit; the next open will get the new week.

**Code-smell guard:** the only `useEffect`s allowed in this component are:
1. The prefill fetch on open + employee change (justified: cross-system fetch).
2. The fetcher response handler (justified: refs must be read in effect, mirrors generic CreatePanel).
3. The drawer-close reset trigger (only fires when `open` transitions false→true to clear `hasHandledSuccess.current`).

Everything else (totals, row errors, "filled" badge) flows from `useWatch` + render.

**No new dependencies.** Use only what's already in `package.json`. `date-fns` is already imported in scheduler-list-view, so reuse `format`, `addDays`, `parseISO`.

**`data-test` attributes** (for E2E):
- `data-test="scheduler-create-panel"` on the `SheetContent`
- `data-test="scheduler-day-card-{0..6}"` on each day card root
- `data-test="scheduler-weekly-submit"` on the submit button
- `data-test="scheduler-weekly-total"` on the total hours span
  </action>
  <verify>
    <automated>pnpm typecheck && pnpm lint</automated>
  </verify>
  <done>
- `app/components/scheduler/scheduler-create-panel.tsx` exists and exports `SchedulerCreatePanel` (named export).
- `pnpm typecheck` passes.
- `pnpm lint` passes (no `any`, no unjustified `useEffect`, no `watch()` — uses `useWatch`).
- File contains exactly the three justified `useEffect`s (prefill fetch, fetcher response, open-reset) — verifiable via `grep -c useEffect app/components/scheduler/scheduler-create-panel.tsx` ≤ 3.
- `git diff app/components/crud/create-panel.tsx` is empty.
  </done>
</task>

<task type="auto">
  <name>Task 3: Swap CreatePanel for SchedulerCreatePanel in scheduler-list-view</name>
  <files>
    app/components/ag-grid/scheduler-list-view.tsx
  </files>
  <action>
In `app/components/ag-grid/scheduler-list-view.tsx`:

1. **Remove import** at line 44: `import { CreatePanel } from '~/components/crud/create-panel';`
2. **Add import**: `import { SchedulerCreatePanel } from '~/components/scheduler/scheduler-create-panel';`
3. **Replace the JSX** at lines 588-595:

```tsx
<CreatePanel
  open={createOpen}
  onOpenChange={setCreateOpen}
  config={config}
  fkOptions={fkOptions}
  comboboxOptions={comboboxOptions}
  subModuleDisplayName={subModuleDisplayName}
/>
```

with:

```tsx
<SchedulerCreatePanel
  open={createOpen}
  onOpenChange={setCreateOpen}
  fkOptions={fkOptions}
  subModuleDisplayName={subModuleDisplayName ?? 'Scheduler'}
  accountSlug={accountSlug}
  currentWeek={currentWeek}
/>
```

`accountSlug` and `currentWeek` are already in scope (lines 289 and 303 respectively). `comboboxOptions` and `config` are no longer needed — the scheduler drawer derives task options exclusively from `fkOptions['ops_task_id']` and employee options from `fkOptions['hr_employee_id']`, both already populated by `loadFormOptions` based on the existing `opsTaskScheduleConfig.formFields`. **Do not change `ops-task-schedule.config.ts`** — its `formFields` (employee, task, datetime, datetime) is what causes `loadFormOptions` to populate the FK lists we need.

**Sanity:**
- The `+` floating button click handler (`onClick={() => setCreateOpen(true)}`) is unchanged — only the drawer that opens is swapped.
- The `(config?.formFields?.length ?? 0) > 0` guard around the button stays — it ensures the button only renders when the registry has fields configured for this submodule.

No other lines in this file change. The grid, navbar, history drawer, detail-row logic — all untouched.
  </action>
  <verify>
    <automated>pnpm typecheck && pnpm lint && grep -c "CreatePanel" app/components/ag-grid/scheduler-list-view.tsx</automated>
  </verify>
  <done>
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `grep -c "from '~/components/crud/create-panel'" app/components/ag-grid/scheduler-list-view.tsx` returns `0`.
- `grep -c "SchedulerCreatePanel" app/components/ag-grid/scheduler-list-view.tsx` returns `2` (one import, one JSX usage).
- `git diff app/components/crud/create-panel.tsx` is still empty (CRITICAL — guards the hard constraint).
- `git diff app/lib/crud/ops-task-schedule.config.ts` is empty (config unchanged; only the schema file gained a new export).
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
- New Scheduler-only weekly form drawer (7 day cards, employee selector, sticky total-hours footer).
- New batch insert action at `/api/scheduler/create-weekly`.
- Generic `CreatePanel` is byte-for-byte unchanged; every other submodule's create flow is unaffected.
  </what-built>
  <how-to-verify>
1. `pnpm dev` and sign in.
2. Navigate to the Scheduler submodule. Confirm the weekly grid loads as before (regression check).
3. Click the floating `+` button bottom-right. Expected: a drawer slides in from the right with:
   - "Create Scheduler" header
   - Employee selector (FK combobox) at the top
   - 7 day cards Sun→Sat, each pre-filled with the **dates of the currently-viewed week** (use the week navigation arrows in the navbar — change to a different week, reopen the drawer, dates should match the new week).
   - Sticky footer at the bottom with `Total: 0.00h` and a `Create 0 entries` button (disabled-looking until something is filled).
4. Pick an employee that has prior history (e.g., a worker who's been scheduled before). Expected: within ~500ms, the start/stop/task fields prefill on the days that match the worker's most recent week. Dates stay on the currently-viewed week.
5. Edit Mon/Tue/Wed: set start=07:00, stop=15:00, pick a task. The footer should now read `Total: 24.00h` and the submit button should read `Create 3 entries`.
6. Try start=15:00 stop=07:00 on one row. Expected: red border on that day card with "End must be after start"; submit blocked.
7. Submit a valid 3-day plan. Expected: toast `Created 3 entries`, drawer closes, the scheduler grid revalidates and shows those 3 days for that worker.
8. **Regression — every other submodule must still work:** open Employees → click `+` → confirm the **generic** CreatePanel (single form, no day cards) opens. Same for Tasks, Departments, etc.
9. Mobile check (devtools 360px viewport): drawer fills width, day cards stack vertically, no horizontal scroll, time inputs remain tappable.
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues (broken prefill, regression in other submodules, layout overflow, etc.).</resume-signal>
</task>

</tasks>

<verification>
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `git diff --stat app/components/crud/create-panel.tsx` is empty.
- `git diff --stat app/lib/crud/ops-task-schedule.config.ts` is empty.
- `grep -rn "CreatePanel" app/components/ag-grid/scheduler-list-view.tsx | grep -v Scheduler` returns no lines (the generic CreatePanel reference in scheduler-list-view is fully removed).
- Manual checkpoint passes (drawer opens, prefills, validates per-day, submits in batch, regression-clean across other submodules).
</verification>

<success_criteria>
1. Scheduler `+` button opens the new weekly drawer with 7 dated day cards anchored to the current `?week`.
2. Selecting an employee prefills day cards from `/api/schedule-history?mode=detail` by weekday match.
3. Sticky footer shows live-recomputed total hours from form state via `useWatch`.
4. Submit POSTs to `/api/scheduler/create-weekly` with `{ accountSlug, hr_employee_id, entries: [...] }`; the server batch-inserts one `ops_task_schedule` row per filled entry.
5. Per-day validation (date present, start<stop, task selected) runs on submit and surfaces inline.
6. `app/components/crud/create-panel.tsx` is byte-for-byte unchanged.
7. All other submodules (Employees, Tasks, etc.) continue to use the generic CreatePanel — no regression.
</success_criteria>

<output>
After completion, create `.planning/quick/260501-eus-scheduler-weekly-form/260501-eus-SUMMARY.md` documenting:
- Files created/modified (with brief purpose).
- The decision to use a dedicated `/api/scheduler/create-weekly` route vs. branching the generic `sub-module-create` action (and the rationale: keep generic CRUD path uncoupled from submodule quirks).
- Confirmation that `app/components/crud/create-panel.tsx` was not touched.
- Any prefill edge cases observed during the human-verify checkpoint (e.g., new employees with zero history, employees whose latest week straddled a Sunday boundary).
</output>
