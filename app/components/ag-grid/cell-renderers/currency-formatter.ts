import type { ValueFormatterParams } from 'ag-grid-community';

const numberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  signDisplay: 'negative',
});

/**
 * AG Grid valueFormatter for currency columns.
 * Formats numeric values as whole numbers with thousands separators (e.g. 1234.5 -> '1,235', -50 -> '-50').
 * Returns empty string for null/undefined values, em-dash for zero.
 */
export function currencyFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  const n = Number(value);
  if (n === 0) return '—';
  return numberFormat.format(n);
}
