---
phase: 260430-poe
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/ag-grid/ag-grid-list-view.tsx
  - app/lib/crud/hr-employee.config.ts
  - app/lib/crud/types.ts
  - app/lib/crud/workflow-helpers.ts
  - app/components/crud/create-panel.tsx
  - app/components/crud/edit-panel.tsx
  - packages/ui/src/kit/form-fields.tsx
autonomous: false
requirements: []

must_haves:
  truths:
    - "HR Register list view has no checkbox/selection column"
    - "HR Register list shows employee profile image (or initials fallback) in the avatar column"
    - "HR detail view label reads 'OT Threshold' (no '(hrs/week)' suffix)"
    - "Drawer create form labels 'Ethnicity' (not 'Minority')"
    - "Create form pre-fills Gender=Female, DOB=1996-01-01, Pay Structure=Hourly, WC=0008, Payroll Processor=HRB, Pay Delivery=Electronic"
    - "Create form OT Threshold pre-fills 80 when Work Authorization is 1099/H1/H3/Local, else 120, and updates reactively while the user has not hand-edited it"
    - "Submitting create form without Housing when Work Authorization is anything other than 'Local' or '1099' produces a Zod validation error before the action fires"
    - "DOB date picker exposes year + month dropdowns so the user can jump to 1996 without month-by-month back-stepping"
  artifacts:
    - path: "app/components/ag-grid/ag-grid-list-view.tsx"
      provides: "AG Grid list view with no CHECKBOX_COL prepended; avatar column unchanged"
    - path: "app/lib/crud/hr-employee.config.ts"
      provides: "Updated formFields (ethnicity field, OT label, defaultValue per field, housing-conditional schema via superRefine)"
    - path: "app/lib/crud/types.ts"
      provides: "FormFieldConfig.defaultValue?: unknown"
    - path: "app/lib/crud/workflow-helpers.ts"
      provides: "buildDefaultValues honors field.defaultValue in create mode (record === null)"
    - path: "app/components/crud/create-panel.tsx"
      provides: "useWatch on hr_work_authorization_id auto-fills overtime_threshold when field is untouched (no useEffect — RHF's setValue with shouldDirty:false is OK; subscription via useWatch + getFieldState)"
    - path: "packages/ui/src/kit/form-fields.tsx"
      provides: "FormDateField passes captionLayout='dropdown', defaultMonth=1996-01-01 fallback, startMonth=1920-01-01, endMonth=today to <Calendar>"
  key_links:
    - from: "app/lib/crud/hr-employee.config.ts"
      to: "app/components/crud/form-field-grid.tsx"
      via: "formFields[].label flows to drawer form labels AND card-detail-view dt labels"
      pattern: "field\\.label"
    - from: "app/components/crud/create-panel.tsx"
      to: "app/lib/crud/hr-employee.config.ts"
      via: "useWatch(control, 'hr_work_authorization_id') + setValue('overtime_threshold', ...) when getFieldState('overtime_threshold').isDirty === false"
      pattern: "useWatch.*hr_work_authorization_id"
    - from: "app/lib/crud/hr-employee.config.ts (schema)"
      to: "create-panel + edit-panel zodResolver"
      via: ".superRefine() reads work_authorization + housing_id and adds issue on housing_id when housing required"
      pattern: "superRefine"
---

<objective>
Polish the HR Register sub-module (`/home/:account/human-resources/employees`):
1. AG Grid list view: kill the checkbox column and let the existing avatar column render Supabase profile images (already wired — falls back to initials if `profile_photo_url` is null).
2. Detail view: rename "OT Threshold (hrs/week)" → "OT Threshold".
3. Drawer create/edit form: rename "Minority" boolean → "Ethnicity" text (matching the actual `ethnicity` DB column), add per-field default values, make OT Threshold conditional on Work Authorization, make Housing conditionally required via `.superRefine()`.
4. Date picker UX: add year + month dropdowns to the existing `FormDateField` so DOB entry is fast.

Purpose: Small, locked HR Register polish before the next milestone — corrects a wrong column binding (`is_minority` → `ethnicity`), restores avatar UX (already coded but column was hidden behind the checkbox), and removes one of the long-standing form-fill papercuts.

Output: Modified existing files only — no new files, no new libraries, no DB migration.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@./UI-RULES.md
@.claude/skills/react-form-builder/SKILL.md
@app/lib/crud/hr-employee.config.ts
@app/lib/crud/types.ts
@app/lib/crud/workflow-helpers.ts
@app/lib/crud/render-form-field.tsx
@app/components/ag-grid/ag-grid-list-view.tsx
@app/components/ag-grid/cell-renderers/avatar-renderer.tsx
@app/components/crud/create-panel.tsx
@app/components/crud/edit-panel.tsx
@app/components/crud/card-detail-view.tsx
@app/components/crud/form-field-grid.tsx
@packages/ui/src/kit/form-fields.tsx
@packages/ui/src/shadcn/calendar.tsx

<interfaces>
<!-- Key types and behaviors the executor needs. Extracted from codebase. -->

DB facts (from app/lib/database.types.ts hr_employee Row):
- `ethnicity: string | null`        ← REAL column (use this)
- `gender: string | null`
- `date_of_birth: string | null`     (yyyy-MM-dd)
- `overtime_threshold: number | null`
- `pay_structure | wc | payroll_processor | pay_delivery_method | housing_id | hr_work_authorization_id`: string | null
- NOTE: there is NO `is_minority` column. The current form key `is_minority` is dead — switch to `ethnicity`.

Existing AG Grid CHECKBOX_COL block (app/components/ag-grid/ag-grid-list-view.tsx):
```ts
const CHECKBOX_COL: ColDef = { headerCheckboxSelection: true, checkboxSelection: true, ... };
const AVATAR_COL: ColDef = { headerName: '', field: 'profile_photo_url', cellRenderer: AvatarRenderer, ... };

const allColDefs = useMemo(
  () => hasCustomColDefs
    ? dataColDefs
    : [CHECKBOX_COL, ...(hasAvatar ? [AVATAR_COL] : []), ...dataColDefs],
  [...]
);
```
The CHECKBOX_COL itself is what's being removed. AVATAR_COL stays. `hasAvatar` already keys off `tableData.data[0]?.profile_photo_url !== undefined`, and since the registry select is `'*'`, that key IS in every row (value may be null — `AvatarRenderer` handles null → initials).

`AvatarRenderer` (app/components/ag-grid/cell-renderers/avatar-renderer.tsx) already renders `<img src={profile_photo_url}>` with an `onError` handler that swaps in initials if the URL fails. No changes needed there.

`buildDefaultValues` current shape (app/lib/crud/workflow-helpers.ts):
```ts
export function buildDefaultValues(
  fields: FormFieldConfig[],
  record: Record<string, unknown> | null,
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === 'boolean')      defaults[field.key] = record?.[field.key] ?? false;
    else if (field.type === 'number')  defaults[field.key] = record?.[field.key] ?? undefined;
    else                               defaults[field.key] = record?.[field.key] ?? '';
  }
  return defaults;
}
```
Extension: when `record === null` (create mode) AND `field.defaultValue !== undefined`, use `field.defaultValue` instead of the `''` / `false` / `undefined` fallback. Edit mode (record !== null) is unchanged — record values always win.

`FormDateField` current shape (packages/ui/src/kit/form-fields.tsx:173):
```tsx
<Calendar
  mode="single"
  selected={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : undefined}
  onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
  disabled={disabled}
/>
```
Calendar (packages/ui/src/shadcn/calendar.tsx) already accepts `captionLayout` (default 'label'). Setting `captionLayout="dropdown"` activates the year + month dropdowns wired via `react-day-picker`'s built-in `dropdown_root` styling — no new deps. `defaultMonth`, `startMonth`, `endMonth` are also passthrough props.

Schema-level conditional housing requirement:
```ts
const hrEmployeeSchema = z.object({ ... }).superRefine((val, ctx) => {
  const wa = val.hr_work_authorization_id;
  const requiresHousing = wa && wa !== 'Local' && wa !== '1099';
  if (requiresHousing && !val.housing_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['housing_id'],
      message: 'Housing is required for this work authorization',
    });
  }
});
```
Because the schema is shared by client (zodResolver) and server (crudCreateAction validates), this gives both client AND server enforcement.

Conditional OT default (in CreatePanel):
```tsx
const workAuthValue = useWatch({ control: form.control, name: 'hr_work_authorization_id' });
const otState = form.getFieldState('overtime_threshold', form.formState);

// Subscribe-and-react pattern WITHOUT useEffect: RHF allows setValue from render in
// rare cases — but here the cleanest no-useEffect path is to react inside an
// onChange callback wired to the Work Authorization field via a ref handler. If
// we MUST use useEffect, justify it (this IS a justified case per CLAUDE.md
// because it's reactive cross-field default sync that has no event-handler home).
useEffect(() => {
  if (otState.isDirty) return;                 // user typed — leave alone
  if (!workAuthValue) return;
  const next = ['1099', 'H1', 'H3', 'Local'].includes(workAuthValue) ? 80 : 120;
  form.setValue('overtime_threshold', next, { shouldDirty: false });
}, [workAuthValue, otState.isDirty, form]);
```
This `useEffect` IS justified per CLAUDE.md: cross-field reactive default that has no event-handler home (FK combobox onChange isn't owned by CreatePanel). Add a comment justifying the use.

`hr_work_authorization` PK note: The FK uses `fkLabelColumn: 'id'` (line 189 of hr-employee.config.ts), so the `hr_work_authorization_id` value IS the human-readable string ('1099', 'H1', 'H3', 'Local', etc.). Direct string comparison works.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Drop checkbox col + raise FormDateField UX (year/month dropdowns) + add FormFieldConfig.defaultValue</name>
  <files>
    app/components/ag-grid/ag-grid-list-view.tsx
    packages/ui/src/kit/form-fields.tsx
    app/lib/crud/types.ts
    app/lib/crud/workflow-helpers.ts
  </files>
  <action>
1. **`app/components/ag-grid/ag-grid-list-view.tsx`** — remove `CHECKBOX_COL` from `allColDefs` (and the const declaration if no longer used). Final shape:
   ```ts
   const allColDefs = useMemo(
     () => hasCustomColDefs
       ? dataColDefs
       : [...(hasAvatar ? [AVATAR_COL] : []), ...dataColDefs],
     [dataColDefs, hasAvatar, hasCustomColDefs],
   );
   ```
   Also delete the `CHECKBOX_COL` constant. Leave `BulkActions`, `selectedIds` state, and `onSelectionChanged` wiring intact (they may be re-enabled later via right-click or a different selection model — but with no checkbox UI they will simply never fire). Confirm AG Grid still mounts cleanly with no row selection column.

2. **`packages/ui/src/kit/form-fields.tsx`** — extend `FormDateField`'s `<Calendar>` props:
   ```tsx
   import { startOfDay } from 'date-fns'; // already imports format/parse from date-fns
   ...
   <Calendar
     mode="single"
     captionLayout="dropdown"
     defaultMonth={
       field.value
         ? parse(field.value, 'yyyy-MM-dd', new Date())
         : new Date(1996, 0, 1)
     }
     startMonth={new Date(1920, 0, 1)}
     endMonth={new Date()}
     selected={...}
     onSelect={...}
     disabled={disabled}
   />
   ```
   `defaultMonth={new Date(1996, 0, 1)}` is the calendar's *opened-page* anchor (NOT the form value) — so the picker pops open on Jan 1996 when the field is empty, and the user can jump months/years via the dropdowns. Importantly: do NOT change `field.value` — leaving the field empty until the user picks a date keeps Zod's `optional()` semantics intact.

3. **`app/lib/crud/types.ts`** — add an optional `defaultValue` to `FormFieldConfig`:
   ```ts
   export interface FormFieldConfig {
     ...
     /** Default value for this field in create mode. Ignored in edit mode
      *  (existing record values always win). */
     defaultValue?: unknown;
   }
   ```

4. **`app/lib/crud/workflow-helpers.ts`** — extend `buildDefaultValues` so create mode (`record === null`) honors `field.defaultValue`:
   ```ts
   for (const field of fields) {
     const recordValue = record?.[field.key];
     if (recordValue !== undefined && recordValue !== null) {
       defaults[field.key] = recordValue;
       continue;
     }
     if (record === null && field.defaultValue !== undefined) {
       defaults[field.key] = field.defaultValue;
       continue;
     }
     // existing fallback path
     if (field.type === 'boolean')     defaults[field.key] = false;
     else if (field.type === 'number') defaults[field.key] = undefined;
     else                              defaults[field.key] = '';
   }
   ```
   Keep the existing edit-mode behavior identical for non-create paths.
  </action>
  <verify>
    <automated>pnpm typecheck</automated>
  </verify>
  <done>
    `pnpm typecheck` passes. AG Grid list view in HR Register no longer renders the checkbox column. `FormDateField` accepts no API change — its consumers compile unchanged.
  </done>
</task>

<task type="auto">
  <name>Task 2: HR Register config — labels, ethnicity field, defaultValues, schema superRefine + reactive OT default in CreatePanel</name>
  <files>
    app/lib/crud/hr-employee.config.ts
    app/components/crud/create-panel.tsx
  </files>
  <action>
1. **`app/lib/crud/hr-employee.config.ts`** — schema + form fields update:

   a. Replace `is_minority: z.boolean().optional()` with `ethnicity: z.string().optional()` in the Zod schema. **Important**: do NOT keep `is_minority` — the DB column does not exist, and submitting `is_minority` would cause a write error. Trace: confirm no other code path references the `is_minority` form key (grep before deleting; this config is the only producer).

   b. Wrap the schema in `.superRefine((val, ctx) => { ... })` with the housing-required rule:
   ```ts
   const hrEmployeeSchema = z
     .object({
       // ... existing fields, with is_minority removed and ethnicity added
       ethnicity: z.string().optional(),
       housing_id: z.string().optional(),
       // ...
     })
     .superRefine((val, ctx) => {
       const wa = val.hr_work_authorization_id;
       const requiresHousing = !!wa && wa !== 'Local' && wa !== '1099';
       if (requiresHousing && !val.housing_id) {
         ctx.addIssue({
           code: z.ZodIssueCode.custom,
           path: ['housing_id'],
           message: 'Housing is required for this work authorization',
         });
       }
     });
   ```
   The exported `hrEmployeeConfig` typing currently is `CrudModuleConfig<typeof hrEmployeeSchema>` — this still works because superRefine returns a ZodEffects wrapping the same shape, and `zodResolver` accepts ZodEffects. Cast at the config site if TypeScript narrows incorrectly: `schema: hrEmployeeSchema as unknown as typeof hrEmployeeSchema` (only if the build complains; typecheck first to see).

   c. Update `formFields`:
   - Replace `{ key: 'is_minority', label: 'Minority', type: 'boolean' }` with
     `{ key: 'ethnicity', label: 'Ethnicity', type: 'combobox' }` (combobox so values come from the existing distinct-values loader — leave `comboboxSource` unset so it defaults to `hr_employee.ethnicity`).
   - Update overtime_threshold field: `{ key: 'overtime_threshold', label: 'OT Threshold', type: 'combobox' }` (drop `(hrs/week)`).
   - Add `defaultValue` per spec on these fields:
     - `gender`: `defaultValue: 'Female'`
     - `date_of_birth`: leave defaultValue OFF (let user pick via the now-friendly date picker; pre-filling DOB is awkward). The picker opens on 1996-01 by default per Task 1.
     - `pay_structure`: `defaultValue: 'Hourly'`
     - `wc`: `defaultValue: '0008'`
     - `payroll_processor`: `defaultValue: 'HRB'`
     - `pay_delivery_method`: `defaultValue: 'Electronic'`
     - `overtime_threshold`: leave OFF (the reactive OT logic in CreatePanel sets this — see below).

2. **`app/components/crud/create-panel.tsx`** — reactive OT default tied to Work Authorization.

   This is HR-specific behavior, but `CreatePanel` is a generic component. To avoid leaking HR concerns into the shared component, gate the behavior on `config?.tableName === 'hr_employee'`. Add inside `CreatePanel` body, after `form` is created:

   ```tsx
   import { useWatch } from 'react-hook-form';

   // Reactive OT default for HR Register — sets overtime_threshold based on
   // hr_work_authorization_id while the user has not manually edited the field.
   // useEffect is JUSTIFIED here per CLAUDE.md: cross-field reactive default
   // with no natural event-handler owner (FkCombobox onChange isn't routed
   // through this component).
   const workAuthValue = useWatch({
     control: form.control,
     name: 'hr_work_authorization_id',
   });

   useEffect(() => {
     if (config?.tableName !== 'hr_employee') return;
     const otState = form.getFieldState('overtime_threshold', form.formState);
     if (otState.isDirty) return;
     if (!workAuthValue || typeof workAuthValue !== 'string') return;
     const next = ['1099', 'H1', 'H3', 'Local'].includes(workAuthValue) ? 80 : 120;
     form.setValue('overtime_threshold', String(next), { shouldDirty: false });
   }, [workAuthValue, config?.tableName, form]);
   ```

   Notes:
   - Stored as `String(next)` because `overtime_threshold` field is `combobox` (string-typed in the schema's `z.union([z.string(), z.number()])`).
   - `shouldDirty: false` ensures subsequent WA changes keep auto-updating until the user types directly into OT Threshold.
   - Keep the existing two `useEffect`s untouched.

3. **Sanity check**: do NOT modify `EditPanel`. The reactive OT default is create-only (per spec). The schema's housing superRefine WILL apply on edit too — that's fine; if a record is edited without housing despite a housing-requiring WA, the user gets a Zod error in the edit drawer (this is correct behavior, not a regression).
  </action>
  <verify>
    <automated>pnpm typecheck && pnpm lint -- --max-warnings 0 app/lib/crud/hr-employee.config.ts app/components/crud/create-panel.tsx</automated>
  </verify>
  <done>
    Typecheck + lint clean. `is_minority` no longer appears anywhere. `superRefine` enforces housing_id when WA is not Local/1099. `defaultValue` populated for the 5 listed fields. CreatePanel auto-fills overtime_threshold reactively from hr_work_authorization_id only when the user hasn't typed in OT.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Manual verification in dev</name>
  <what-built>
    1. HR Register list (/home/{account}/human-resources/employees): no checkbox column, avatar column shows images for employees with profile_photo_url and initials otherwise.
    2. Click any row → detail view: "OT Threshold" label (no "(hrs/week)").
    3. Floating "+" → drawer create form:
       - "Ethnicity" label (was "Minority"), now a combobox of existing ethnicity values.
       - Gender pre-selected as Female.
       - Pay Structure pre-selected as Hourly.
       - WC Code pre-filled with 0008.
       - Payroll Processor pre-filled with HRB.
       - Pay Check Delivery pre-filled with Electronic.
       - DOB picker opens on 1996, with year + month dropdowns.
       - Pick Work Authorization = 1099 or H1 or H3 or Local → OT Threshold becomes 80.
       - Pick Work Authorization = anything else (e.g. GH) → OT Threshold becomes 120.
       - Once you manually type a different OT value, changing WA must NOT clobber it.
       - With WA = GH (or any non-Local/non-1099) and Housing left blank → Save → Zod error "Housing is required for this work authorization" appears under Housing field; action does not fire.
       - With WA = Local and Housing blank → Save proceeds (housing optional).
  </what-built>
  <how-to-verify>
    1. `pnpm dev`, sign in, navigate to Human Resources → Register.
    2. Visually confirm: no checkbox column at the leftmost edge; avatar column visible (images where present, circular initial chips otherwise).
    3. Click a row with OT data → in the opened detail view, locate the OT Threshold field — it must read "OT Threshold" exactly.
    4. Click the floating "+" in the bottom-right.
    5. Confirm pre-filled defaults match the list above.
    6. Click DOB → calendar opens on January 1996, with month + year dropdowns at the top.
    7. Cycle Work Authorization through 1099, H1, H3, Local, then GH/H2A/etc — OT Threshold updates to 80/80/80/80/120 in that order, as long as you have not typed in OT.
    8. Type "150" into OT, then change WA — confirm OT stays at 150.
    9. Set WA = GH, leave Housing blank, click Create — must show validation error and stay open.
    10. Change WA = Local, leave Housing blank, click Create with all required fields — must succeed.
    11. Reload list — verify the new employee appears with the persisted defaults.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issue.</resume-signal>
</task>

</tasks>

<verification>
- `pnpm typecheck` passes.
- `pnpm lint` clean for touched files.
- Manual smoke: all 11 verification steps in Task 3 pass.
- No new files created; no new dependencies; no migration files.
</verification>

<success_criteria>
- HR Register list view has no checkbox column.
- Avatar column renders images when `profile_photo_url` is present and falls back to initials otherwise (already wired).
- Detail-view OT Threshold label has no "(hrs/week)" suffix.
- Drawer create/edit form labels match spec (Ethnicity, OT Threshold).
- All 7 default values land per spec (5 static + 2 reactive: OT default + DOB picker view-anchor).
- Housing-required-when-WA-is-not-Local/1099 rule enforces at form submit time via Zod superRefine.
- DOB picker exposes year + month dropdowns and opens on 1996 by default.
- `is_minority` removed from form schema (it was binding to a non-existent DB column).
</success_criteria>

<output>
After completion, create `.planning/quick/260430-poe-hr-register-module-aggrid-tweaks-form-de/260430-poe-SUMMARY.md` per the standard summary template.
</output>
