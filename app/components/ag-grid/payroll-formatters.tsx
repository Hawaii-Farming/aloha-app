import type { ValueFormatterParams } from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';

export function CurrencyRenderer(props: CustomCellRendererProps) {
  const value = props.value as number | null;
  if (value == null) return null;
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const isNeg = value < 0;

  return (
    <div className="flex h-full w-full items-center font-mono">
      <span className="text-muted-foreground shrink-0">$</span>
      <span className="flex-1 text-right">
        {isNeg ? `(${formatted})` : formatted}
      </span>
    </div>
  );
}

export function currencyFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value < 0) return `($${formatted})`;
  return `$${formatted}`;
}

export function hoursFormatter(params: ValueFormatterParams): string {
  const value = params.value as number | null;
  if (value == null) return '';
  return value.toFixed(1);
}
