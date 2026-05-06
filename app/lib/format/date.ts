/** Render an ISO/JS date string as a short calendar date — e.g. "Mar 24, 2025". */
export function formatDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Render an ISO/JS timestamp as date + time — e.g. "Mar 24, 2025, 9:57 AM". */
export function formatDateTime(value: string): string {
  const d = new Date(value);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
