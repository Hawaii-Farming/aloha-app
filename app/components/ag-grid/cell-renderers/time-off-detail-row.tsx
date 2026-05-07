import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react';

import { Badge } from '@aloha/ui/badge';
import { Separator } from '@aloha/ui/separator';

import { formatDate } from '~/lib/format/date';

interface TimeOffDetailRowProps {
  data: Record<string, unknown>;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]!.toUpperCase()}${parts[parts.length - 1]![0]!.toUpperCase()}`;
  }
  return fullName.slice(0, 2).toUpperCase();
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'Approved':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'Denied':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-amber-500" />;
  }
}

function statusVariant(status: string): 'success' | 'destructive' | 'warning' {
  if (status === 'Approved') return 'success';
  if (status === 'Denied') return 'destructive';
  return 'warning';
}

function DaysPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-lg border px-3 py-1.5 ${color}`}
    >
      <span className="text-lg leading-tight font-semibold">{value}</span>
      <span className="text-[10px] leading-tight opacity-70">{label}</span>
    </div>
  );
}

export function TimeOffDetailRow({ data }: TimeOffDetailRowProps) {
  // Joined fields come from the postgrest embeds in hr-time-off.config.ts:
  //   subject:hr_employee!hr_employee_id(...) -> subject_*
  //   requester:hr_employee!requested_by(...)  -> requester_*
  //   reviewer:hr_employee!reviewed_by(...)    -> reviewer_*
  const firstName = (data['subject_first_name'] as string) ?? '';
  const lastName = (data['subject_last_name'] as string) ?? '';
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    ((data['subject_preferred_name'] as string) ?? '');
  const photoUrl = data['subject_profile_photo_url'] as string | undefined;
  const initials = getInitials(fullName);
  const status = (data['status'] as string) ?? 'Pending';
  const deptName = data['subject_hr_department_id'] as string | undefined;
  const workAuth = data['subject_hr_work_authorization_id'] as
    | string
    | undefined;
  const compManager = data['subject_compensation_manager_id'] as
    | string
    | undefined;

  const startDate = data['start_date'] as string | undefined;
  const returnDate = data['return_date'] as string | undefined;
  const ptoDays = data['pto_days'] as number | null;
  const nonPtoDays = data['non_pto_days'] as number | null;
  const sickDays = data['sick_leave_days'] as number | null;

  const reason = data['request_reason'] as string | undefined;
  const denialReason = data['denial_reason'] as string | undefined;
  const notes = data['notes'] as string | undefined;

  const requestedByName = data['requester_preferred_name'] as
    | string
    | undefined;
  const reviewedByName = data['reviewer_preferred_name'] as string | undefined;
  const requestedAt = data['requested_at'] as string | undefined;
  const reviewedAt = data['reviewed_at'] as string | undefined;

  return (
    <div className="flex gap-5 px-4 py-4">
      {/* Left: Avatar + Status */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={fullName}
            loading="lazy"
            decoding="async"
            className="ring-border h-14 w-14 rounded-full object-cover ring-2"
            onError={(e) => {
              const target = e.currentTarget;
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className =
                  'bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold ring-2 ring-border';
                fallback.textContent = initials;
                parent.replaceChild(fallback, target);
              }
            }}
          />
        ) : (
          <div className="bg-primary/10 text-primary ring-border flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold ring-2">
            {initials}
          </div>
        )}
        <Badge variant={statusVariant(status)} className="text-[10px]">
          <StatusIcon status={status} />
          <span className="ml-1 capitalize">{status}</span>
        </Badge>
      </div>

      {/* Center: Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Row 1: Name + badges */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{fullName}</span>
          {deptName && (
            <Badge variant="secondary" className="text-[11px]">
              {deptName}
            </Badge>
          )}
          {workAuth && (
            <Badge variant="outline" className="text-[11px]">
              {workAuth}
            </Badge>
          )}
        </div>

        {/* Row 2: Dates + Days pills */}
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            {startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(startDate)}
              </span>
            )}
            {returnDate && (
              <>
                <span className="text-muted-foreground/50">→</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(returnDate)}
                </span>
              </>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            {ptoDays != null && ptoDays > 0 && (
              <DaysPill
                label="PTO"
                value={ptoDays}
                color="border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400"
              />
            )}
            {nonPtoDays != null && nonPtoDays > 0 && (
              <DaysPill
                label="Req Off"
                value={nonPtoDays}
                color="border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400"
              />
            )}
            {sickDays != null && sickDays > 0 && (
              <DaysPill
                label="Sick"
                value={sickDays}
                color="border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
              />
            )}
          </div>
        </div>

        {/* Row 3: Reason + denial */}
        <div className="flex flex-col gap-1">
          {reason && (
            <div className="text-muted-foreground flex items-start gap-1.5 text-xs">
              <FileText className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="text-foreground">{reason}</span>
            </div>
          )}
          {denialReason && (
            <div className="flex items-start gap-1.5 text-xs text-red-500 dark:text-red-400">
              <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{denialReason}</span>
            </div>
          )}
          {notes && (
            <div className="text-muted-foreground flex items-start gap-1.5 text-xs">
              <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="italic">{notes}</span>
            </div>
          )}
        </div>

        {/* Row 4: Audit trail */}
        <div className="text-muted-foreground/60 flex flex-wrap items-center gap-3 text-[11px]">
          {compManager && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Mgr: {compManager}
            </span>
          )}
          {requestedByName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Requested by {requestedByName}
              {requestedAt && ` on ${formatDate(requestedAt)}`}
            </span>
          )}
          {reviewedByName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Reviewed by {reviewedByName}
              {reviewedAt && ` on ${formatDate(reviewedAt)}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
