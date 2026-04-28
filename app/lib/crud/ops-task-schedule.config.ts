import type { CrudModuleConfig } from '~/lib/crud/types';

import { opsTaskScheduleSchema } from './ops-task-schedule.schema';

export const opsTaskScheduleConfig: CrudModuleConfig<
  typeof opsTaskScheduleSchema
> = {
  tableName: 'ops_task_schedule',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'ops_task_weekly_schedule',
    detail: 'ops_task_schedule',
  },

  viewType: {
    list: 'custom',
  },

  customViews: {
    list: () => import('~/components/ag-grid/scheduler-list-view'),
  },

  columns: [
    { key: 'full_name', label: 'Employee', sortable: true },
    { key: 'department_name', label: 'Department', sortable: true },
    {
      key: 'work_authorization_name',
      label: 'Work Auth',
      sortable: true,
      priority: 'low',
    },
    { key: 'task', label: 'Task', sortable: true },
    { key: 'sunday', label: 'Sun', type: 'text' },
    { key: 'monday', label: 'Mon', type: 'text' },
    { key: 'tuesday', label: 'Tue', type: 'text' },
    { key: 'wednesday', label: 'Wed', type: 'text' },
    { key: 'thursday', label: 'Thu', type: 'text' },
    { key: 'friday', label: 'Fri', type: 'text' },
    { key: 'saturday', label: 'Sat', type: 'text' },
    { key: 'total_hours', label: 'Total Hrs', type: 'number', sortable: true },
    {
      key: 'is_over_ot_threshold',
      label: 'OT',
      type: 'boolean',
      priority: 'low',
    },
  ],

  formFields: [
    {
      key: 'hr_employee_id',
      label: 'Employee',
      type: 'fk',
      required: true,
      fkTable: 'hr_employee',
      fkLabelColumn: 'preferred_name',
    },
    {
      key: 'ops_task_id',
      label: 'Task',
      type: 'fk',
      required: true,
      fkTable: 'ops_task',
      fkLabelColumn: 'id',
    },
    {
      key: 'start_time',
      label: 'Date & Start Time',
      type: 'datetime',
      required: true,
    },
    { key: 'stop_time', label: 'End Time', type: 'datetime' },
  ],

  noPagination: true,
  schema: opsTaskScheduleSchema,
};
