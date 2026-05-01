import type { ValueFormatterParams } from 'ag-grid-community';

const usdFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/**
 * AG Grid valueFormatter for currency columns.
 * Formats numeric values as whole-dollar USD (e.g. 1234.5 -> '$1,235').
 * Returns empty string for null/undefined values, em-dash for zero.
 */
export function currencyFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  const n = Number(value);
  if (n === 0) return '—';
  return usdFormat.format(n);
}
