import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const fsafeResultSchema = z.object({
  fsafe_lab_test_id: z.string().min(1),
  farm_id: z.string().optional(),
  site_id: z.string().optional(),
  fsafe_test_hold_id: z.string().optional(),
  fsafe_lab_id: z.string().optional(),
  test_method: z.string().optional(),
  initial_retest_vector: z.enum(['initial', 'retest', 'vector']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  result_enum: z.string().optional(),
  result_numeric: z.number().optional(),
  result_pass: z.boolean().optional(),
  warning_message: z.string().optional(),
  fail_code: z.string().optional(),
  notes: z.string().optional(),
  sampled_at: z.string().optional(),
  sampled_by: z.string().optional(),
});

export const fsafeResultConfig: CrudModuleConfig<typeof fsafeResultSchema> = {
  tableName: 'fsafe_result',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'fsafe_result',
    detail: 'fsafe_result',
  },

  columns: [
    { key: 'fsafe_lab_test_id', label: 'Lab Test', sortable: true },
    { key: 'status', label: 'Status', type: 'workflow', sortable: true },
    { key: 'result_pass', label: 'Pass', type: 'boolean' },
    { key: 'result_numeric', label: 'Result', type: 'number', priority: 'low' },
    { key: 'farm_id', label: 'Farm', sortable: true, priority: 'low' },
    { key: 'sampled_at', label: 'Sampled', type: 'datetime', sortable: true, priority: 'low' },
    { key: 'created_at', label: 'Created', type: 'datetime', sortable: true, priority: 'low' },
  ],

  search: {
    columns: ['fsafe_lab_test_id', 'notes'],
    placeholder: 'Search inspections...',
  },

  workflow: {
    statusColumn: 'status',
    states: {
      pending: { label: 'Pending', color: 'default' },
      in_progress: { label: 'In Progress', color: 'warning' },
      completed: { label: 'Completed', color: 'success' },
    },
    transitions: {
      pending: ['in_progress'],
      in_progress: ['completed', 'pending'],
      completed: ['pending'],
    },
    transitionFields: {
      in_progress: { started_at: 'now' },
      completed: { completed_at: 'now' },
    },
  },

  formFields: [
    {
      key: 'fsafe_lab_test_id',
      label: 'Lab Test',
      type: 'fk',
      required: true,
      fkTable: 'fsafe_lab_test',
      fkLabelColumn: 'test_name',
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
    {
      key: 'fsafe_test_hold_id',
      label: 'Test Hold',
      type: 'fk',
      fkTable: 'fsafe_test_hold',
      fkLabelColumn: 'id',
    },
    {
      key: 'fsafe_lab_id',
      label: 'Lab',
      type: 'fk',
      fkTable: 'fsafe_lab',
      fkLabelColumn: 'name',
    },
    { key: 'test_method', label: 'Test Method', type: 'text' },
    {
      key: 'initial_retest_vector',
      label: 'Type',
      type: 'select',
      options: ['initial', 'retest', 'vector'],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: ['pending', 'in_progress', 'completed'],
    },
    { key: 'result_enum', label: 'Result (Enum)', type: 'text' },
    { key: 'result_numeric', label: 'Result (Numeric)', type: 'number' },
    { key: 'result_pass', label: 'Pass', type: 'boolean' },
    { key: 'warning_message', label: 'Warning Message', type: 'text' },
    { key: 'fail_code', label: 'Fail Code', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
    { key: 'sampled_at', label: 'Sampled At', type: 'date' },
    {
      key: 'sampled_by',
      label: 'Sampled By',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumn: 'preferred_name',
    },
  ],

  schema: fsafeResultSchema,
};
