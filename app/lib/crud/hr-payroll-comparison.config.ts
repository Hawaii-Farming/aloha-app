import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const schema = z.object({});

export const hrPayrollComparisonConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'hr_payroll',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'app_hr_payroll_by_task',
    detail: 'hr_payroll',
  },

  columns: [
    { key: 'department_name', label: 'Department', sortable: true },
    { key: 'employee_count', label: 'Employees', type: 'number' },
    { key: 'total_regular_hours', label: 'Reg Hours', type: 'number' },
    { key: 'total_overtime_hours', label: 'OT Hours', type: 'number' },
    { key: 'total_gross_wage', label: 'Gross Wage', type: 'number' },
    { key: 'total_net_pay', label: 'Net Pay', type: 'number' },
  ],

  search: {
    columns: ['department_name'],
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
