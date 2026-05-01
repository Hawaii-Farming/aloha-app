import type { ValueFormatterParams } from 'ag-grid-community';
import { describe, expect, it, vi } from 'vitest';

import type { ColumnConfig } from '~/lib/crud/types';

// Mock cell renderer dependencies
vi.mock('~/components/ag-grid/cell-renderers/pill-renderer', () => ({
  DatePillRenderer: vi.fn(),
  EmailPillRenderer: vi.fn(),
  HashPillRenderer: vi.fn(),
}));

vi.mock('~/components/ag-grid/cell-renderers/status-badge-renderer', () => ({
  StatusBadgeRenderer: vi.fn(),
}));

vi.mock('~/components/ag-grid/cell-renderers/employee-cell-renderer', () => ({
  EmployeeCellRenderer: vi.fn(),
}));

vi.mock('~/components/ag-grid/cell-renderers/code-cell-renderer', () => ({
  CodeCellRenderer: vi.fn(),
}));

describe('mapColumnsToColDefs', () => {
  it('maps basic ColumnConfig to ColDef — sortable defaults true, filter always false', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'name', label: 'Name', sortable: true },
    ];
    const result = mapColumnsToColDefs(columns);
    expect(result).toHaveLength(1);
    const col = result[0]!;
    expect(col.field).toBe('name');
    expect(col.headerName).toBe('Name');
    expect(col.sortable).toBe(true);
    expect(col.filter).toBe(false);
  });

  it('respects explicit sortable=false on a column', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'actions', label: 'Actions', sortable: false },
    ];
    expect(mapColumnsToColDefs(columns)[0]!.sortable).toBe(false);
  });

  it('maps type=date to DatePillRenderer; no filter', async () => {
    const { DatePillRenderer } =
      await import('~/components/ag-grid/cell-renderers/pill-renderer');
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'hire_date', label: 'Hire Date', type: 'date' },
    ];
    const result = mapColumnsToColDefs(columns);
    const col = result[0]!;
    expect(col.filter).toBe(false);
    expect(col.cellRenderer).toBe(DatePillRenderer);
  });

  it('maps type=number with no filter', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'salary', label: 'Salary', type: 'number' },
    ];
    const result = mapColumnsToColDefs(columns);
    expect(result[0]!.filter).toBe(false);
  });

  it('maps priority=low to hide=false (all columns visible by default)', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'notes', label: 'Notes', priority: 'low' },
    ];
    const result = mapColumnsToColDefs(columns);
    expect(result[0]!.hide).toBe(false);
  });

  it('maps priority=high to hide=false', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'name', label: 'Name', priority: 'high' },
    ];
    const result = mapColumnsToColDefs(columns);
    expect(result[0]!.hide).toBe(false);
  });

  it('maps render=full_name to valueGetter that concatenates last_name, first_name', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'name', label: 'Name', render: 'full_name' },
    ];
    const result = mapColumnsToColDefs(columns);
    const col = result[0]!;
    expect(col.valueGetter).toBeDefined();

    const valueGetter = col.valueGetter as (params: {
      data: Record<string, unknown>;
    }) => string;
    const value = valueGetter({
      data: { first_name: 'John', last_name: 'Doe' },
    });
    expect(value).toBe('Doe, John');
  });

  it('maps render=proper_case to valueFormatter', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'status', label: 'Status', render: 'proper_case' },
    ];
    const result = mapColumnsToColDefs(columns);
    const col = result[0]!;
    expect(col.valueFormatter).toBeDefined();

    const formatter = col.valueFormatter as (params: {
      value: unknown;
    }) => string;
    expect(formatter({ value: 'ACTIVE' })).toBe('Active');
    expect(formatter({ value: 'pending' })).toBe('Pending');
    expect(formatter({ value: null })).toBe('');
  });

  it('maps type=badge to StatusBadgeRenderer cellRenderer', async () => {
    const { StatusBadgeRenderer } =
      await import('~/components/ag-grid/cell-renderers/status-badge-renderer');
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'status', label: 'Status', type: 'badge' },
    ];
    const result = mapColumnsToColDefs(columns);
    expect(result[0]!.cellRenderer).toBe(StatusBadgeRenderer);
  });

  it('maps type=workflow to StatusBadgeRenderer cellRenderer', async () => {
    const { StatusBadgeRenderer } =
      await import('~/components/ag-grid/cell-renderers/status-badge-renderer');
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'status', label: 'Status', type: 'workflow' },
    ];
    const result = mapColumnsToColDefs(columns);
    expect(result[0]!.cellRenderer).toBe(StatusBadgeRenderer);
  });

  it('numberFormatter formats integers with thousands separator', async () => {
    const { numberFormatter } =
      await import('~/components/ag-grid/cell-renderers/number-formatter');
    expect(numberFormatter({ value: 1234567 } as ValueFormatterParams)).toBe(
      '1,234,567',
    );
  });

  it('numberFormatter formats decimals with thousands separator and 2 decimals', async () => {
    const { numberFormatter } =
      await import('~/components/ag-grid/cell-renderers/number-formatter');
    expect(numberFormatter({ value: 1234567.89 } as ValueFormatterParams)).toBe(
      '1,234,567.89',
    );
  });

  it('numberFormatter rounds aggregation FP noise to ≤2 decimals', async () => {
    const { numberFormatter } =
      await import('~/components/ag-grid/cell-renderers/number-formatter');
    expect(numberFormatter({ value: 12.456789 } as ValueFormatterParams)).toBe(
      '12.46',
    );
  });

  it('numberFormatter returns empty string for null/undefined/non-finite', async () => {
    const { numberFormatter } =
      await import('~/components/ag-grid/cell-renderers/number-formatter');
    expect(numberFormatter({ value: null } as ValueFormatterParams)).toBe('');
    expect(numberFormatter({ value: undefined } as ValueFormatterParams)).toBe(
      '',
    );
    expect(numberFormatter({ value: NaN } as ValueFormatterParams)).toBe('');
  });

  it('maps type=number to right-aligned numeric ColDef preset with comma formatter', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'qty', label: 'Qty', type: 'number' },
    ];
    const result = mapColumnsToColDefs(columns);
    const col = result[0]!;
    expect(col.type).toBe('numericColumn');
    expect(String(col.cellClass ?? '')).toContain('text-right');
    expect(String(col.headerClass ?? '')).toContain('text-right');
    expect(col.valueFormatter).toBeDefined();
    const formatter = col.valueFormatter as (
      params: ValueFormatterParams,
    ) => string;
    expect(formatter({ value: 1234 } as ValueFormatterParams)).toBe('1,234');
  });

  it('does not apply numeric preset to text columns (regression guard)', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [{ key: 'name', label: 'Name' }];
    const result = mapColumnsToColDefs(columns);
    const col = result[0]!;
    expect(col.type).toBeUndefined();
    expect(String(col.cellClass ?? '')).not.toContain('text-right');
    expect(col.valueFormatter).toBeUndefined();
  });

  it('maps render=phone to (XXX) XXX-XXXX formatter (regression guard)', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'phone', label: 'Phone', render: 'phone' },
    ];
    const result = mapColumnsToColDefs(columns);
    const col = result[0]!;
    const formatter = col.valueFormatter as (
      params: ValueFormatterParams,
    ) => string;
    expect(formatter({ value: '8085551234' } as ValueFormatterParams)).toBe(
      '(808) 555-1234',
    );
  });

  it('disables filter always; sortable defaults to true with opt-out support', async () => {
    const { mapColumnsToColDefs } =
      await import('~/components/ag-grid/column-mapper');
    const columns: ColumnConfig[] = [
      { key: 'name', label: 'Name' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'actions', label: 'Actions', sortable: false },
    ];
    const result = mapColumnsToColDefs(columns);

    // filter: false on every column, always
    for (const col of result) {
      expect(col.filter).toBe(false);
    }

    // sortable: true when unspecified (first three fixture entries)
    expect(result[0]!.sortable).toBe(true);
    expect(result[1]!.sortable).toBe(true);
    expect(result[2]!.sortable).toBe(true);

    // sortable: false only when explicitly opted out (actions column)
    expect(result[3]!.sortable).toBe(false);
  });
});
