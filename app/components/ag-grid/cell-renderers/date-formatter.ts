import type { ValueFormatterParams } from 'ag-grid-community';
import { format, parseISO } from 'date-fns';

/**
 * AG Grid valueFormatter for date columns.
 * Converts ISO date strings (e.g. '2024-03-15') to MM/DD/YY format.
 * Returns empty string for null/empty values or parse failures.
 */
export function dateFormatter(params: ValueFormatterParams): string {
  const value = params.value as string | null;
  if (!value) return '';
  try {
    return format(parseISO(value), 'MM/dd/yy');
  } catch {
    return '';
  }
}
