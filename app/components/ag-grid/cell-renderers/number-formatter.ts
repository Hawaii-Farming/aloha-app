import type { ColDef, ValueFormatterParams } from 'ag-grid-community';

const intFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Shared number valueFormatter for grid columns and aggregations.
 * Rounds to integer (no decimals), thousands separator only when the value
 * crosses 1,000 — small integers like "8" or "40" render as-is, large ones
 * like "12,345" get commas. Returns '' for null/undefined/non-finite.
 */
export function numberFormatter(params: ValueFormatterParams): string {
  const v = params.value;
  if (v == null || v === '') return '';
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '';
  return intFormat.format(Math.round(n));
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
