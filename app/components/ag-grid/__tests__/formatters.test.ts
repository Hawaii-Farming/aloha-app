import type { ValueFormatterParams } from 'ag-grid-community';
import { describe, expect, it } from 'vitest';

import { currencyFormatter } from '../cell-renderers/currency-formatter';
import { dateFormatter } from '../cell-renderers/date-formatter';

describe('dateFormatter', () => {
  it('formats ISO date string to MM/DD/YYYY', () => {
    const result = dateFormatter({
      value: '2024-03-15',
    } as ValueFormatterParams);
    expect(result).toBe('03/15/2024');
  });

  it('returns empty string for null value', () => {
    const result = dateFormatter({
      value: null,
    } as ValueFormatterParams);
    expect(result).toBe('');
  });

  it('returns empty string for empty string value', () => {
    const result = dateFormatter({
      value: '',
    } as ValueFormatterParams);
    expect(result).toBe('');
  });
});

describe('currencyFormatter', () => {
  it('formats number as whole number with thousands separators', () => {
    const result = currencyFormatter({
      value: 1234.5,
    } as ValueFormatterParams);
    expect(result).toBe('1,235');
  });

  it('formats negative number with leading minus sign', () => {
    const result = currencyFormatter({
      value: -1234.5,
    } as ValueFormatterParams);
    expect(result).toBe('-1,235');
  });

  it('formats zero as em-dash', () => {
    const result = currencyFormatter({
      value: 0,
    } as ValueFormatterParams);
    expect(result).toBe('—');
  });

  it('returns empty string for null value', () => {
    const result = currencyFormatter({
      value: null,
    } as ValueFormatterParams);
    expect(result).toBe('');
  });
});
