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

  columns: [
    { key: 'full_name', label: 'Employee', sortable: true },
    { key: 'department_name', label: 'Department', sortable: true },
    { key: 'check_date', label: 'Check Date', type: 'date' },
    { key: 'regular_hours', label: 'Reg Hours', type: 'number' },
    { key: 'overtime_hours', label: 'OT Hours', type: 'number' },
    { key: 'gross_wage', label: 'Gross Wage', type: 'number' },
    { key: 'net_pay', label: 'Net Pay', type: 'number' },
  ],

  search: {
    columns: ['full_name', 'department_name'],
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
