import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const schema = z.object({});

export const hrPayrollComparisonConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'hr_payroll',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    // The actual list source is chosen by the loader based on ?view=
    // (hr_payroll_task_comparison vs hr_payroll_employee_comparison).
    // This default is used only as a fallback for code paths that read
    // config.views.list directly.
    list: 'hr_payroll_task_comparison',
    detail: 'hr_payroll',
  },

  // The custom list view (payroll-comparison-list-view.tsx) defines its
  // own ColDefs per ?view= and ignores this columns array. Kept as a
  // minimal placeholder for the CrudModuleConfig contract.
  columns: [
    { key: 'task', label: 'Task' },
    { key: 'total_hours', label: 'Total Hours', type: 'number' },
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
