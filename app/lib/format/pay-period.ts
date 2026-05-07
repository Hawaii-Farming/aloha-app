/** Pay-period range label as `MM/DD/YY – MM/DD/YY`. Compact form fits the
 * navbar pill and keeps the dropdown scannable at a glance. */
export function formatPayPeriodLabel(startStr: string, endStr: string): string {
  return `${formatShort(startStr)} – ${formatShort(endStr)}`;
}

function formatShort(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, year, month, day] = m;
  return `${month}/${day}/${year!.slice(-2)}`;
}
