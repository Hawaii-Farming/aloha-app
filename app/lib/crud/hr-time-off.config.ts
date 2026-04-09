import { z } from 'zod';

import { SchedulerEmployeeRenderer } from '~/components/ag-grid/cell-renderers/scheduler-employee-renderer';
import { StatusBadgeRenderer } from '~/components/ag-grid/cell-renderers/status-badge-renderer';
import { TimeOffActionsRenderer } from '~/components/ag-grid/cell-renderers/time-off-actions-renderer';
import { TimeOffDetailRow } from '~/components/ag-grid/cell-renderers/time-off-detail-row';
import { mapColumnsToColDefs } from '~/components/ag-grid/column-mapper';
import type { ColumnConfig, CrudModuleConfig } from '~/lib/crud/types';

const hrTimeOffSchema = z.object({
  hr_employee_id: z.string().min(1, 'Employee is required'),
  start_date: z.string().min(1, 'Start date is required'),
  return_date: z.string().optional(),
  pto_days: z.number().optional(),
  sick_leave_days: z.number().optional(),
  non_pto_days: z.number().optional(),
  request_reason: z.string().min(1, 'Request reason is required'),
  notes: z.string().optional(),
  status: z.string().optional(),
});

const timeOffColumns: ColumnConfig[] = [
  { key: 'full_name', label: 'Employee', sortable: true },
  {
    key: 'compensation_manager_name',
    label: 'Comp Manager',
    sortable: true,
  },
  {
    key: 'start_date',
    label: 'Start Date',
    type: 'date',
    sortable: true,
  },
  {
    key: 'return_date',
    label: 'Return Date',
    type: 'date',
    priority: 'low',
  },
  {
    key: 'pto_days',
    label: 'PTO Days',
    type: 'number',
    render: 'badge',
    priority: 'low',
  },
  {
    key: 'non_pto_days',
    label: 'Request Off',
    type: 'number',
    render: 'badge',
    priority: 'low',
  },
  {
    key: 'sick_leave_days',
    label: 'Sick Days',
    type: 'number',
    render: 'badge',
    priority: 'low',
  },
  { key: 'request_reason', label: 'Reason', priority: 'low' },
  { key: 'denial_reason', label: 'Denial Reason', priority: 'low' },
  {
    key: 'requested_by_name',
    label: 'Requested By',
    priority: 'low',
  },
  {
    key: 'reviewed_by_name',
    label: 'Reviewed By',
    priority: 'low',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'workflow',
    sortable: true,
  },
];

const timeOffColDefs = [
  {
    headerName: 'Employee',
    field: 'full_name',
    cellRenderer: SchedulerEmployeeRenderer,
    sortable: true,
    filter: 'agTextColumnFilter',
    minWidth: 200,
    autoHeight: true,
  },
  ...mapColumnsToColDefs(
    timeOffColumns.filter((c) => c.key !== 'full_name' && c.key !== 'status'),
  ),
  {
    headerName: 'Status',
    field: 'status',
    cellRenderer: StatusBadgeRenderer,
    sortable: true,
    filter: false,
    resizable: false,
    maxWidth: 110,
    minWidth: 100,
    pinned: 'right' as const,
  },
  {
    headerName: 'Actions',
    field: 'id',
    cellRenderer: TimeOffActionsRenderer,
    sortable: false,
    filter: false,
    resizable: false,
    maxWidth: 120,
    minWidth: 100,
    pinned: 'right' as const,
  },
];

export const hrTimeOffConfig: CrudModuleConfig<typeof hrTimeOffSchema> = {
  tableName: 'hr_time_off_request',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  viewType: {
    list: 'agGrid',
  },

  views: {
    list: 'app_hr_time_off_requests',
    detail: 'app_hr_time_off_requests',
  },

  columns: timeOffColumns,

  agGridColDefs: timeOffColDefs,
  agGridDetailRow: TimeOffDetailRow,

  search: {
    columns: ['full_name', 'request_reason', 'notes'],
    placeholder: 'Search time-off requests...',
  },

  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ['pending', 'approved', 'denied'],
    },
  ],

  formFields: [
    {
      key: 'hr_employee_id',
      label: 'Employee',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumn: 'preferred_name',
      required: true,
    },
    {
      key: 'start_date',
      label: 'Start Date',
      type: 'date',
      required: true,
    },
    { key: 'return_date', label: 'Return Date', type: 'date' },
    { key: 'pto_days', label: 'PTO Days', type: 'number' },
    {
      key: 'sick_leave_days',
      label: 'Sick Leave Days',
      type: 'number',
    },
    { key: 'non_pto_days', label: 'Non-PTO Days', type: 'number' },
    {
      key: 'request_reason',
      label: 'Reason',
      type: 'textarea',
      required: true,
    },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],

  workflow: {
    statusColumn: 'status',
    states: {
      pending: { label: 'Pending', color: 'warning' },
      approved: { label: 'Approved', color: 'success' },
      denied: { label: 'Denied', color: 'destructive' },
    },
    transitions: {
      pending: ['approved', 'denied'],
      approved: [],
      denied: ['pending'],
    },
    transitionFields: {
      approved: {
        reviewed_by: 'currentEmployee',
        reviewed_at: 'now',
      },
      denied: {
        reviewed_by: 'currentEmployee',
        reviewed_at: 'now',
      },
    },
  },

  additionalCreateFields: {
    requested_by: 'currentEmployee',
  },

  schema: hrTimeOffSchema,
};
