import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const invntItemSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  invnt_category_id: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const invntItemConfig: CrudModuleConfig<typeof invntItemSchema> = {
  tableName: 'invnt_item',
  pkType: 'text',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'invnt_item',
    detail: 'invnt_item',
  },

  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', priority: 'low' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
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
    placeholder: 'Search inventory items...',
  },

  filters: [{ key: 'is_active', label: 'Active', type: 'boolean' }],

  formFields: [
    {
      key: 'id',
      label: 'Item ID',
      type: 'text',
      required: true,
      showOnCreate: true,
      showOnEdit: false,
    },
    { key: 'name', label: 'Item Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    {
      key: 'invnt_category_id',
      label: 'Category',
      type: 'fk',
      fkTable: 'invnt_category',
      fkLabelColumn: 'category_name',
    },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],

  schema: invntItemSchema,
};
