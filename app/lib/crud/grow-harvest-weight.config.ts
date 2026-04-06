import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const growHarvestWeightSchema = z.object({
  grow_seed_batch_id: z.string().min(1, 'Seed batch is required'),
  harvest_date: z.string().min(1, 'Harvest date is required'),
  grow_harvest_container_id: z.string().min(1, 'Container is required'),
  number_of_containers: z.number({ required_error: 'Required' }),
  weight_uom: z.string().min(1, 'Weight UOM is required'),
  gross_weight: z.number({ required_error: 'Required' }),
  net_weight: z.number({ required_error: 'Required' }),
  farm_id: z.string().min(1, 'Farm is required'),
  site_id: z.string().optional(),
  grow_grade_id: z.string().optional(),
});

export const growHarvestWeightConfig: CrudModuleConfig<
  typeof growHarvestWeightSchema
> = {
  tableName: 'grow_harvest_weight',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'grow_harvest_weight',
    detail: 'grow_harvest_weight',
  },

  columns: [
    { key: 'grow_seed_batch_id', label: 'Seed Batch', sortable: true },
    { key: 'harvest_date', label: 'Harvest Date', type: 'date', sortable: true },
    { key: 'gross_weight', label: 'Gross Weight', type: 'number', sortable: true },
    { key: 'net_weight', label: 'Net Weight', type: 'number', sortable: true, priority: 'low' },
    { key: 'weight_uom', label: 'UOM', priority: 'low' },
    { key: 'number_of_containers', label: 'Containers', type: 'number', priority: 'low' },
    { key: 'created_at', label: 'Created', type: 'datetime', sortable: true, priority: 'low' },
  ],

  search: {
    columns: ['grow_seed_batch_id'],
    placeholder: 'Search harvests...',
  },

  filters: [],

  formFields: [
    {
      key: 'grow_seed_batch_id',
      label: 'Seed Batch',
      type: 'fk',
      required: true,
      fkTable: 'grow_seed_batch',
      fkLabelColumn: 'batch_code',
    },
    {
      key: 'farm_id',
      label: 'Farm',
      type: 'fk',
      required: true,
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
      key: 'grow_grade_id',
      label: 'Grade',
      type: 'fk',
      fkTable: 'grow_grade',
      fkLabelColumn: 'name',
    },
    { key: 'harvest_date', label: 'Harvest Date', type: 'date', required: true },
    {
      key: 'grow_harvest_container_id',
      label: 'Container',
      type: 'fk',
      required: true,
      fkTable: 'grow_harvest_container',
      fkLabelColumn: 'id',
    },
    {
      key: 'number_of_containers',
      label: 'Number of Containers',
      type: 'number',
      required: true,
    },
    {
      key: 'weight_uom',
      label: 'Weight UOM',
      type: 'fk',
      required: true,
      fkTable: 'sys_uom',
      fkLabelColumn: 'id',
    },
    { key: 'gross_weight', label: 'Gross Weight', type: 'number', required: true },
    { key: 'net_weight', label: 'Net Weight', type: 'number', required: true },
  ],

  schema: growHarvestWeightSchema,
};
