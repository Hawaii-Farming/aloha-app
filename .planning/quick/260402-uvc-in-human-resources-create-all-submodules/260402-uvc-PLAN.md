---
type: quick
tasks: 2
autonomous: true
files_modified:
  - app/lib/crud/hr-employee.config.ts
  - app/lib/crud/hr-time-off.config.ts
  - app/lib/crud/hr-payroll.config.ts
  - app/lib/crud/registry.ts
---

<objective>
Create CRUD config files for the three remaining HR submodules (employees, time_off, payroll) and register them so the generic sub-module routes render list/detail/create views for each.

Purpose: departments already works end-to-end via the CRUD registry pattern. The other three HR submodules are seeded in sys_sub_module/org_sub_module and appear in the sidebar, but clicking them fails because there is no CrudModuleConfig registered. This task fills that gap.

Output: Three new config files + registry wired, all four HR submodules functional.
</objective>

<context>
@app/lib/crud/types.ts
@app/lib/crud/hr-department.config.ts
@app/lib/crud/invnt-item.config.ts
@app/lib/crud/registry.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create CRUD configs for employees, time_off, and payroll</name>
  <files>
    app/lib/crud/hr-employee.config.ts
    app/lib/crud/hr-time-off.config.ts
    app/lib/crud/hr-payroll.config.ts
  </files>
  <action>
    Create three config files following the exact pattern of hr-department.config.ts (import z, import CrudModuleConfig type, define Zod schema, export typed config object).

    **hr-employee.config.ts** (table: hr_employee, pkType: text, pkColumn: id, orgScoped: true):
    - Zod schema fields: id (string, required), first_name (string, required), last_name (string, required), email (string, optional), phone (string, optional), start_date (string, optional), hr_department_id (string, optional), hr_title_id (string, optional), sys_access_level_id (string, required)
    - List columns: id (sortable), first_name (sortable, label "First Name"), last_name (sortable, label "Last Name"), email, phone, start_date (type: date, sortable, label "Start Date"), created_at (type: datetime, sortable, label "Created")
    - Search: columns ['first_name', 'last_name', 'email'], placeholder "Search employees..."
    - Filters: empty array
    - Form fields:
      - id: text, required, showOnCreate: true, showOnEdit: false, label "Employee ID"
      - first_name: text, required, label "First Name"
      - last_name: text, required, label "Last Name"
      - email: text, label "Email"
      - phone: text, label "Phone"
      - start_date: date, label "Start Date"
      - hr_department_id: fk, fkTable "hr_department", fkLabelColumn "name", label "Department"
      - sys_access_level_id: fk, fkTable "sys_access_level", fkLabelColumn "name", label "Access Level", required

    **hr-time-off.config.ts** (table: hr_time_off_request, pkType: uuid, pkColumn: id, orgScoped: true):
    - Zod schema fields: hr_employee_id (string, required), start_date (string, required), return_date (string, optional), pto_days (number, optional), sick_leave_days (number, optional), non_pto_days (number, optional), request_reason (string, optional), notes (string, optional), status (string, optional)
    - List columns: hr_employee_id (sortable, label "Employee"), start_date (type: date, sortable, label "Start Date"), return_date (type: date, label "Return Date"), pto_days (type: number, label "PTO Days"), sick_leave_days (type: number, label "Sick Days"), status (type: workflow, sortable)
    - Workflow config on "status" column:
      - States: pending (label "Pending", color "warning"), approved (label "Approved", color "success"), denied (label "Denied", color "destructive"), cancelled (label "Cancelled", color "secondary")
      - Transitions: pending -> [approved, denied, cancelled], approved -> [cancelled], denied -> [pending]
    - Search: columns ['request_reason', 'notes'], placeholder "Search time-off requests..."
    - Filters: [{ key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'denied', 'cancelled'] }]
    - Form fields:
      - hr_employee_id: fk, fkTable "hr_employee", fkLabelColumn "first_name", label "Employee", required
      - start_date: date, required, label "Start Date"
      - return_date: date, label "Return Date"
      - pto_days: number, label "PTO Days"
      - sick_leave_days: number, label "Sick Leave Days"
      - non_pto_days: number, label "Non-PTO Days"
      - request_reason: textarea, label "Reason"
      - notes: textarea, label "Notes"

    **hr-payroll.config.ts** (table: hr_payroll, pkType: uuid, pkColumn: id, orgScoped: true):
    - Zod schema fields: hr_employee_id (string, required), employee_name (string, required), payroll_id (string, required), payroll_processor (string, required), check_date (string, required), pay_period_start (string, required), pay_period_end (string, required), regular_hours (number, default 0), overtime_hours (number, default 0), gross_wage (number, default 0), net_pay (number, default 0)
    - List columns: employee_name (sortable, label "Employee"), payroll_id (sortable, label "Payroll ID"), check_date (type: date, sortable, label "Check Date"), pay_period_start (type: date, label "Period Start"), pay_period_end (type: date, label "Period End"), regular_hours (type: number, label "Reg Hours"), overtime_hours (type: number, label "OT Hours"), gross_wage (type: number, sortable, label "Gross"), net_pay (type: number, sortable, label "Net Pay")
    - Search: columns ['employee_name', 'payroll_id'], placeholder "Search payroll records..."
    - Filters: empty array
    - Form fields:
      - hr_employee_id: fk, fkTable "hr_employee", fkLabelColumn "first_name", label "Employee", required
      - employee_name: text, required, label "Employee Name"
      - payroll_id: text, required, label "Payroll ID"
      - payroll_processor: text, required, label "Payroll Processor"
      - check_date: date, required, label "Check Date"
      - pay_period_start: date, required, label "Period Start"
      - pay_period_end: date, required, label "Period End"
      - regular_hours: number, label "Regular Hours"
      - overtime_hours: number, label "Overtime Hours"
      - gross_wage: number, label "Gross Wage"
      - net_pay: number, label "Net Pay"
  </action>
  <verify>
    <automated>cd /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app && pnpm typecheck</automated>
  </verify>
  <done>Three config files exist, export typed CrudModuleConfig objects, and pass typecheck.</done>
</task>

<task type="auto">
  <name>Task 2: Register all three configs in the CRUD registry</name>
  <files>app/lib/crud/registry.ts</files>
  <action>
    Import the three new configs at the top of registry.ts:
    - import { hrEmployeeConfig } from './hr-employee.config';
    - import { hrTimeOffConfig } from './hr-time-off.config';
    - import { hrPayrollConfig } from './hr-payroll.config';

    Add three entries to the registry Map (matching the sys_sub_module slug used in URLs):
    - ['employees', hrEmployeeConfig]
    - ['time_off', hrTimeOffConfig]
    - ['payroll', hrPayrollConfig]

    Keep existing entries (departments, products) in place. Order: departments, employees, time_off, payroll, products.
  </action>
  <verify>
    <automated>cd /Users/jmr/GitHub/JJB/HawaiiFarming/aloha-app && pnpm typecheck && pnpm lint:fix && pnpm format:fix</automated>
  </verify>
  <done>Registry exports all five configs. Navigating to any HR submodule in the app loads the correct list/detail/create views without errors.</done>
</task>

</tasks>

<verification>
1. `pnpm typecheck` passes with no errors
2. `pnpm lint:fix` and `pnpm format:fix` complete cleanly
3. Navigate to each HR submodule in browser — employees, departments, time_off, payroll — all render list views with correct columns
</verification>

<success_criteria>
All four HR submodules (employees, departments, time_off, payroll) are functional in the CRUD framework — sidebar links load list views, detail views, and create forms without errors.
</success_criteria>
