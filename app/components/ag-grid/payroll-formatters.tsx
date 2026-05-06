import type { ValueFormatterParams } from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';

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
  return Math.round(value).toLocaleString('en-US');
}

export function CurrencyDeltaRenderer(props: CustomCellRendererProps) {
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
