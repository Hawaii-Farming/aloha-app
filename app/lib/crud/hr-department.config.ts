import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const hrDepartmentSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const hrDepartmentConfig: CrudModuleConfig<typeof hrDepartmentSchema> = {
  tableName: 'hr_department',
  pkType: 'text',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'hr_department',
    detail: 'hr_department',
  },

  columns: [
    { key: 'id', label: 'ID', sortable: true, render: 'code' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', priority: 'low' },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      type: 'datetime',
      priority: 'low',
    },
  ],

  search: {
    columns: ['name', 'description'],
    placeholder: 'Search departments...',
  },

  filters: [],

  formFields: [
    {
      key: 'id',
      label: 'Department ID',
      type: 'text',
      required: true,
      showOnCreate: true,
      showOnEdit: false,
    },
    { key: 'name', label: 'Department Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],

  schema: hrDepartmentSchema,
};
