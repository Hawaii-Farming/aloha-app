import type { ValueGetterParams } from 'ag-grid-community';
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

// Column keys reflect the flattened postgrest embeds:
//   `subject:hr_employee!hr_employee_id(...)`        -> subject_*
//   `requester:hr_employee!requested_by(...)`        -> requester_*
//   `reviewer:hr_employee!reviewed_by(...)`          -> reviewer_*
const timeOffColumns: ColumnConfig[] = [
  { key: 'subject_last_name', label: 'Employee' },
  {
    key: 'subject_compensation_manager_id',
    label: 'Comp Manager',
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
    priority: 'low',
  },
  {
    key: 'non_pto_days',
    label: 'Request Off',
    type: 'number',
    priority: 'low',
  },
  {
    key: 'sick_leave_days',
    label: 'Sick Days',
    type: 'number',
    priority: 'low',
  },
  { key: 'request_reason', label: 'Reason', priority: 'low' },
  { key: 'denial_reason', label: 'Denial Reason', priority: 'low' },
  {
    key: 'requester_full_name',
    label: 'Requested By',
    priority: 'low',
  },
  {
    key: 'reviewer_full_name',
    label: 'Reviewed By',
    priority: 'low',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'workflow',
  },
];

const timeOffColDefs = [
  {
    headerName: 'Employee',
    colId: 'employee_full_name',
    cellRenderer: SchedulerEmployeeRenderer,
    minWidth: 200,
    valueGetter: (params: ValueGetterParams) => {
      const first = (params.data?.subject_first_name as string) ?? '';
      const last = (params.data?.subject_last_name as string) ?? '';
      return [first, last].filter(Boolean).join(' ');
    },
  },
  ...mapColumnsToColDefs(
    timeOffColumns.filter(
      (c) => c.key !== 'subject_last_name' && c.key !== 'status',
    ),
  ).map((col) => {
    if (col.field === 'request_reason') {
      return { ...col, minWidth: 320, flex: 1 };
    }
    if (col.field === 'subject_compensation_manager_id') {
      return {
        ...col,
        valueGetter: (params: ValueGetterParams) => {
          const first =
            (params.data
              ?.subject_compensation_manager_id_first_name as string) ?? '';
          const last =
            (params.data
              ?.subject_compensation_manager_id_last_name as string) ?? '';
          return [first, last].filter(Boolean).join(' ');
        },
      };
    }
    if (col.field === 'requester_full_name') {
      return {
        ...col,
        valueGetter: (params: ValueGetterParams) => {
          const first = (params.data?.requester_first_name as string) ?? '';
          const last = (params.data?.requester_last_name as string) ?? '';
          return [first, last].filter(Boolean).join(' ');
        },
      };
    }
    if (col.field === 'reviewer_full_name') {
      return {
        ...col,
        valueGetter: (params: ValueGetterParams) => {
          const first = (params.data?.reviewer_first_name as string) ?? '';
          const last = (params.data?.reviewer_last_name as string) ?? '';
          return [first, last].filter(Boolean).join(' ');
        },
      };
    }
    return col;
  }),
  {
    headerName: 'Status',
    field: 'status',
    cellRenderer: StatusBadgeRenderer,
    filter: false,
    resizable: false,
    width: 130,
    minWidth: 120,
    pinned: 'right' as const,
    cellClass: 'ag-cell-no-ellipsis',
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
    list: 'hr_time_off_request',
    detail: 'hr_time_off_request',
  },

  // Read joined display fields directly from hr_employee via postgrest
  // embeds. flattenRow turns `subject.preferred_name` into
  // `subject_preferred_name` on the row, which is what the column keys
  // and the TimeOffDetailRow renderer reference.
  select: [
    '*',
    'subject:hr_employee!hr_time_off_request_hr_employee_id_emp_fkey(first_name,last_name,preferred_name,profile_photo_url,hr_department_id,hr_work_authorization_id,compensation_manager_id)',
    'requester:hr_employee!hr_time_off_request_requested_by_emp_fkey(first_name,last_name,preferred_name)',
    'reviewer:hr_employee!hr_time_off_request_reviewed_by_emp_fkey(first_name,last_name,preferred_name)',
  ].join(', '),

  // No FK constraint on hr_employee.compensation_manager_id, so PostgREST
  // can't embed manager info. Cross-table lookups also enrich the
  // workflow-history `by` ids (requested_by / reviewed_by) so the detail
  // page can show "First Last" instead of the raw employee id.
  selfJoins: {
    subject_compensation_manager_id: {
      table: 'hr_employee',
      displayFields: ['first_name', 'last_name'],
    },
    requested_by: {
      table: 'hr_employee',
      displayFields: ['first_name', 'last_name'],
    },
    reviewed_by: {
      table: 'hr_employee',
      displayFields: ['first_name', 'last_name'],
    },
  },

  columns: timeOffColumns,

  agGridColDefs: timeOffColDefs,
  agGridDetailRow: TimeOffDetailRow,
  noPagination: true,

  search: {
    columns: ['request_reason'],
    placeholder: 'Search time-off requests...',
  },

  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: ['Pending', 'Approved', 'Denied'],
    },
  ],

  formFields: [
    {
      key: 'hr_employee_id',
      label: 'Employee',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumns: ['first_name', 'last_name'],
      fkEmbedAlias: 'subject',
      required: true,
      section: 'Employee',
    },
    // Detail-only: read-only manager column resolved via cross-table selfJoin.
    // Hidden from create/edit because the manager comes from the employee record.
    {
      key: 'subject_compensation_manager_id',
      label: 'Comp Manager',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumns: ['first_name', 'last_name'],
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'start_date',
      label: 'Start Date',
      type: 'date',
      required: true,
      allowFutureDates: true,
      pickerDefaultMonth: 'today',
      defaultValue: 'today',
      section: 'Dates',
    },
    {
      key: 'return_date',
      label: 'Return Date',
      type: 'date',
      allowFutureDates: true,
      pickerDefaultMonth: 'today',
      defaultValue: 'today',
    },
    {
      key: 'pto_allocation',
      label: 'Time off allocation',
      type: 'pto-allocation',
      fullWidth: true,
      section: 'Allocation',
    },
    {
      key: 'pto_days',
      label: 'PTO Days',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'sick_leave_days',
      label: 'Sick Leave Days',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'non_pto_days',
      label: 'Unpaid Days',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'request_reason',
      label: 'Reason',
      type: 'textarea',
      required: true,
      section: 'Request',
    },
  ],

  workflow: {
    statusColumn: 'status',
    states: {
      Pending: { label: 'Pending', color: 'warning' },
      Approved: { label: 'Approved', color: 'success' },
      Denied: { label: 'Denied', color: 'destructive' },
    },
    transitions: {
      Pending: ['Approved', 'Denied'],
      Approved: [],
      Denied: [],
    },
    // Pending requests are user-cancellable: Cancel deletes the row
    // outright (mistake correction). Approved/Denied are terminal —
    // any change there belongs in a separate process, not the
    // requester's hands.
    cancellableOnStates: ['Pending'],
    transitionFields: {
      Approved: {
        reviewed_by: 'currentEmployee',
        reviewed_at: 'now',
      },
      Denied: {
        reviewed_by: 'currentEmployee',
        reviewed_at: 'now',
      },
    },
    transitionPrompts: {
      Denied: {
        field: 'denial_reason',
        label: 'Denial Reason',
        placeholder: 'Enter reason for denial...',
        required: true,
      },
    },
    initialEntry: {
      state: 'Pending',
      atField: 'requested_at',
      byField: 'requested_by',
    },
  },

  additionalCreateFields: {
    requested_by: 'currentEmployee',
  },

  schema: hrTimeOffSchema,
};
