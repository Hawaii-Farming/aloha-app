import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const fsafeTestHoldSchema = z.object({
  farm_id: z.string().min(1, 'Farm is required'),
  pack_lot_id: z.string().min(1, 'Pack lot is required'),
  sales_customer_group_id: z.string().optional(),
  sales_customer_id: z.string().optional(),
  fsafe_lab_id: z.string().optional(),
  lab_test_id: z.string().optional(),
  notes: z.string().optional(),
  delivered_to_lab_on: z.string().optional(),
});

export const fsafeTestHoldConfig: CrudModuleConfig<typeof fsafeTestHoldSchema> =
  {
    tableName: 'fsafe_test_hold',
    pkType: 'uuid',
    pkColumn: 'id',
    orgScoped: true,

    views: {
      list: 'fsafe_test_hold',
      detail: 'fsafe_test_hold',
    },

    columns: [
      { key: 'farm_id', label: 'Farm', sortable: true },
      { key: 'pack_lot_id', label: 'Pack Lot', sortable: true },
      { key: 'fsafe_lab_id', label: 'Lab', priority: 'low' },
      { key: 'lab_test_id', label: 'Lab Test', priority: 'low' },
      {
        key: 'delivered_to_lab_on',
        label: 'Delivered to Lab',
        type: 'date',
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
      columns: ['farm_id', 'notes'],
      placeholder: 'Search incidents...',
    },

    formFields: [
      {
        key: 'farm_id',
        label: 'Farm',
        type: 'fk',
        required: true,
        fkTable: 'org_farm',
        fkLabelColumn: 'id',
      },
      {
        key: 'pack_lot_id',
        label: 'Pack Lot',
        type: 'fk',
        required: true,
        fkTable: 'pack_lot',
        fkLabelColumn: 'id',
      },
      {
        key: 'sales_customer_group_id',
        label: 'Customer Group',
        type: 'fk',
        fkTable: 'sales_customer_group',
        fkLabelColumn: 'id',
      },
      {
        key: 'sales_customer_id',
        label: 'Customer',
        type: 'fk',
        fkTable: 'sales_customer',
        fkLabelColumn: 'id',
      },
      {
        key: 'fsafe_lab_id',
        label: 'Lab',
        type: 'fk',
        fkTable: 'fsafe_lab',
        fkLabelColumn: 'id',
      },
      { key: 'lab_test_id', label: 'Lab Test', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      {
        key: 'delivered_to_lab_on',
        label: 'Delivered to Lab On',
        type: 'date',
      },
    ],

    schema: fsafeTestHoldSchema,
  };
