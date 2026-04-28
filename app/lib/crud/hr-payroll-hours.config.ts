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

  columns: [
    { key: 'full_name', label: 'Employee', sortable: true },
    { key: 'department_name', label: 'Department', sortable: true },
    { key: 'scheduled_hours', label: 'Scheduled Hrs', type: 'number' },
    { key: 'payroll_hours', label: 'Payroll Hrs', type: 'number' },
    { key: 'variance', label: 'Variance', type: 'number' },
  ],

  search: {
    columns: ['full_name', 'department_name'],
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
