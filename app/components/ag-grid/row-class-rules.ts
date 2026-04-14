import type { CellClassParams, RowClassParams } from 'ag-grid-community';

/**
 * Row/cell class rule helpers. Historically these added semantic colors
 * (red/amber/green) to rows and cells based on value. Colors have been
 * removed app-wide per design direction — these now return empty rule
 * maps so existing call sites compile without applying any class.
 */

export const otWarningRowClassRules: Record<
  string,
  (params: RowClassParams) => boolean
> = {};

export function varianceHighlightCellClassRules(
  _thresholdRed = 5,
  _thresholdAmber = 1,
): Record<string, (params: CellClassParams) => boolean> {
  return {};
}

export function scoreColorCellClassRules(): Record<
  string,
  (params: CellClassParams) => boolean
> {
  return {};
}

export const statusCellClassRules: Record<
  string,
  (params: CellClassParams) => boolean
> = {};
