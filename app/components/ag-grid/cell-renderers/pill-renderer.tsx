import type { CustomCellRendererProps } from 'ag-grid-react';
import { format, parseISO } from 'date-fns';

export type PillColor =
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'blue'
  | 'rose'
  | 'lime'
  | 'purple'
  | 'gray'
  | 'red';

/**
 * Plain text cell — neutral formatting, no color.
 */
function renderText(
  value: string,
  options?: { truncate?: boolean; align?: 'left' | 'right' },
) {
  const justify = options?.align === 'right' ? 'justify-end' : '';
  return (
    <span
      className={`flex h-full items-center text-sm ${justify} ${options?.truncate ? 'truncate' : ''}`}
      title={options?.truncate ? value : undefined}
    >
      {value}
    </span>
  );
}

/**
 * Returns a plain-text cell renderer. Color argument retained for API
 * compatibility with existing call sites but is ignored.
 */
export function makePillRenderer(
  _color: PillColor,
  options?: { truncate?: boolean },
) {
  return function PillCellRenderer(props: CustomCellRendererProps) {
    const raw = props.value as string | number | null | undefined;
    if (raw == null || raw === '') return null;
    return renderText(String(raw), options);
  };
}

/**
 * Categorical value — plain text with proper case.
 */
export function HashPillRenderer(props: CustomCellRendererProps) {
  const raw = props.value as string | number | null | undefined;
  if (raw == null || raw === '') return null;

  const value = String(raw);
  const isNumeric = typeof raw === 'number';
  const display = isNumeric
    ? value
    : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return renderText(display, isNumeric ? { align: 'right' } : undefined);
}

/**
 * Date value — formatted plain text.
 */
export function DatePillRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;

  try {
    return renderText(format(parseISO(value), 'MM/dd/yy'));
  } catch {
    return null;
  }
}

/**
 * Email value — plain lowercase text, truncated.
 */
export function EmailPillRenderer(props: CustomCellRendererProps) {
  const value = props.value as string | null | undefined;
  if (!value) return null;
  return renderText(value.toLowerCase(), { truncate: true });
}
