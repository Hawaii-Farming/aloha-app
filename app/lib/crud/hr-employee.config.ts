import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const hrEmployeeSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().optional(),
  phone: z.string().optional(),
  start_date: z.string().optional(),
  hr_department_id: z.string().optional(),
  hr_title_id: z.string().optional(),
  sys_access_level_id: z.string().min(1, 'Access level is required'),
});

export const hrEmployeeConfig: CrudModuleConfig<typeof hrEmployeeSchema> = {
  tableName: 'hr_employee',
  pkType: 'text',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'hr_employee',
    detail: 'hr_employee',
  },

  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'first_name', label: 'First Name', sortable: true },
    { key: 'last_name', label: 'Last Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'start_date', label: 'Start Date', type: 'date', sortable: true },
    { key: 'created_at', label: 'Created', type: 'datetime', sortable: true },
  ],

  search: {
    columns: ['first_name', 'last_name', 'email'],
    placeholder: 'Search employees...',
  },

  filters: [],

  formFields: [
    {
      key: 'id',
      label: 'Employee ID',
      type: 'text',
      required: true,
      showOnCreate: true,
      showOnEdit: false,
    },
    { key: 'first_name', label: 'First Name', type: 'text', required: true },
    { key: 'last_name', label: 'Last Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'start_date', label: 'Start Date', type: 'date' },
    {
      key: 'hr_department_id',
      label: 'Department',
      type: 'fk',
      fkTable: 'hr_department',
      fkLabelColumn: 'name',
    },
    {
      key: 'sys_access_level_id',
      label: 'Access Level',
      type: 'fk',
      fkTable: 'sys_access_level',
      fkLabelColumn: 'name',
      required: true,
    },
  ],

  schema: hrEmployeeSchema,
};
