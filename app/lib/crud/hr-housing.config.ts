import { z } from 'zod';

import { mapColumnsToColDefs } from '~/components/ag-grid/column-mapper';
import { HousingDetailRow } from '~/components/ag-grid/housing-detail-row';
import type { ColumnConfig, CrudModuleConfig } from '~/lib/crud/types';

const hrHousingSchema = z.object({
  name: z.string().min(1, 'Housing name is required'),
  max_beds: z.number().min(0, 'Max beds must be 0 or greater'),
  notes: z.string().optional(),
  org_site_category_id: z.string().optional(),
});

const housingColumns: ColumnConfig[] = [
  { key: 'name', label: 'Housing Name', sortable: true },
  { key: 'max_beds', label: 'Max Beds', type: 'number', sortable: true },
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
  tableName: 'org_site',
  pkType: 'text',
  pkColumn: 'id',
  orgScoped: true,

  generatePk: (data) => {
    const name = String(data.name ?? 'housing');
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  },

  viewType: { list: 'agGrid' },

  views: {
    list: 'app_hr_housing',
    detail: 'app_hr_housing',
  },

  columns: housingColumns,
  agGridColDefs: mapColumnsToColDefs(housingColumns),
  agGridDetailRow: HousingDetailRow,
  noPagination: true,

  search: {
    columns: ['name'],
    placeholder: 'Search housing sites...',
  },

  formFields: [
    { key: 'name', label: 'Housing Name', type: 'text', required: true },
    { key: 'max_beds', label: 'Max Beds', type: 'number', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],

  schema: hrHousingSchema,
};
