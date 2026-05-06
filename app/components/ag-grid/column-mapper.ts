import type {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';

import { CodeCellRenderer } from '~/components/ag-grid/cell-renderers/code-cell-renderer';
import { EmployeeCellRenderer } from '~/components/ag-grid/cell-renderers/employee-cell-renderer';
import { numericColDef } from '~/components/ag-grid/cell-renderers/number-formatter';
import {
  DatePillRenderer,
  EmailPillRenderer,
} from '~/components/ag-grid/cell-renderers/pill-renderer';
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
      filter: false,
      hide: false,
    };

    // Numeric columns: right-align header + cell, thousands separator,
    // ≤2 decimals (rounds aggregation FP noise).
    if (col.type === 'number') {
      Object.assign(colDef, numericColDef);
    }

    // Date columns get pill renderer
    if (col.type === 'date' || col.type === 'datetime') {
      colDef.cellRenderer = DatePillRenderer;
    }

    // full_name render: rich employee cell with name, alias, badges
    if (col.render === 'full_name') {
      colDef.cellRenderer = EmployeeCellRenderer;
      colDef.minWidth = 170;
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

    // phone render: format as (XXX) XXX-XXXX
    if (col.render === 'phone') {
      colDef.valueFormatter = (params: ValueFormatterParams) => {
        const raw = params.value as string | null;
        if (!raw) return '';
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 10) {
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        if (digits.length === 11 && digits[0] === '1') {
          return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        return raw;
      };
    }

    // email render: pill
    if (col.render === 'email') {
      colDef.cellRenderer = EmailPillRenderer;
      colDef.minWidth = 160;
    }

    // code render: monospace text in a dark badge (IDs, codes)
    if (col.render === 'code') {
      colDef.cellRenderer = CodeCellRenderer;
    }

    // Badge/workflow columns get StatusBadgeRenderer
    if (col.type === 'badge' || col.type === 'workflow') {
      colDef.cellRenderer = StatusBadgeRenderer;
    }

    return colDef;
  });
}
