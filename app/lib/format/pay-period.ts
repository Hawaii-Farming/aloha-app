import { format, parseISO } from 'date-fns';

/**
 * Compact pay-period range label. Handles same-month, different-month-same-year,
 * and cross-year ranges. Input strings are YYYY-MM-DD.
 *
 *   2026-03-15 / 2026-03-28  -> "Mar 15 – 28, 2026"
 *   2026-03-28 / 2026-04-11  -> "Mar 28 – Apr 11, 2026"
 *   2025-12-28 / 2026-01-10  -> "Dec 28, 2025 – Jan 10, 2026"
 */
export function formatPayPeriodLabel(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return `${startStr} – ${endStr}`;
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  if (sameYear) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}
