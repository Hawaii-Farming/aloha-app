import type { ValueFormatterParams } from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';

// Detect TOTAL/aggregation rows so they render whole numbers (no decimals)
// while body rows keep their natural precision. Pinned-bottom rows OR rows
// whose first text field literally equals "TOTAL".
function isAggregationRow(
  data: Record<string, unknown> | undefined,
  node?: { rowPinned?: string | null } | null,
): boolean {
  if (node?.rowPinned) return true;
  if (!data) return false;
  return Object.values(data).some((v) => v === 'TOTAL');
}

export function CurrencyRenderer(props: CustomCellRendererProps) {
  const value = props.value as number | null;
  if (value == null) return null;
  if (value === 0) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-end font-mono">
        —
      </div>
    );
  }
  const formatted = Math.abs(value).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
  const isNeg = value < 0;

  return (
    <div className="flex h-full w-full items-center justify-end font-mono">
      {isNeg ? `-${formatted}` : formatted}
    </div>
  );
}

export function currencyFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  if (value === 0) return '—';
  const formatted = Math.abs(value).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function hoursFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  const isAgg = isAggregationRow(
    params.data as Record<string, unknown> | undefined,
    params.node,
  );
  if (isAgg) {
    return Math.round(value).toLocaleString('en-US');
  }
  return value.toFixed(1);
}
