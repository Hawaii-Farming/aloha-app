import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const opsTaskTrackerSchema = z.object({
  ops_task_id: z.string().min(1),
  farm_id: z.string().optional(),
  site_id: z.string().optional(),
  start_time: z.string().min(1),
  stop_time: z.string().optional(),
  is_completed: z.boolean().default(false),
  notes: z.string().optional(),
  verified_at: z.string().optional(),
  verified_by: z.string().optional(),
});

export const opsTaskTrackerConfig: CrudModuleConfig<
  typeof opsTaskTrackerSchema
> = {
  tableName: 'ops_task_tracker',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'ops_task_tracker',
    detail: 'ops_task_tracker',
  },

  columns: [
    { key: 'ops_task_id', label: 'Task', sortable: true },
    { key: 'is_completed', label: 'Completed', type: 'boolean' },
    { key: 'start_time', label: 'Started', type: 'datetime', sortable: true },
    { key: 'stop_time', label: 'Stopped', type: 'datetime', sortable: true },
    { key: 'farm_id', label: 'Farm', sortable: true },
    { key: 'created_at', label: 'Created', type: 'datetime', sortable: true },
  ],

  search: {
    columns: ['notes'],
    placeholder: 'Search task tracking...',
  },

  formFields: [
    {
      key: 'ops_task_id',
      label: 'Task',
      type: 'fk',
      required: true,
      fkTable: 'ops_task',
      fkLabelColumn: 'name',
    },
    {
      key: 'farm_id',
      label: 'Farm',
      type: 'fk',
      fkTable: 'org_farm',
      fkLabelColumn: 'name',
    },
    {
      key: 'site_id',
      label: 'Site',
      type: 'fk',
      fkTable: 'org_site',
      fkLabelColumn: 'name',
    },
    { key: 'start_time', label: 'Start Time', type: 'date', required: true },
    { key: 'stop_time', label: 'Stop Time', type: 'date' },
    { key: 'is_completed', label: 'Completed', type: 'boolean' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
    {
      key: 'verified_by',
      label: 'Verified By',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumn: 'first_name',
    },
  ],

  schema: opsTaskTrackerSchema,
};
