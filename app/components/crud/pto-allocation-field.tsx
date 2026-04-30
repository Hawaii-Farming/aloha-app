import { useCallback, useMemo } from 'react';

import { useFormContext, useWatch } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';

interface PtoAllocationFieldProps {
  label: string;
}

const CATEGORIES = [
  { key: 'pto_days', label: 'PTO days', color: '#2563eb' },
  { key: 'sick_leave_days', label: 'Sick days', color: '#d97706' },
  { key: 'non_pto_days', label: 'Unpaid days', color: '#6b7280' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

function toNumber(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function diffInDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const ms = e.getTime() - s.getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function PtoAllocationField({ label }: PtoAllocationFieldProps) {
  const { control, setValue } = useFormContext();

  const [startDate, returnDate, ptoRaw, sickRaw, unpaidRaw] = useWatch({
    control,
    name: [
      'start_date',
      'return_date',
      'pto_days',
      'sick_leave_days',
      'non_pto_days',
    ],
  }) as [string, string, unknown, unknown, unknown];

  const total = diffInDays(startDate, returnDate);

  const values: Record<CategoryKey, number> = useMemo(
    () => ({
      pto_days: toNumber(ptoRaw),
      sick_leave_days: toNumber(sickRaw),
      non_pto_days: toNumber(unpaidRaw),
    }),
    [ptoRaw, sickRaw, unpaidRaw],
  );

  const used = values.pto_days + values.sick_leave_days + values.non_pto_days;
  const remaining = total - used;

  const handleChange = useCallback(
    (key: CategoryKey, raw: string) => {
      const next = toNumber(raw);
      const others = (Object.keys(values) as CategoryKey[])
        .filter((k) => k !== key)
        .reduce((sum, k) => sum + values[k], 0);
      const max = Math.max(0, total - others);
      setValue(key, Math.min(next, max), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue, total, values],
  );

  const disabled = total <= 0;

  const statusText =
    total <= 0
      ? 'Set start and return dates'
      : remaining > 0
        ? `${remaining} remaining`
        : remaining < 0
          ? `${Math.abs(remaining)} over`
          : 'Fully allocated';

  const statusColor =
    total <= 0
      ? 'text-muted-foreground'
      : remaining === 0
        ? 'text-emerald-600 dark:text-emerald-500'
        : 'text-destructive';

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{label}</div>

      <div className="text-muted-foreground text-xs">
        Total days requested:{' '}
        <span className="text-foreground font-medium">{total}</span>
      </div>

      <div className="flex flex-col gap-3">
        {CATEGORIES.map((cat) => {
          const others = (Object.keys(values) as CategoryKey[])
            .filter((k) => k !== cat.key)
            .reduce((sum, k) => sum + values[k], 0);
          const max = Math.max(0, total - others);
          const current = Math.min(values[cat.key], max);

          return (
            <div
              key={cat.key}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 rounded-sm"
                  style={{ background: cat.color }}
                />
                <span className="text-sm">{cat.label}</span>
              </div>
              <Select
                value={String(current)}
                onValueChange={(v) => handleChange(cat.key, v)}
                disabled={disabled}
              >
                <SelectTrigger
                  className="w-20"
                  data-test={`pto-allocation-${cat.key}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: max + 1 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <div className="bg-muted/50 rounded-md p-3">
        <div className="bg-border mb-3 flex h-2.5 overflow-hidden rounded-full">
          {values.pto_days > 0 && (
            <div
              className="transition-[width]"
              style={{
                width: `${(values.pto_days / Math.max(total, 1)) * 100}%`,
                background: '#2563eb',
              }}
            />
          )}
          {values.sick_leave_days > 0 && (
            <div
              className="transition-[width]"
              style={{
                width: `${(values.sick_leave_days / Math.max(total, 1)) * 100}%`,
                background: '#d97706',
              }}
            />
          )}
          {values.non_pto_days > 0 && (
            <div
              className="transition-[width]"
              style={{
                width: `${(values.non_pto_days / Math.max(total, 1)) * 100}%`,
                background: '#6b7280',
              }}
            />
          )}
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span data-test="pto-allocation-allocated">
            Allocated: {used} of {total}
          </span>
          <span
            className={`font-medium ${statusColor}`}
            data-test="pto-allocation-status"
          >
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
