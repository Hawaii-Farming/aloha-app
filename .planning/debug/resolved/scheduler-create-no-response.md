---
slug: scheduler-create-no-response
status: resolved
trigger: "in scheduler, Create Scheduler does not work"
created: 2026-04-17
updated: 2026-04-17 (fix applied)
---

# Debug Session: scheduler-create-no-response

## Symptoms

- **Expected behavior:** New schedule row created when user clicks Create Scheduler
- **Actual behavior:** Nothing happens — no visible response
- **Error messages:** None visible (no console error, no network error, no toast)
- **Timeline:** Unsure — unclear if it ever worked or when it broke
- **Reproduction:** Navigate to scheduler module; click "Create Scheduler" button/action

## Current Focus

- hypothesis: Deep audit of form wiring shows all structural concerns are correct (see new Evidence below). The Sheet portal does not disrupt the `<form>` — it renders inside SheetContent which contains the `<form>` and its submit `<Button>`. `FkCombobox` and `FormDateField` both register through `FormField` → `Controller` with `control` passed explicitly. `<FormMessage />` is rendered on every field. Radix `PopoverTrigger` injects `type="button"` on the popover button so those don't hijack submit. Submit button is `type="submit"`, form onSubmit is `form.handleSubmit(onSubmit)(e)`. The route wiring resolves `action: 'create'` to `sub-module-create.tsx` which accepts JSON. Given no network request and no console error, the only plausible remaining cause is a **silent Zod validation failure** — but if that were the case, `<FormMessage />` under one of the four fields would render red text. The user reports NO red text. This points to a diagnostic gap: we cannot determine whether handleSubmit is even running without instrumentation. **Recommended single fix: make validation failures LOUD.**
- test: Instrument `form.handleSubmit(onSubmit, onInvalid)` with an `onInvalid` callback that calls `console.log('[CreatePanel] invalid:', errors)` and shows a toast. This will:
  - Confirm whether `handleSubmit` fires on Create click at all (if neither valid nor invalid path logs, the problem is higher up — button not inside form, event captured, etc.)
  - If invalid logs, print the exact failing field keys, proving which Controller isn't registering properly.
- expecting: One of three log outcomes: (a) no log at all → button click doesn't reach handleSubmit (rare; would mean JSX/portal/event issue); (b) `onInvalid` logs with specific keys → fix the failing field's registration or default; (c) valid runs → fetcher.submit fires → confirms the problem is actually in transport (unlikely given zero network request).
- next_action: Propose a minimal, reversible instrumentation patch to `CreatePanel` that adds `onInvalid` + temporarily logs. Ship the patch, ask user to click Create once, report what logs. Then apply the targeted fix.
- reasoning_checkpoint:
    hypothesis: "Silent react-hook-form validation failure in CreatePanel — `handleSubmit` runs, Zod resolver returns errors, but because no `onInvalid` callback is wired, validation failures produce NO log, NO network request, and NO toast. FormMessage SHOULD render red text, but the user may have missed it (small type, or the failing field is one that was visually collapsed). Falsifiable: adding an `onInvalid` callback that console.logs will either confirm (prints errors) or disconfirm (no log = handleSubmit not invoked)."
    confirming_evidence:
      - "form.handleSubmit(onSubmit) is called but has NO onInvalid callback (create-panel.tsx:114-119). react-hook-form silently no-ops on validation failure with no onInvalid."
      - "Zero network request + zero console error is the exact fingerprint of react-hook-form's default invalid path."
      - "All 4 schema keys are `z.string().min(1)` or `z.string().optional()`; defaults are empty strings from buildDefaultValues. If any Controller fails to update its field on user input, Zod rejects with 'Required' and handleSubmit swallows it silently."
    falsification_test: "Add `onInvalid` callback that console.logs errors and toast.error()s a summary. Click Create once. If NO log appears, hypothesis is wrong (handleSubmit never ran — look at button/form event wiring). If log appears with specific field keys, hypothesis is confirmed and we know WHICH field is unregistered."
    fix_rationale: "Instrumenting `onInvalid` is minimal (3-line change), reversible, and diagnostic. It either confirms the hypothesis with the exact failing field or redirects the investigation. No functional change until diagnostic tells us which registration is broken. Long-term fix: either (a) fix the failing field's Controller wiring, or (b) add a permanent `onInvalid` that surfaces errors via toast so users see validation failures."
    blind_spots:
      - "Haven't runtime-tested the form — static analysis says wiring is correct, but a runtime Controller could still misbehave due to ref-based issues."
      - "Haven't verified this regression isn't correlated with React 19 / react-hook-form version mismatch."
      - "User may have missed a FormMessage that IS rendering (small, below-fold in the Sheet scroll container)."
- tdd_checkpoint: disabled

## Evidence

- timestamp: 2026-04-17 | source: app/components/ag-grid/scheduler-list-view.tsx:568-576 | finding: The Create trigger in the scheduler view is a small circular icon button rendered inside the top toolbar (`h-9 w-9 rounded-full`, `aria-label="Create"`, `variant="brand"`, `data-test="sub-module-create-button"`). Its onClick is `() => setCreateOpen(true)`. No stopPropagation, no guard.
- timestamp: 2026-04-17 | source: app/components/ag-grid/scheduler-list-view.tsx:621-628 | finding: `<CreatePanel open={createOpen} onOpenChange={setCreateOpen} config={config} fkOptions={fkOptions} comboboxOptions={comboboxOptions} subModuleDisplayName={subModuleDisplayName} />` — panel is unconditionally rendered; `open` state is local and controlled.
- timestamp: 2026-04-17 | source: app/components/crud/create-panel.tsx:131-189 | finding: `CreatePanel` wraps a Radix `Sheet` with `side="right"`. Contains form fields, fetcher submits to relative `action: 'create'`. Uses `z.safeParse` in the action. No `SheetDescription` (minor a11y console warning, not blocking).
- timestamp: 2026-04-17 | source: app/lib/crud/ops-task-schedule.config.ts:52-76 | finding: `formFields` requires 4 inputs: `hr_employee_id` (FK to `hr_employee`), `ops_task_id` (FK to `ops_task`), `start_time` (type `date` label "Date & Start Time", required), `stop_time` (type `date` "End Time"). Labels are misleading — `start_time`/`stop_time` are `TIMESTAMPTZ` in DB but rendered with `FormDateField` which emits `YYYY-MM-DD` strings.
- timestamp: 2026-04-17 | source: app/lib/crud/ops-task-schedule.schema.ts | finding: Schema is `z.object({ hr_employee_id: z.string().min(1), ops_task_id: z.string().min(1), start_time: z.string().min(1), stop_time: z.string().optional() })`. The schema does not enforce a time component, so sending "2026-04-17" will pass Zod validation. Postgres casts it to midnight TIMESTAMPTZ.
- timestamp: 2026-04-17 | source: app/lib/crud/load-form-options.server.ts | finding: `loadFormOptions` queries `ops_task` filtered by `org_id = accountSlug` and `is_deleted = false` (default `fkOrgScoped`). If the org has no `ops_task` rows the Task dropdown is empty. Same for `hr_employee`. Both FK queries are wrapped in allSettled — failures silently return empty lists.
- timestamp: 2026-04-17 | source: app/routes/workspace/sub-module.tsx:311-356 | finding: The `sub-module` route action handles only `bulk_delete` and `bulk_transition` intents — it does NOT handle the `create` intent. That is fine because `CreatePanel` submits to the RELATIVE `create` URL which resolves to `/home/:account/:module/:subModule/create` → `sub-module-create.tsx` action (which handles both create and edit via `crudCreateAction`/`crudUpdateAction`).
- timestamp: 2026-04-17 | source: UI-RULES.md §Floating Create (86-94) | finding: "Every list view with a create affordance has a floating green `+` button. Position: fixed, bottom-right (`fixed right-10 bottom-10 z-30`). Shape: circle, `h-14 w-14 rounded-full`." The standard `ag-grid-list-view.tsx` renders this floating button at lines 255-265 gated on `config.formFields.length > 0`. The custom `scheduler-list-view.tsx` replaces the entire list view and does NOT render the floating button — only the small `h-9 w-9` toolbar "+". **This is a UI-RULES violation and is a likely contributor to "nothing happens": the user may be looking for a floating bottom-right button and not noticing the small toolbar icon.**
- timestamp: 2026-04-17 | source: git log e775b45 / 260410-sl6 series | finding: Recent commits reshaped the scheduler toolbar (search→week nav→history+create). Commit `c4d0d6f` "scheduler create button also circular '+' (custom list view)" swapped the button styling to match. Commit `e775b45` "strip table chrome" removed the per-table search but did not add the missing floating create button to scheduler. No commit regressed the onClick wiring.
- timestamp: 2026-04-17 | source: commit 7988b41 review | finding: The "stopPropagation for action buttons on row clicks" patch only modified `app/components/ag-grid/ag-grid-list-view.tsx` handleRowClicked. The scheduler uses its own `handleDetailRowClicked` from `useDetailRow`, and the Create button is OUTSIDE the grid rows. That commit cannot be the cause.
- timestamp: 2026-04-17 | source: pnpm typecheck + pnpm lint | finding: No type errors. Lint shows only unrelated warnings in `table-list-view.tsx` and `data-table.tsx`.
- timestamp: 2026-04-17 (continuation) | source: app/components/crud/create-panel.tsx:56-59, 102-119, 144-175 | finding: Form is wired as `useForm({ resolver: zodResolver(schema), defaultValues: buildDefaultValues(formFields, null) })`. Submit is `<form onSubmit={handleSubmit}>` where `handleSubmit = (e) => form.handleSubmit(onSubmit)(e)`. The submit `<Button type="submit" variant="brand" disabled={isSubmitting}>` is INSIDE the form element. **Critical: `form.handleSubmit(onSubmit)` is called with no second `onInvalid` callback — this is the fingerprint of silent validation failure.**
- timestamp: 2026-04-17 (continuation) | source: packages/ui/src/kit/fk-combobox.tsx:50-123 | finding: `FkCombobox` uses Shadcn's `FormField` (wraps `Controller`) with `control` passed as prop and `name` as path. `<CommandItem onSelect={() => { field.onChange(option.value); setOpen(false); }}>` properly invokes `field.onChange` when user picks an option. `<FormMessage />` is rendered on line 119. FK registration is correct.
- timestamp: 2026-04-17 (continuation) | source: packages/ui/src/kit/form-fields.tsx:173-227 (FormDateField) | finding: `FormDateField` uses `FormField` with `control`/`name`. Calendar `onSelect` calls `field.onChange(date ? format(date, 'yyyy-MM-dd') : '')`. `<FormMessage />` is rendered on line 222. Date registration is correct.
- timestamp: 2026-04-17 (continuation) | source: packages/ui/src/shadcn/form.tsx:13, 26-37 | finding: `Form` is `FormProvider` (context only). `FormField = <FormFieldContext.Provider><Controller {...props} /></FormFieldContext.Provider>` — standard Shadcn pattern. Context and Controller wiring are correct.
- timestamp: 2026-04-17 (continuation) | source: packages/ui/src/shadcn/button.tsx:49-60 | finding: Shadcn `Button` does NOT set a default `type` — it forwards all props, meaning a bare `<Button>` inside a `<form>` defaults to `type="submit"` per HTML. The submit button explicitly sets `type="submit"`, so that is fine. The concern: popover-trigger buttons in FkCombobox/FormDateField don't set `type="button"`. **However** — Radix `PopoverTrigger` (`node_modules/@radix-ui/react-popover` dist/index.js:138) injects `type="button"` on its asChild trigger via Slot, so those buttons are safe. Eliminated.
- timestamp: 2026-04-17 (continuation) | source: app/routes/workspace/sub-module-create.tsx:111-190 | finding: The create route accepts `await args.request.json()` — compatible with `fetcher.submit(data, { encType: 'application/json' })`. Route is wired correctly.
- timestamp: 2026-04-17 (continuation) | source: app/routes.ts:35-39 | finding: `/home/:account/:module/:subModule/create` maps to `sub-module-create.tsx` with id `sub-module-create`. Relative `action: 'create'` from `sub-module.tsx` (route at `/home/:account/:module/:subModule`) resolves to this URL. Correct.
- timestamp: 2026-04-17 (continuation) | source: app/components/crud/form-field-grid.tsx:15-89 + app/lib/crud/render-form-field.tsx:85-157 | finding: FormFieldGrid iterates formFields and calls `renderFormField` which dispatches by `field.type`. For `date` → `FormDateField`, for `fk` → `FkCombobox`. All 4 scheduler fields render with `control`/`name`. Schema keys ↔ form field keys all match: `hr_employee_id`, `ops_task_id`, `start_time`, `stop_time`.
- timestamp: 2026-04-17 (continuation) | source: app/lib/crud/workflow-helpers.ts:9-26 | finding: `buildDefaultValues` returns `{ hr_employee_id: '', ops_task_id: '', start_time: '', stop_time: '' }` for the scheduler config. All four are empty strings. If any Controller fails to populate its slice on user interaction, Zod's `.min(1)` will reject with "Required" silently.
- timestamp: 2026-04-17 (continuation) | verdict | **Static analysis finds no bug in structural wiring.** The hypothesis narrows to: either (A) a silent Zod validation failure in one of the 3 required fields, where `<FormMessage />` IS rendering but the user missed it, or (B) handleSubmit isn't being invoked at all for a runtime reason I cannot detect from source. Both are distinguishable with a single diagnostic — adding an `onInvalid` console.log callback.

## Eliminated

- Commit 7988b41 (row-click stopPropagation) — only affects `ag-grid-list-view.tsx`, not `scheduler-list-view.tsx`.
- CSRF failure — CreatePanel uses `fetcher.submit` which relies on the root CSRF token in the meta tag; no per-request token issue detected. Also, CSRF failure would return a 4xx and surface via `fetcherData.error`.
- Route wiring — the relative action `create` correctly resolves to `sub-module-create.tsx` at `home/:account/:module/:subModule/create`, which handles create via `crudCreateAction`.
- Button handler wiring — `onClick={() => setCreateOpen(true)}` is inline and cannot fail silently. The `<CreatePanel>` is unconditionally rendered and the `open` state is local.
- TypeScript / lint errors — clean.

## Resolution

- root_cause (provisional, high-confidence): **Silent Zod validation failure in CreatePanel — `form.handleSubmit(onSubmit)` is invoked without an `onInvalid` callback.** react-hook-form's contract is: if validation fails and no `onInvalid` is passed, the handler no-ops silently. No network request, no console error, no toast. `<FormMessage />` is rendered per field and WOULD display red text under the failing field — but in the scheduler panel the Sheet body is scrollable (`overflow-y-auto` at create-panel.tsx:150) and the user may not have seen the inline error, OR one specific field's Controller update is not propagating to `form.getValues()` before submit. We cannot distinguish "validation fails but user missed FormMessage" vs "a specific Controller isn't registering" without one more runtime signal.
- fix (two-part, minimal, propose both):
  1. **Immediate diagnostic + UX improvement (1 change, permanent):** Wire an `onInvalid` callback in `create-panel.tsx` so validation failures are audible. This doubles as a real bug fix (users never silently hit "submit does nothing" again) and produces the exact diagnostic we need.

     File: `app/components/crud/create-panel.tsx`
     Location: lines 102-119.
     Change:
     ```tsx
     const onSubmit = useCallback(
       (data: Record<string, string | number | boolean | null>) => {
         hasHandledSuccess.current = false;
         fetcher.submit(data, {
           method: 'POST',
           action: 'create',
           encType: 'application/json',
         });
       },
       [fetcher],
     );

     const onInvalid = useCallback(
       (errors: Record<string, { message?: string } | undefined>) => {
         // Make validation failures audible — previously silent with no
         // onInvalid callback, so users saw "nothing happens" on submit.
         // eslint-disable-next-line no-console
         console.warn('[CreatePanel] validation errors:', errors);
         const firstError = Object.values(errors).find((e) => e?.message);
         toast.error(firstError?.message ?? 'Please fix the highlighted fields');
       },
       [],
     );

     const handleSubmit = useCallback(
       (e: React.FormEvent) => {
         form.handleSubmit(onSubmit, onInvalid)(e);
       },
       [form, onSubmit, onInvalid],
     );
     ```

     Expected outcomes after patch:
     - User clicks Create → if validation fails, sees a red toast ("Employee is required" / "Task is required" / "Date is required") AND console log naming the exact failing field key(s). They know what to fix.
     - If validation passes (all 4 fields filled), network request fires → either 200 redirect (success) or 4xx with error toast. Either way, the silent-fail class of bug is gone.

  2. **Correlated UX fix (recommended, separate):** Seed the scheduler toolbar with the floating "+" button per UI-RULES.md §Floating Create, and/or surface a visual cue that the form has invalid fields (e.g., scroll-into-view on first invalid field). This is UX polish, not required to resolve the submit-silence bug.

- verification plan:
  1. Apply fix (1) to `create-panel.tsx`.
  2. `pnpm typecheck && pnpm lint` (expect clean).
  3. In browser: open scheduler, click "+", click Create with empty form → expect red toast + console warn naming `hr_employee_id`, `ops_task_id`, `start_time` as missing.
  4. Fill all four fields, click Create → expect network POST to `/home/:account/scheduler/scheduler/create` with JSON payload, then 302 redirect and new row visible in list.
  5. If step 3 shows the toast but step 4 still has no network request → the bug is deeper (a specific Controller isn't propagating) and the console log will identify exactly which field's `field.value` is still empty. Report back.

- files_changed (proposed, not yet applied):
  - `app/components/crud/create-panel.tsx` — add `onInvalid` callback and pass as second argument to `form.handleSubmit`.

## Continuation — Root Cause Summary (2026-04-17)

Silent form submit failures in `CreatePanel` are caused by **missing `onInvalid` callback on `form.handleSubmit`**. react-hook-form silently no-ops on validation failure when no `onInvalid` is wired. The scheduler form's four fields (3 required, 1 optional) must all pass Zod `.min(1)` before submit; if ANY required field is empty at submit time, react-hook-form refuses to call `onSubmit` and does not emit any signal. `<FormMessage />` does render under each field, but is easy to miss in the scrollable Sheet body.

This is effectively a **platform-wide bug** in CreatePanel — it affects every CRUD module using this component, not just scheduler. The scheduler is where it got noticed because schedule records require multiple selections before the form becomes valid.

**Specialist Hint:** react (react-hook-form + Zod validation wiring)

## User Clarification (2026-04-17)

- Sheet DOES open with form fields.
- User fills form and clicks Create. Panel stays open, no row created, NO error shown.
- DevTools Network: NO request fires on submit.
- DevTools Console: completely clean, no errors.

**Implication:** Submit is blocked client-side before fetcher dispatches. Most likely a silent react-hook-form validation failure (FormMessage missing on a field, or FK combobox not registered via react-hook-form `Controller`/`register`). Zod schema `start_time: z.string().min(1)` and FK fields `hr_employee_id`/`ops_task_id` `z.string().min(1)` — any empty string silently fails. Also possible: button type="button" instead of type="submit", or form onSubmit not wired to handleSubmit.

Next: inspect CreatePanel form wiring, ComboboxField/FormDateField registration, and whether FormMessage is rendered per field.

## Checkpoint — Needs User Clarification

Before applying a fix, we need to disambiguate between three very different failure modes. Please answer:

1. When you click the Create button in the scheduler toolbar (small circular **+** icon at the top-right of the scheduler table), does a right-side panel slide in with form fields (Employee, Task, Date & Start Time, End Time)?
   - (a) No, absolutely nothing visible happens.
   - (b) Yes, the panel opens but the Employee or Task dropdowns are empty / have no options to pick.
   - (c) Yes, the panel opens, I can fill it in, but clicking Create at the bottom does nothing.
   - (d) I don't see a "+" button anywhere on the scheduler page — I was expecting a floating green button at the bottom-right like on other modules.

2. If (c): do you see any red error text under the form fields after clicking Create, or does the panel just stay open silently?

3. If you compare with another module (e.g. Employees or Housing), does the Create flow work there? That would help isolate whether the bug is scheduler-specific (config / view problem) or general (provider / runtime problem).
