import type { ColDef, ValueFormatterParams } from 'ag-grid-community';

const intFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const decFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Shared number valueFormatter: thousands separators, up to 2 decimals,
 * rounds aggregation FP noise. Returns '' for null/undefined/non-finite.
 */
export function numberFormatter(params: ValueFormatterParams): string {
  const v = params.value;
  if (v == null || v === '') return '';
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? intFormat.format(n) : decFormat.format(n);
}

/**
 * ColDef preset applied to numeric columns by mapColumnsToColDefs when
 * ColumnConfig.type === 'number'. Right-aligns header + cell, applies
 * comma/round formatter. Compose with `Object.assign(colDef, numericColDef)`
 * in column-mapper.
 */
export const numericColDef: Partial<ColDef> = {
  type: 'numericColumn',
  cellClass: 'text-right tabular-nums',
  headerClass: 'text-right',
  valueFormatter: numberFormatter,
};
