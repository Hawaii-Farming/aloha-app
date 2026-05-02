// `ops_task_schedule.start_time` and `stop_time` are stored as plain
// PostgreSQL `TIMESTAMP` (no time zone) — wall-clock values. These
// helpers parse and produce wall-clock strings without going through
// `Date`, because `new Date('YYYY-MM-DDTHH:mm:ss')` is interpreted in
// the JS runtime's local zone, which differs between the SSR server
// (UTC on Cloud Run) and the browser (HST), and would silently shift
// the value when round-tripped.

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function extractHHmm(ts: string | null | undefined): string {
  if (!ts) return '';
  const m = /T(\d{2}):(\d{2})/.exec(ts);
  return m ? `${m[1]}:${m[2]}` : '';
}

export function extractDate(ts: string | null | undefined): string {
  if (!ts) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(ts);
  return m?.[1] ?? '';
}

export function dayOfWeekIndex(dateStr: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return -1;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCDay();
}

export function dayOfWeekName(dateStr: string): string {
  const idx = dayOfWeekIndex(dateStr);
  return DOW_NAMES[idx] ?? '';
}

export function diffHours(
  start: string | null | undefined,
  stop: string | null | undefined,
): number | null {
  if (!start || !stop) return null;
  const s = /T(\d{2}):(\d{2})/.exec(start);
  const e = /T(\d{2}):(\d{2})/.exec(stop);
  if (!s || !e) return null;
  const sMin = Number(s[1]) * 60 + Number(s[2]);
  const eMin = Number(e[1]) * 60 + Number(e[2]);
  return Math.round(((eMin - sMin) / 60) * 100) / 100;
}

// Add `n` calendar days to a 'yyyy-MM-dd' string.
export function addDaysToDate(date: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() + n);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Add `n` calendar days to a wall-clock 'yyyy-MM-ddTHH:mm:ss' string,
// preserving the time-of-day portion exactly.
export function addDaysWallclock(ts: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(ts);
  if (!m) return ts;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() + n);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const ss = m[6] ?? '00';
  return `${yyyy}-${mm}-${dd}T${m[4]}:${m[5]}:${ss}`;
}
