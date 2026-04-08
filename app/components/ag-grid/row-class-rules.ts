import type { CellClassParams, RowClassParams } from 'ag-grid-community';

/** Row turns amber when employee exceeds OT threshold */
export const otWarningRowClassRules: Record<
  string,
  (params: RowClassParams) => boolean
> = {
  'bg-amber-500/10': (params) => {
    return params.data?.is_over_ot_threshold === true;
  },
};

/** Cell text turns red for large variance, amber for moderate variance */
export function varianceHighlightCellClassRules(
  thresholdRed = 5,
  thresholdAmber = 1,
): Record<string, (params: CellClassParams) => boolean> {
  return {
    'text-red-500 font-semibold': (params) => {
      const val = Math.abs(Number(params.value) || 0);
      return val >= thresholdRed;
    },
    'text-amber-500': (params) => {
      const val = Math.abs(Number(params.value) || 0);
      return val >= thresholdAmber && val < thresholdRed;
    },
  };
}

/** Cell text color based on status value */
export const statusCellClassRules: Record<
  string,
  (params: CellClassParams) => boolean
> = {
  'text-green-600 dark:text-green-400': (params) => {
    const val = String(params.value ?? '').toLowerCase();
    return val === 'approved' || val === 'active';
  },
  'text-amber-600 dark:text-amber-400': (params) => {
    const val = String(params.value ?? '').toLowerCase();
    return val === 'pending';
  },
  'text-red-600 dark:text-red-400': (params) => {
    const val = String(params.value ?? '').toLowerCase();
    return val === 'denied' || val === 'rejected' || val === 'inactive';
  },
};
