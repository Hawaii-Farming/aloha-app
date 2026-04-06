import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const orgSiteSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  acres: z.number().optional(),
  total_rows: z.number().optional(),
  avg_units_per_row: z.number().optional(),
  notes: z.string().optional(),
  is_food_contact_surface: z.boolean().default(false),
  zone: z.string().optional(),
});

export const orgSiteConfig: CrudModuleConfig<typeof orgSiteSchema> = {
  tableName: 'org_site',
  pkType: 'text',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'org_site',
    detail: 'org_site',
  },

  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'zone', label: 'Zone', priority: 'low' },
    { key: 'acres', label: 'Acres', type: 'number', priority: 'low' },
    {
      key: 'is_food_contact_surface',
      label: 'Food Contact Surface',
      type: 'boolean',
      priority: 'low',
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      type: 'datetime',
      priority: 'low',
    },
  ],

  search: {
    columns: ['name', 'category', 'zone'],
    placeholder: 'Search warehouses...',
  },

  filters: [
    { key: 'zone', label: 'Zone', type: 'select', options: ['zone_1', 'zone_2', 'zone_3', 'zone_4'] },
  ],

  formFields: [
    {
      key: 'id',
      label: 'Site ID',
      type: 'text',
      required: true,
      showOnCreate: true,
      showOnEdit: false,
    },
    { key: 'name', label: 'Site Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'text', required: true },
    { key: 'subcategory', label: 'Subcategory', type: 'text' },
    { key: 'acres', label: 'Acres', type: 'number' },
    { key: 'total_rows', label: 'Total Rows', type: 'number' },
    { key: 'avg_units_per_row', label: 'Avg Units Per Row', type: 'number' },
    {
      key: 'zone',
      label: 'Zone',
      type: 'select',
      options: ['zone_1', 'zone_2', 'zone_3', 'zone_4'],
    },
    {
      key: 'is_food_contact_surface',
      label: 'Food Contact Surface',
      type: 'boolean',
    },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],

  schema: orgSiteSchema,
};
