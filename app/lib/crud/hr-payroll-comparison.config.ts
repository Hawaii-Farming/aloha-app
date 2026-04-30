import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const schema = z.object({});

export const hrPayrollComparisonConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'hr_payroll',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'hr_payroll_by_task',
    detail: 'hr_payroll',
  },

  // Backing view: hr_payroll_by_task. Employee + department display
  // fields are merged onto rows by the loader's enrichment step; the
  // view itself only exposes ids/aggregates.
  columns: [
    { key: 'hr_employee_hr_department_name', label: 'Department' },
    { key: 'employee_count', label: 'Employees', type: 'number' },
    { key: 'regular_hours', label: 'Reg Hours', type: 'number' },
    {
      key: 'discretionary_overtime_hours',
      label: 'OT Hours',
      type: 'number',
    },
    { key: 'total_hours', label: 'Total Hours', type: 'number' },
    { key: 'regular_pay', label: 'Regular Pay', type: 'number' },
    { key: 'total_cost', label: 'Total Cost', type: 'number' },
  ],

  // Search runs client-side via AgGrid quickFilterText; no PostgREST
  // search needed. Drop server-side search.columns since none of the
  // useful fields (preferred_name, dept name) live on the view.
  search: {
    columns: [],
    placeholder: 'Search payroll comparison...',
  },

  formFields: [],
  schema,

  viewType: { list: 'custom' },
  customViews: {
    list: () => import('~/components/ag-grid/payroll-comparison-list-view'),
  },
  noPagination: true,
};
