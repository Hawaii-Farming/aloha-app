import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFetcher, useRevalidator } from 'react-router';

import { addDays, format, parseISO } from 'date-fns';
import { Check, ChevronDown, ChevronsUpDown, Plus, X } from 'lucide-react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import { Button } from '@aloha/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@aloha/ui/command';
import { FkCombobox } from '@aloha/ui/fk-combobox';
import { Form } from '@aloha/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@aloha/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@aloha/ui/sheet';
import { toast } from '@aloha/ui/sonner';
import { cn } from '@aloha/ui/utils';

import { dayOfWeekIndex, extractHHmm } from '~/lib/scheduler/wallclock-time';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, '0'),
);
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

interface CompactTimePickerProps {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}

function CompactTimePicker({
  value,
  onChange,
  placeholder,
}: CompactTimePickerProps) {
  const [h, m] = value ? value.split(':') : ['', ''];
  const commit = (nextH: string, nextM: string) => {
    if (!nextH && !nextM) return onChange('');
    onChange(`${nextH || '00'}:${nextM || '00'}`);
  };
  return (
    <div className="flex items-center gap-0.5" aria-label={placeholder}>
      <Select value={h ?? ''} onValueChange={(next) => commit(next, m ?? '')}>
        <SelectTrigger className="h-8 w-[58px] px-2 text-xs">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {HOUR_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground px-0.5 text-xs">:</span>
      <Select value={m ?? ''} onValueChange={(next) => commit(h ?? '', next)}>
        <SelectTrigger className="h-8 w-[58px] px-2 text-xs">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {MINUTE_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface CompactComboboxProps {
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}

function CompactCombobox({
  value,
  onChange,
  options,
  placeholder,
}: CompactComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-8 w-full justify-between px-2 text-xs font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search task…" className="h-9" />
          <CommandList>
            <CommandEmpty>No task found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === opt.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

type DayEntry = {
  date: string; // 'yyyy-MM-dd'
  start_time: string; // 'HH:mm' or ''
  stop_time: string; // 'HH:mm' or ''
  ops_task_id: string; // '' if empty
};

type WeeklyFormValues = {
  hr_employee_id: string;
  week_start: string; // 'yyyy-MM-dd' Sunday — anchors all day dates
  days: DayEntry[];
};

interface SchedulerCreatePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fkOptions: Record<string, Array<{ value: string; label: string }>>;
  subModuleDisplayName: string;
  accountSlug: string;
  /** yyyy-MM-dd Sunday — the currently-viewed week from `?week`. */
  currentWeek: string;
  /** When set, drawer opens in edit mode for this employee + currentWeek.
   * The employee selector is locked, prefill loads only that week's rows,
   * and submit replaces the week (delete+insert) instead of plain insert. */
  editEmployeeId?: string | null;
}

interface ScheduleHistoryRow {
  start_time?: string | null;
  stop_time?: string | null;
  ops_task_id?: string | null;
  date?: string | null;
}

function buildDefaultDays(currentWeek: string): DayEntry[] {
  const anchor = parseISO(currentWeek);
  return Array.from({ length: 7 }, (_, i) => ({
    date: format(addDays(anchor, i), 'yyyy-MM-dd'),
    start_time: '',
    stop_time: '',
    ops_task_id: '',
  }));
}

function buildDefaults(currentWeek: string): WeeklyFormValues {
  return {
    hr_employee_id: '',
    week_start: currentWeek,
    days: buildDefaultDays(currentWeek),
  };
}

function getWeekStartFromDate(dateStr: string): string {
  const dow = dayOfWeekIndex(dateStr);
  if (dow < 0) return dateStr;
  return format(addDays(parseISO(dateStr), -dow), 'yyyy-MM-dd');
}

// Inline (live) row error — only shown while user is editing the row.
// Soft: surfaces only logical conflicts (bad time order). "Required field"
// errors are deferred to submit so picking a single time doesn't immediately
// complain about the other one.
function computeInlineRowError(d: DayEntry): string | null {
  if (d.start_time && d.stop_time && d.start_time >= d.stop_time) {
    return 'End must be after start';
  }
  return null;
}

// Strict row check — used at submit time to block save and surface required
// fields once the user has tried to save.
function computeRowError(d: DayEntry): string | null {
  const hasAny = !!(d.start_time || d.stop_time || d.ops_task_id);
  if (!hasAny) return null;
  if (!d.date) return 'Date is required';
  if (!d.start_time) return 'Start time is required';
  if (!d.stop_time) return 'End time is required';
  if (d.start_time >= d.stop_time) return 'End must be after start';
  if (!d.ops_task_id) return 'Task is required';
  return null;
}

function isRowFilled(d: DayEntry): boolean {
  return !!(d.start_time || d.stop_time || d.ops_task_id);
}

// Returns the set of slot indices that overlap another slot on the same date.
function findOverlappingSlots(slots: DayEntry[]): Set<number> {
  const overlapping = new Set<number>();
  const byDate = new Map<string, number[]>();
  slots.forEach((s, i) => {
    if (!s.date || !s.start_time || !s.stop_time) return;
    if (s.start_time >= s.stop_time) return;
    const arr = byDate.get(s.date) ?? [];
    arr.push(i);
    byDate.set(s.date, arr);
  });
  for (const idxs of byDate.values()) {
    if (idxs.length < 2) continue;
    for (let a = 0; a < idxs.length; a++) {
      for (let b = a + 1; b < idxs.length; b++) {
        const sa = slots[idxs[a]!]!;
        const sb = slots[idxs[b]!]!;
        if (sa.start_time < sb.stop_time && sb.start_time < sa.stop_time) {
          overlapping.add(idxs[a]!);
          overlapping.add(idxs[b]!);
        }
      }
    }
  }
  return overlapping;
}

export function SchedulerCreatePanel({
  open,
  onOpenChange,
  fkOptions,
  subModuleDisplayName,
  accountSlug,
  currentWeek,
  editEmployeeId,
}: SchedulerCreatePanelProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const hasHandledSuccess = useRef(false);

  const isEdit = !!editEmployeeId;
  const employeeOptions = fkOptions['hr_employee_id'] ?? [];
  const taskOptions = fkOptions['ops_task_id'] ?? [];

  const form = useForm<WeeklyFormValues>({
    defaultValues: buildDefaults(currentWeek),
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'days',
  });

  const employeeId = useWatch({
    control: form.control,
    name: 'hr_employee_id',
  });
  const watchedDays = useWatch({ control: form.control, name: 'days' });
  const days: DayEntry[] = useMemo(
    () => (watchedDays as DayEntry[] | undefined) ?? [],
    [watchedDays],
  );

  const overlapping = useMemo(() => findOverlappingSlots(days), [days]);

  // After the user attempts to save once, escalate to strict checks
  // (required fields). Resets automatically when form.reset() is called.
  const isSubmitted = form.formState.isSubmitted;
  const rowErrors = useMemo(() => {
    const errs = new Map<number, string>();
    days.forEach((d, i) => {
      let err = isSubmitted ? computeRowError(d) : computeInlineRowError(d);
      if (!err && overlapping.has(i)) err = 'Overlaps another slot on this day';
      if (err) errs.set(i, err);
    });
    return errs;
  }, [days, isSubmitted, overlapping]);

  const filledCount = useMemo(() => days.filter(isRowFilled).length, [days]);

  const totalHours = useMemo(() => {
    return days.reduce((sum, d) => {
      if (!d.start_time || !d.stop_time || d.start_time >= d.stop_time) {
        return sum;
      }
      const [shStr, smStr] = d.start_time.split(':');
      const [ehStr, emStr] = d.stop_time.split(':');
      const sh = Number(shStr);
      const sm = Number(smStr);
      const eh = Number(ehStr);
      const em = Number(emStr);
      if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return sum;
      return sum + (eh * 60 + em - (sh * 60 + sm)) / 60;
    }, 0);
  }, [days]);

  // Lock employee to editEmployeeId when drawer opens in edit mode.
  useEffect(() => {
    if (!open) return;
    if (isEdit && editEmployeeId) {
      form.setValue('hr_employee_id', editEmployeeId, { shouldDirty: false });
    }
  }, [open, isEdit, editEmployeeId, form]);

  // Re-anchor week_start + day dates to currentWeek whenever the page's
  // selected week changes (or drawer opens), so the form mirrors the list view.
  useEffect(() => {
    if (!open) return;
    form.setValue('week_start', currentWeek, { shouldDirty: false });
    replace(buildDefaultDays(currentWeek));
  }, [open, currentWeek, form, replace]);

  // Justified useEffect #1: cross-system fetch on drawer open + employee change.
  // - Create mode: pull employee history (any week), use most-recent week
  //   as a "pattern" template, anchor each day's date to currentWeek.
  // - Edit mode: pull only the currentWeek rows for this employee.
  useEffect(() => {
    if (!open) return;
    if (!employeeId) return;
    const anchor = currentWeek;

    const controller = new AbortController();

    async function loadPrefill() {
      try {
        const params = new URLSearchParams({
          mode: 'detail',
          employeeId,
          orgId: accountSlug,
        });
        if (isEdit) params.set('weekStart', currentWeek);

        const res = await fetch(`/api/schedule-history?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: ScheduleHistoryRow[] };
        const rows = json.data ?? [];

        const seeded = buildDefaultDays(anchor);

        // Tracks how many slots already exist per dow (0..6). The base seeded
        // array has one slot per dow; the first hit fills it, subsequent hits
        // append extra slots.
        const slotsPerDow = new Array<number>(7).fill(1);

        if (isEdit) {
          // In edit mode the API already restricted rows to currentWeek.
          for (const row of rows) {
            if (!row.date) continue;
            const dow = dayOfWeekIndex(row.date);
            if (dow < 0 || dow > 6) continue;
            const base = seeded[dow]!;
            if (!base.start_time && !base.stop_time && !base.ops_task_id) {
              base.start_time = extractHHmm(row.start_time);
              base.stop_time = extractHHmm(row.stop_time);
              base.ops_task_id = row.ops_task_id ?? '';
            } else {
              seeded.push({
                date: base.date,
                start_time: extractHHmm(row.start_time),
                stop_time: extractHHmm(row.stop_time),
                ops_task_id: row.ops_task_id ?? '',
              });
              slotsPerDow[dow]! += 1;
            }
          }
          replace(seeded);
          return;
        }

        if (rows.length === 0) return;

        // Create mode: rows are sorted desc by start_time. Use the most
        // recent week as the pattern, and project it onto currentWeek's dates.
        const firstWithDate = rows.find((r) => r.date);
        if (!firstWithDate?.date) return;
        const targetWeekStart = getWeekStartFromDate(firstWithDate.date);

        for (const row of rows) {
          if (!row.date) continue;
          if (getWeekStartFromDate(row.date) !== targetWeekStart) continue;
          const dow = new Date(`${row.date}T00:00:00`).getDay();
          if (dow < 0 || dow > 6) continue;
          const base = seeded[dow]!;
          if (!base.start_time && !base.stop_time && !base.ops_task_id) {
            base.start_time = extractHHmm(row.start_time);
            base.stop_time = extractHHmm(row.stop_time);
            base.ops_task_id = row.ops_task_id ?? '';
          } else {
            seeded.push({
              date: base.date,
              start_time: extractHHmm(row.start_time),
              stop_time: extractHHmm(row.stop_time),
              ops_task_id: row.ops_task_id ?? '',
            });
            slotsPerDow[dow]! += 1;
          }
        }

        replace(seeded);
      } catch {
        // Aborted or network error — silent (drawer still works without prefill)
      }
    }

    loadPrefill();
    return () => controller.abort();
  }, [open, employeeId, accountSlug, currentWeek, isEdit, form, replace]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        form.reset(buildDefaults(currentWeek));
      }
      onOpenChange(nextOpen);
    },
    [form, currentWeek, onOpenChange],
  );

  // Justified useEffect #2: handle fetcher response. Refs must be read in
  // useEffect; mirrors the generic CreatePanel pattern.
  const fetcherData = fetcher.data as
    | { success: boolean; error?: string; errors?: unknown; count?: number }
    | undefined;
  const isSubmitting = fetcher.state !== 'idle';

  useEffect(() => {
    if (fetcher.state !== 'idle' || hasHandledSuccess.current) return;
    if (fetcherData === undefined) return;
    // Ignore fetcher results while the drawer is closed — prevents stale
    // error/success toasts from firing the next time the drawer reopens.
    if (!open) return;

    if (fetcherData.success) {
      hasHandledSuccess.current = true;
      const count = fetcherData.count ?? 0;
      const verb = isEdit ? 'Updated' : 'Created';
      toast.success(`${verb} ${count} ${count === 1 ? 'entry' : 'entries'}`);
      revalidator.revalidate();
      handleOpenChange(false);
    } else {
      hasHandledSuccess.current = true;
      toast.error(fetcherData.error ?? 'Failed to save schedule');
    }
  }, [fetcher.state, fetcherData, revalidator, handleOpenChange, isEdit, open]);

  // Reset success-tracking ref when a NEW submission starts, so the next
  // result is handled. (Not on drawer reopen — that would resurface the
  // previous failed submission's toast.)
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      hasHandledSuccess.current = false;
    }
  }, [fetcher.state]);

  const onSubmit = useCallback(
    (values: WeeklyFormValues) => {
      if (!values.hr_employee_id) {
        toast.error('Select an employee');
        return;
      }

      const filled = values.days.filter(isRowFilled);
      if (filled.length === 0) {
        toast.error('Add at least one day before saving');
        return;
      }

      const hasErrors = values.days.some((d) => computeRowError(d) !== null);
      if (hasErrors) {
        toast.error('Fix the highlighted day(s) before saving');
        return;
      }

      const hasOverlap = findOverlappingSlots(values.days).size > 0;
      if (hasOverlap) {
        toast.error('Fix overlapping slots before saving');
        return;
      }

      hasHandledSuccess.current = false;
      fetcher.submit(
        {
          accountSlug,
          hr_employee_id: values.hr_employee_id,
          entries: filled.map((d) => ({
            date: d.date,
            start_time: d.start_time,
            stop_time: d.stop_time,
            ops_task_id: d.ops_task_id,
          })),
          // Always send weekStart so the server uses replace-week semantics
          // (soft-delete existing planned rows in the week for this employee,
          // then insert). Prevents duplicate-key errors when the employee
          // already has any rows for the week.
          weekStart: currentWeek,
        },
        {
          method: 'POST',
          action: '/api/scheduler/create-weekly',
          encType: 'application/json',
        },
      );
    },
    [fetcher, accountSlug, currentWeek],
  );

  const submitVerb = isEdit ? 'Update' : 'Create';
  const submitLabel = isSubmitting
    ? 'Saving…'
    : `${submitVerb} ${filledCount} ${filledCount === 1 ? 'entry' : 'entries'}`;

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  // Reset the first slot of a day and remove any extra slots for that date.
  const resetDay = useCallback(
    (firstIndex: number, date: string) => {
      const current = (form.getValues('days') as DayEntry[]) ?? [];
      const extras: number[] = [];
      current.forEach((s, i) => {
        if (i !== firstIndex && s.date === date) extras.push(i);
      });
      // Remove from highest to lowest to keep indices stable.
      extras
        .sort((a, b) => b - a)
        .forEach((i) => {
          remove(i);
        });
      form.setValue(`days.${firstIndex}.start_time`, '', { shouldDirty: true });
      form.setValue(`days.${firstIndex}.stop_time`, '', { shouldDirty: true });
      form.setValue(`days.${firstIndex}.ops_task_id`, '', { shouldDirty: true });
    },
    [form, remove],
  );

  const removeSlot = useCallback(
    (i: number) => {
      remove(i);
    },
    [remove],
  );

  const appendSlotForDate = useCallback(
    (date: string) => {
      append({ date, start_time: '', stop_time: '', ops_task_id: '' });
    },
    [append],
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 rounded-none border-0 p-0 sm:w-[90%] sm:max-w-2xl sm:rounded-l-2xl sm:border-l"
        data-test="scheduler-create-panel"
      >
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle>
            {isEdit ? 'Edit' : 'Create'} {subModuleDisplayName}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={handleFormSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="border-b px-4 py-3 sm:px-6">
              <FkCombobox
                control={form.control}
                name="hr_employee_id"
                label="Employee"
                required
                options={employeeOptions}
                placeholder="Select employee…"
                disabled={isEdit}
              />
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-2 sm:px-6">
              {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                const dayDate = format(
                  addDays(parseISO(currentWeek), dow),
                  'yyyy-MM-dd',
                );
                const slotIndices: number[] = [];
                fields.forEach((f, i) => {
                  const slot = days[i];
                  if (slot?.date === dayDate) slotIndices.push(i);
                });
                if (slotIndices.length === 0) return null;
                const firstIndex = slotIndices[0]!;
                return (
                  <div key={dow} className="space-y-1.5">
                    <div className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase tabular-nums">
                      {DAY_NAMES[dow]} {format(parseISO(dayDate), 'dd')}
                    </div>
                    {slotIndices.map((i, slotPos) => {
                      const day = days[i] ?? {
                        date: dayDate,
                        start_time: '',
                        stop_time: '',
                        ops_task_id: '',
                      };
                      const filled = isRowFilled(day);
                      const err = rowErrors.get(i);
                      const isFirst = slotPos === 0;
                      const isLast = slotPos === slotIndices.length - 1;
                      const fieldKey = fields[i]?.id ?? `${dow}-${slotPos}`;
                      return (
                        <div
                          key={fieldKey}
                          data-test={`scheduler-day-card-${i}`}
                          className={cn(
                            'rounded-md border px-2.5 py-2 transition-colors',
                            filled
                              ? 'border-primary/50 bg-primary/5 ring-primary/20 shadow-sm ring-1'
                              : 'border-border/60 bg-muted/20 border-dashed opacity-70',
                            err && 'border-destructive ring-destructive/30',
                          )}
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Controller
                              control={form.control}
                              name={`days.${i}.start_time` as const}
                              render={({ field }) => (
                                <CompactTimePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Start time"
                                />
                              )}
                            />
                            <span className="text-muted-foreground text-xs">
                              →
                            </span>
                            <Controller
                              control={form.control}
                              name={`days.${i}.stop_time` as const}
                              render={({ field }) => (
                                <CompactTimePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="End time"
                                />
                              )}
                            />
                            <div className="min-w-[140px] flex-1">
                              <Controller
                                control={form.control}
                                name={`days.${i}.ops_task_id` as const}
                                render={({ field }) => (
                                  <CompactCombobox
                                    value={field.value}
                                    onChange={field.onChange}
                                    options={taskOptions}
                                    placeholder="Select task…"
                                  />
                                )}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => appendSlotForDate(dayDate)}
                              disabled={!isLast}
                              aria-label={`Add slot to ${DAY_NAMES[dow]}`}
                              title={
                                isLast
                                  ? 'Add another slot for this day'
                                  : 'More slots below'
                              }
                              data-test={`scheduler-day-add-${i}`}
                              className={cn(
                                'h-8 w-8 shrink-0 rounded-full',
                                isLast
                                  ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                  : 'border-dashed text-muted-foreground/40 disabled:opacity-100',
                              )}
                            >
                              {isLast ? (
                                <Plus className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                isFirst
                                  ? resetDay(firstIndex, dayDate)
                                  : removeSlot(i)
                              }
                              disabled={
                                isFirst &&
                                !filled &&
                                slotIndices.length === 1
                              }
                              aria-label={
                                isFirst
                                  ? `Reset ${DAY_NAMES[dow]}`
                                  : 'Remove slot'
                              }
                              title={isFirst ? 'Reset day' : 'Remove slot'}
                              data-test={`scheduler-day-reset-${i}`}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 shrink-0 rounded-full"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {err && (
                            <p className="text-destructive mt-1.5 text-xs">
                              {err}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center justify-between border-t px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="brand"
                  disabled={isSubmitting || filledCount === 0}
                  data-test="scheduler-weekly-submit"
                >
                  {submitLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
              <div
                className="bg-muted/50 flex items-baseline gap-1.5 rounded-md border px-3 py-1.5"
                data-test="scheduler-weekly-total"
              >
                <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                  Total
                </span>
                <span className="text-foreground text-base font-semibold tabular-nums">
                  {totalHours.toFixed(2)}
                </span>
                <span className="text-muted-foreground text-xs font-medium">
                  h
                </span>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
