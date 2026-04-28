import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const growSeedBatchSchema = z.object({
  batch_code: z.string().min(1, 'Batch code is required'),
  grow_seed_mix_id: z.string().optional(),
  invnt_item_id: z.string().optional(),
  seeding_uom: z.string().min(1, 'Seeding UOM is required'),
  number_of_units: z.number({ required_error: 'Required' }),
  seeds_per_unit: z.number({ required_error: 'Required' }),
  number_of_rows: z.number({ required_error: 'Required' }),
  seeding_date: z.string().min(1, 'Seeding date is required'),
  transplant_date: z.string().min(1, 'Transplant date is required'),
  estimated_harvest_date: z
    .string()
    .min(1, 'Estimated harvest date is required'),
  status: z
    .enum(['Planned', 'Seeded', 'Transplanted', 'Harvesting', 'Harvested'])
    .default('Planned'),
  notes: z.string().optional(),
  farm_id: z.string().min(1, 'Farm is required'),
  site_id: z.string().optional(),
  grow_cycle_pattern_id: z.string().optional(),
  grow_trial_type_id: z.string().optional(),
  invnt_lot_id: z.string().optional(),
});

export const growSeedBatchConfig: CrudModuleConfig<typeof growSeedBatchSchema> =
  {
    tableName: 'grow_seed_batch',
    pkType: 'uuid',
    pkColumn: 'id',
    orgScoped: true,

    views: {
      list: 'grow_seed_batch',
      detail: 'grow_seed_batch',
    },

    columns: [
      { key: 'batch_code', label: 'Batch Code', sortable: true },
      { key: 'status', label: 'Status', type: 'workflow' },
      {
        key: 'seeding_date',
        label: 'Seeding Date',
        type: 'date',
        sortable: true,
      },
      {
        key: 'transplant_date',
        label: 'Transplant Date',
        type: 'date',
        priority: 'low',
      },
      {
        key: 'estimated_harvest_date',
        label: 'Est. Harvest Date',
        type: 'date',
        priority: 'low',
      },
      {
        key: 'number_of_units',
        label: 'Units',
        type: 'number',
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
      columns: ['batch_code'],
      placeholder: 'Search seed batches...',
    },

    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          'Planned',
          'Seeded',
          'Transplanted',
          'Harvesting',
          'Harvested',
        ],
      },
    ],

    formFields: [
      { key: 'batch_code', label: 'Batch Code', type: 'text', required: true },
      {
        key: 'farm_id',
        label: 'Farm',
        type: 'fk',
        required: true,
        fkTable: 'org_farm',
        fkLabelColumn: 'id',
      },
      {
        key: 'site_id',
        label: 'Site',
        type: 'fk',
        fkTable: 'org_site',
        fkLabelColumn: 'id',
      },
      {
        key: 'grow_seed_mix_id',
        label: 'Seed Mix',
        type: 'fk',
        fkTable: 'grow_seed_mix',
        fkLabelColumn: 'id',
      },
      {
        key: 'invnt_item_id',
        label: 'Item',
        type: 'fk',
        fkTable: 'invnt_item',
        fkLabelColumn: 'id',
      },
      {
        key: 'grow_cycle_pattern_id',
        label: 'Cycle Pattern',
        type: 'fk',
        fkTable: 'grow_cycle_pattern',
        fkLabelColumn: 'id',
      },
      {
        key: 'grow_trial_type_id',
        label: 'Trial Type',
        type: 'fk',
        fkTable: 'grow_trial_type',
        fkLabelColumn: 'id',
      },
      {
        key: 'invnt_lot_id',
        label: 'Lot',
        type: 'fk',
        fkTable: 'invnt_lot',
        fkLabelColumn: 'id',
      },
      {
        key: 'seeding_uom',
        label: 'Seeding UOM',
        type: 'fk',
        required: true,
        fkTable: 'sys_uom',
        fkLabelColumn: 'id',
      },
      {
        key: 'number_of_units',
        label: 'Number of Units',
        type: 'number',
        required: true,
      },
      {
        key: 'seeds_per_unit',
        label: 'Seeds per Unit',
        type: 'number',
        required: true,
      },
      {
        key: 'number_of_rows',
        label: 'Number of Rows',
        type: 'number',
        required: true,
      },
      {
        key: 'seeding_date',
        label: 'Seeding Date',
        type: 'date',
        required: true,
      },
      {
        key: 'transplant_date',
        label: 'Transplant Date',
        type: 'date',
        required: true,
      },
      {
        key: 'estimated_harvest_date',
        label: 'Estimated Harvest Date',
        type: 'date',
        required: true,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          'Planned',
          'Seeded',
          'Transplanted',
          'Harvesting',
          'Harvested',
        ],
      },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],

    workflow: {
      statusColumn: 'status',
      states: {
        Planned: { label: 'Planned', color: 'default' },
        Seeded: { label: 'Seeded', color: 'secondary' },
        Transplanted: { label: 'Transplanted', color: 'warning' },
        Harvesting: { label: 'Harvesting', color: 'success' },
        Harvested: { label: 'Harvested', color: 'success' },
      },
      transitions: {
        Planned: ['Seeded'],
        Seeded: ['Transplanted'],
        Transplanted: ['Harvesting'],
        Harvesting: ['Harvested'],
        Harvested: [],
      },
    },

    schema: growSeedBatchSchema,
  };
