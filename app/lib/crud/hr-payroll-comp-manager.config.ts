import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const schema = z.object({});

export const hrPayrollCompManagerConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'hr_payroll',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'hr_payroll_employee_comparison',
    detail: 'hr_payroll',
  },

  // Backing view: hr_payroll_employee_comparison. Employee name +
  // department come from the loader's hr_employee enrichment step.
  columns: [
    { key: 'hr_employee_preferred_name', label: 'Employee' },
    { key: 'hr_employee_hr_department_id', label: 'Department' },
    { key: 'check_date', label: 'Check Date', type: 'date' },
    { key: 'total_hours', label: 'Total Hours', type: 'number' },
    { key: 'hours_delta', label: 'Hours Δ', type: 'number' },
    { key: 'regular_pay', label: 'Regular Pay', type: 'number' },
    { key: 'regular_pay_delta', label: 'Reg Pay Δ', type: 'number' },
    { key: 'total_cost', label: 'Total Cost', type: 'number' },
    { key: 'total_cost_delta', label: 'Cost Δ', type: 'number' },
  ],

  // Search runs client-side via AgGrid quickFilterText.
  search: {
    columns: [],
    placeholder: 'Search by employee...',
  },

  formFields: [],
  schema,

  viewType: { list: 'custom' },
  customViews: {
    list: () => import('~/components/ag-grid/payroll-comp-manager-list-view'),
  },
  noPagination: true,
};
