import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const opsTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  farm_id: z.string().optional(),
  ops_template_category_id: z.string().optional(),
  description: z.string().optional(),
  atp_site_count: z.number().optional(),
  minimum_rlu_value: z.number().optional(),
  maximum_rlu_value: z.number().optional(),
  display_order: z.number().default(0),
});

export const opsTemplateConfig: CrudModuleConfig<typeof opsTemplateSchema> = {
  tableName: 'ops_template',
  pkType: 'text',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'ops_template',
    detail: 'ops_template',
  },

  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'ops_template_category_id', label: 'Category', sortable: true },
    { key: 'farm_id', label: 'Farm', sortable: true },
    {
      key: 'atp_site_count',
      label: 'ATP Sites',
      type: 'number',
      priority: 'low',
    },
    {
      key: 'display_order',
      label: 'Order',
      type: 'number',
      sortable: true,
      priority: 'low',
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'datetime',
      sortable: true,
      priority: 'low',
    },
  ],

  search: {
    columns: ['name', 'description'],
    placeholder: 'Search checklists...',
  },

  formFields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: true,
      showOnCreate: true,
      showOnEdit: false,
    },
    { key: 'name', label: 'Name', type: 'text', required: true },
    {
      key: 'farm_id',
      label: 'Farm',
      type: 'fk',
      fkTable: 'org_farm',
      fkLabelColumn: 'id',
    },
    {
      key: 'ops_template_category_id',
      label: 'Category',
      type: 'fk',
      fkTable: 'ops_template_category',
      fkLabelColumn: 'id',
    },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'atp_site_count', label: 'ATP Site Count', type: 'number' },
    { key: 'minimum_rlu_value', label: 'Minimum RLU Value', type: 'number' },
    { key: 'maximum_rlu_value', label: 'Maximum RLU Value', type: 'number' },
    { key: 'display_order', label: 'Display Order', type: 'number' },
  ],

  schema: opsTemplateSchema,
};
