import type { ValueFormatterParams } from 'ag-grid-community';

const usdFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * AG Grid valueFormatter for currency columns.
 * Formats numeric values as USD (e.g. 1234.5 -> '$1,234.50').
 * Returns empty string for null/undefined values.
 */
export function currencyFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  return usdFormat.format(Number(value));
}
