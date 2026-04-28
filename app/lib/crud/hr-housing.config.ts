import { z } from 'zod';

import type { ColumnConfig, CrudModuleConfig } from '~/lib/crud/types';

const hrHousingSchema = z.object({
  id: z.string().min(1, 'Housing name is required'),
  maximum_beds: z
    .number()
    .min(0, 'Maximum beds must be 0 or greater')
    .optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Housing IS the display name (id column on org_site_housing). Aliased
// `name:id` in the views' select strings keeps consumers reading `.name`.
const housingColumns: ColumnConfig[] = [
  { key: 'id', label: 'Housing Name', sortable: true },
  { key: 'maximum_beds', label: 'Max Beds', type: 'number', sortable: true },
  {
    key: 'tenant_count',
    label: 'Tenants',
    type: 'number',
    sortable: true,
  },
  {
    key: 'available_beds',
    label: 'Available Beds',
    type: 'number',
    sortable: true,
  },
];

export const hrHousingConfig: CrudModuleConfig<typeof hrHousingSchema> = {
  tableName: 'org_site_housing',
  pkType: 'text',
  pkColumn: 'id',
  orgScoped: true,

  // The PK is the display name as typed (e.g. "BIP (5)", "Duplex").
  generatePk: (data) => String(data.id ?? '').trim(),

  viewType: { list: 'custom', detail: 'custom' },

  views: {
    list: 'org_site_housing',
    detail: 'org_site_housing',
  },

  columns: housingColumns,
  noPagination: true,
  skipDeletedFilter: true,

  customViews: {
    list: () => import('~/components/ag-grid/housing-map-view'),
    detail: () => import('~/components/crud/housing-detail-view'),
  },

  search: {
    columns: ['id'],
    placeholder: 'Search housing sites...',
  },

  formFields: [
    { key: 'id', label: 'Housing Name', type: 'text', required: true },
    { key: 'maximum_beds', label: 'Max Beds', type: 'number' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],

  schema: hrHousingSchema,
};
