/** Render an ISO/JS date string as MM/DD/YY — e.g. "03/24/25". */
export function formatDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
}

/** Render an ISO/JS timestamp as MM/DD/YY h:mm AM — e.g. "03/24/25, 9:57 AM". */
export function formatDateTime(value: string): string {
  const d = new Date(value);
  return d.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}
