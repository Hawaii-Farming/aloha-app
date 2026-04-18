/** Pay-period range label: `YYYY-MM-DD – YYYY-MM-DD`. ISO format keeps the
 * dropdown scannable (fixed width, chronologically aligned). */
export function formatPayPeriodLabel(startStr: string, endStr: string): string {
  return `${startStr} – ${endStr}`;
}
