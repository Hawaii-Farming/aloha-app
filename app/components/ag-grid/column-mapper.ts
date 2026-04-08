import type {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';

import { dateFormatter } from '~/components/ag-grid/cell-renderers/date-formatter';
import { EmployeeCellRenderer } from '~/components/ag-grid/cell-renderers/employee-cell-renderer';
import { StatusBadgeRenderer } from '~/components/ag-grid/cell-renderers/status-badge-renderer';
import type { ColumnConfig } from '~/lib/crud/types';

/**
 * Converts an array of ColumnConfig objects (from CrudModuleConfig registry)
 * to AG Grid ColDef[] with correct field/header/filter/hide/render mappings.
 */
export function mapColumnsToColDefs(columns: ColumnConfig[]): ColDef[] {
  return columns.map((col) => {
    const colDef: ColDef = {
      field: col.key,
      headerName: col.label,
      sortable: col.sortable ?? true,
      filter: getFilterType(col.type),
      hide: false,
    };

    // Date columns get dateFormatter
    if (col.type === 'date' || col.type === 'datetime') {
      colDef.valueFormatter = dateFormatter;
    }

    // full_name render: rich employee cell with name, alias, badges
    if (col.render === 'full_name') {
      colDef.cellRenderer = EmployeeCellRenderer;
      colDef.minWidth = 250;
      colDef.valueGetter = (params: ValueGetterParams) => {
        const first = (params.data?.first_name as string) ?? '';
        const last = (params.data?.last_name as string) ?? '';
        const result = `${last}, ${first}`.replace(/(^, |, $)/, '');
        return result || '';
      };
    }

    // proper_case render
    if (col.render === 'proper_case') {
      colDef.valueFormatter = (params: ValueFormatterParams) => {
        const value = params.value as string | null;
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      };
    }

    // Badge/workflow columns get StatusBadgeRenderer
    if (col.type === 'badge' || col.type === 'workflow') {
      colDef.cellRenderer = StatusBadgeRenderer;
    }

    return colDef;
  });
}

function getFilterType(type?: string): string | boolean {
  switch (type) {
    case 'number':
      return 'agNumberColumnFilter';
    case 'date':
    case 'datetime':
      return 'agDateColumnFilter';
    case 'boolean':
      return false;
    default:
      return 'agTextColumnFilter';
  }
}
