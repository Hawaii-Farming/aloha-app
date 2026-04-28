import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const invntOnhandSchema = z.object({
  invnt_item_id: z.string().min(1, 'Item is required'),
  onhand_date: z.string().min(1, 'Date is required'),
  onhand_uom: z.string().optional(),
  onhand_quantity: z.number({ required_error: 'Quantity is required' }),
  burn_per_onhand: z.number().default(0),
  invnt_lot_id: z.string().optional(),
  notes: z.string().optional(),
});

export const invntOnhandConfig: CrudModuleConfig<typeof invntOnhandSchema> = {
  tableName: 'invnt_onhand',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'invnt_onhand',
    detail: 'invnt_onhand',
  },

  columns: [
    { key: 'invnt_item_id', label: 'Item', sortable: true },
    { key: 'onhand_date', label: 'Date', sortable: true, type: 'date' },
    {
      key: 'onhand_quantity',
      label: 'Quantity',
      sortable: true,
      type: 'number',
    },
    { key: 'onhand_uom', label: 'UOM', priority: 'low' },
    {
      key: 'burn_per_onhand',
      label: 'Burn Rate',
      type: 'number',
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
    columns: ['invnt_item_id'],
    placeholder: 'Search stock counts...',
  },

  filters: [],

  formFields: [
    {
      key: 'invnt_item_id',
      label: 'Item',
      type: 'fk',
      required: true,
      fkTable: 'invnt_item',
      fkLabelColumn: 'id',
    },
    { key: 'onhand_date', label: 'Date', type: 'date', required: true },
    {
      key: 'onhand_quantity',
      label: 'Quantity',
      type: 'number',
      required: true,
    },
    {
      key: 'onhand_uom',
      label: 'Unit of Measure',
      type: 'fk',
      fkTable: 'sys_uom',
      fkLabelColumn: 'id',
    },
    { key: 'burn_per_onhand', label: 'Burn Rate', type: 'number' },
    {
      key: 'invnt_lot_id',
      label: 'Lot',
      type: 'fk',
      fkTable: 'invnt_lot',
      fkLabelColumn: 'id',
    },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],

  schema: invntOnhandSchema,
};
