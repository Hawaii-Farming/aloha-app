import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const schema = z.object({});

export const hrPayrollHoursConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'hr_payroll',
  pkType: 'uuid',
  pkColumn: 'hr_employee_id',
  orgScoped: true,

  views: {
    list: 'hr_payroll_employee_comparison',
    detail: 'hr_payroll',
  },

  // Backing view: hr_payroll_employee_comparison. Employee + dept come
  // from the loader's hr_employee enrichment; payroll hours map to
  // total_hours; variance is computed client-side.
  columns: [
    { key: 'hr_employee_preferred_name', label: 'Employee' },
    { key: 'hr_employee_hr_department_id', label: 'Department' },
    { key: 'scheduled_hours', label: 'Scheduled Hrs', type: 'number' },
    { key: 'total_hours', label: 'Payroll Hrs', type: 'number' },
  ],

  // Search runs client-side via AgGrid quickFilterText.
  search: {
    columns: [],
    placeholder: 'Search employees...',
  },

  formFields: [],
  schema,

  viewType: { list: 'custom' },
  customViews: {
    list: () => import('~/components/ag-grid/payroll-hours-list-view'),
  },
  noPagination: true,
};
