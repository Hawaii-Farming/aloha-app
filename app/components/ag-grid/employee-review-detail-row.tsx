import { format, parseISO } from 'date-fns';
import { Lock } from 'lucide-react';

import { Badge } from '@aloha/ui/badge';

type RowData = Record<string, unknown>;

interface EmployeeReviewDetailRowProps {
  data: RowData;
}

function scoreDisplay(value: unknown): { text: string; className: string } {
  const num = Number(value);
  if (num === 1)
    return { text: '1 - Below', className: 'text-red-600 dark:text-red-400' };
  if (num === 2)
    return {
      text: '2 - Meets',
      className: 'text-amber-600 dark:text-amber-400',
    };
  if (num === 3)
    return {
      text: '3 - Exceeds',
      className: 'text-green-600 dark:text-green-400',
    };
  return { text: String(value ?? ''), className: '' };
}

function formatDate(d: unknown): string {
  if (!d) return '';
  try {
    return format(parseISO(String(d)), 'MM/dd/yyyy');
  } catch {
    return String(d);
  }
}

export function EmployeeReviewDetailRow({
  data,
}: EmployeeReviewDetailRowProps) {
  const fullName = String(data.subject_preferred_name ?? '');
  const deptName = String(data.subject_hr_department_id ?? '');
  const year = data.review_year;
  const quarter = data.review_quarter;
  const quarterLabel =
    year != null && quarter != null ? `${year} Q${quarter}` : '';
  const avg = data.average != null ? Number(data.average).toFixed(1) : '';
  const notes = data.notes ? String(data.notes) : '';
  const leadName = data.lead_preferred_name
    ? String(data.lead_preferred_name)
    : '';
  const isLocked = data.is_locked === true;
  const createdAt = formatDate(data.created_at);
  const updatedAt = formatDate(data.updated_at);

  return (
    <div className="px-6 py-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm font-semibold">{fullName}</span>
        {deptName ? (
          <Badge variant="secondary" className="text-[11px]">
            {deptName}
          </Badge>
        ) : null}
        <span className="text-muted-foreground text-xs">{quarterLabel}</span>
        {isLocked ? (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Lock className="h-3.5 w-3.5" />
            <span>Locked</span>
          </div>
        ) : null}
      </div>

      {/* Scores grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(['productivity', 'attendance', 'quality', 'engagement'] as const).map(
          (key) => {
            const score = scoreDisplay(data[key]);
            return (
              <div key={key} className="rounded-lg border px-3 py-2">
                <div className="text-muted-foreground text-[10px] capitalize">
                  {key}
                </div>
                <div className={`text-sm font-semibold ${score.className}`}>
                  {score.text}
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* Average */}
      <div className="mt-3 flex items-center gap-4">
        <div>
          <span className="text-muted-foreground text-xs">Average: </span>
          <span className="text-sm font-semibold">{avg}</span>
        </div>
      </div>

      {/* Notes */}
      {notes ? (
        <div className="mt-3">
          <div className="text-muted-foreground text-[10px]">Notes</div>
          <div className="text-foreground mt-0.5 text-xs">{notes}</div>
        </div>
      ) : null}

      {/* Metadata */}
      <div className="text-muted-foreground/60 mt-3 flex flex-wrap items-center gap-4 text-[11px]">
        {leadName ? <span>Lead: {leadName}</span> : null}
        {createdAt ? <span>Created: {createdAt}</span> : null}
        {updatedAt ? <span>Updated: {updatedAt}</span> : null}
      </div>
    </div>
  );
}

export default EmployeeReviewDetailRow;
