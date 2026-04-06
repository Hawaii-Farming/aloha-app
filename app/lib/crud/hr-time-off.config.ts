import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const hrTimeOffSchema = z.object({
  hr_employee_id: z.string().min(1, 'Employee is required'),
  start_date: z.string().min(1, 'Start date is required'),
  return_date: z.string().optional(),
  pto_days: z.number().optional(),
  sick_leave_days: z.number().optional(),
  non_pto_days: z.number().optional(),
  request_reason: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

export const hrTimeOffConfig: CrudModuleConfig<typeof hrTimeOffSchema> = {
  tableName: 'hr_time_off_request',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'hr_time_off_request',
    detail: 'hr_time_off_request',
  },

  columns: [
    { key: 'hr_employee_id', label: 'Employee', sortable: true },
    { key: 'start_date', label: 'Start Date', type: 'date', sortable: true },
    { key: 'return_date', label: 'Return Date', type: 'date', priority: 'low' },
    { key: 'pto_days', label: 'PTO Days', type: 'number', priority: 'low' },
    { key: 'sick_leave_days', label: 'Sick Days', type: 'number', priority: 'low' },
    { key: 'status', label: 'Status', type: 'workflow', sortable: true },
  ],

  search: {
    columns: ['request_reason', 'notes'],
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
    { key: 'start_date', label: 'Start Date', type: 'date', required: true },
    { key: 'return_date', label: 'Return Date', type: 'date' },
    { key: 'pto_days', label: 'PTO Days', type: 'number' },
    { key: 'sick_leave_days', label: 'Sick Leave Days', type: 'number' },
    { key: 'non_pto_days', label: 'Non-PTO Days', type: 'number' },
    { key: 'request_reason', label: 'Reason', type: 'textarea' },
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
  },

  schema: hrTimeOffSchema,
};
