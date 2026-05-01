import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFetcher, useRevalidator } from 'react-router';

import { addDays, format, parse, parseISO } from 'date-fns';
import { Check, ChevronsUpDown, Calendar as CalendarIcon } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@aloha/ui/button';
import { Calendar } from '@aloha/ui/calendar';
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

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, '0'),
);
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

interface CompactDatePickerProps {
  value: string;
  onChange: (next: string) => void;
}

function CompactDatePicker({ value, onChange }: CompactDatePickerProps) {
  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-8 max-w-[170px] justify-start gap-2 px-2 text-xs font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
          {selected ? format(selected, 'EEE, MMM d') : 'Pick date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
        />
      </PopoverContent>
    </Popover>
  );
}

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
      <Select
        value={h ?? ''}
        onValueChange={(next) => commit(next, m ?? '')}
      >
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
      <Select
        value={m ?? ''}
        onValueChange={(next) => commit(h ?? '', next)}
      >
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
  return { hr_employee_id: '', days: buildDefaultDays(currentWeek) };
}

function extractHHmm(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getWeekStartFromDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const dow = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - dow);
  return format(start, 'yyyy-MM-dd');
}

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

export function SchedulerCreatePanel({
  open,
  onOpenChange,
  fkOptions,
  subModuleDisplayName,
  accountSlug,
  currentWeek,
}: SchedulerCreatePanelProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const hasHandledSuccess = useRef(false);

  const employeeOptions = fkOptions['hr_employee_id'] ?? [];
  const taskOptions = fkOptions['ops_task_id'] ?? [];

  const form = useForm<WeeklyFormValues>({
    defaultValues: buildDefaults(currentWeek),
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

  const rowErrors = useMemo(() => {
    const errs = new Map<number, string>();
    days.forEach((d, i) => {
      const err = computeRowError(d);
      if (err) errs.set(i, err);
    });
    return errs;
  }, [days]);

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

  // Justified useEffect #1: cross-system fetch on drawer open + employee change.
  // The /api/schedule-history endpoint lives outside the form state machine,
  // so a watcher-driven effect is the cleanest path. Cancel via AbortController.
  useEffect(() => {
    if (!open) return;
    if (!employeeId) return;

    const controller = new AbortController();

    async function loadPrefill() {
      try {
        const res = await fetch(
          `/api/schedule-history?mode=detail&employeeId=${encodeURIComponent(
            employeeId,
          )}&orgId=${encodeURIComponent(accountSlug)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const json = (await res.json()) as { data?: ScheduleHistoryRow[] };
        const rows = json.data ?? [];
        if (rows.length === 0) return;

        // Rows are sorted desc by start_time. Pick the most recent week start.
        const firstWithDate = rows.find((r) => r.date);
        if (!firstWithDate?.date) return;
        const targetWeekStart = getWeekStartFromDate(firstWithDate.date);

        // Reset day cards to blank for current week (date stays anchored to
        // currentWeek) before applying prefill so re-selecting employee
        // doesn't accumulate stale rows.
        const seeded = buildDefaultDays(currentWeek);

        for (const row of rows) {
          if (!row.date) continue;
          if (getWeekStartFromDate(row.date) !== targetWeekStart) continue;
          const dow = new Date(`${row.date}T00:00:00`).getDay();
          if (dow < 0 || dow > 6) continue;
          const day = seeded[dow];
          if (!day) continue;
          // Don't overwrite if already prefilled by an earlier (more recent) row.
          if (day.start_time || day.stop_time || day.ops_task_id) continue;
          day.start_time = extractHHmm(row.start_time);
          day.stop_time = extractHHmm(row.stop_time);
          day.ops_task_id = row.ops_task_id ?? '';
        }

        form.setValue('days', seeded, { shouldDirty: false });
      } catch {
        // Aborted or network error — silent (drawer still works without prefill)
      }
    }

    loadPrefill();
    return () => controller.abort();
  }, [open, employeeId, accountSlug, currentWeek, form]);

  // Justified useEffect #2: handle fetcher response. Refs must be read in
  // useEffect; mirrors the generic CreatePanel pattern.
  const fetcherData = fetcher.data as
    | { success: boolean; error?: string; errors?: unknown; count?: number }
    | undefined;
  const isSubmitting = fetcher.state !== 'idle';

  useEffect(() => {
    if (fetcher.state !== 'idle' || hasHandledSuccess.current) return;
    if (fetcherData === undefined) return;

    if (fetcherData.success) {
      hasHandledSuccess.current = true;
      const count = fetcherData.count ?? 0;
      toast.success(`Created ${count} ${count === 1 ? 'entry' : 'entries'}`);
      revalidator.revalidate();
      onOpenChange(false);
      form.reset(buildDefaults(currentWeek));
    } else {
      hasHandledSuccess.current = true;
      toast.error(fetcherData.error ?? 'Failed to save schedule');
    }
  }, [
    fetcher.state,
    fetcherData,
    revalidator,
    onOpenChange,
    form,
    currentWeek,
  ]);

  // Justified useEffect #3: reset success-tracking ref when drawer reopens.
  useEffect(() => {
    if (open && fetcher.state === 'idle') {
      hasHandledSuccess.current = false;
    }
  }, [open, fetcher.state]);

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
        },
        {
          method: 'POST',
          action: '/api/scheduler/create-weekly',
          encType: 'application/json',
        },
      );
    },
    [fetcher, accountSlug],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        form.reset(buildDefaults(currentWeek));
      }
      onOpenChange(nextOpen);
    },
    [form, currentWeek, onOpenChange],
  );

  const submitLabel = isSubmitting
    ? 'Saving…'
    : `Create ${filledCount} ${filledCount === 1 ? 'entry' : 'entries'}`;

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 rounded-none border-0 p-0 sm:w-[90%] sm:max-w-2xl sm:rounded-l-2xl sm:border-l"
        data-test="scheduler-create-panel"
      >
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle>Create {subModuleDisplayName}</SheetTitle>
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
              />
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2 sm:px-6">
              {days.map((day, i) => {
                const filled = isRowFilled(day);
                const err = rowErrors.get(i);
                return (
                  <div
                    key={i}
                    data-test={`scheduler-day-card-${i}`}
                    className={cn(
                      'rounded-md border px-2.5 py-2',
                      filled && 'border-primary/30 bg-muted/30',
                      err && 'border-destructive',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {DAY_NAMES[i]}
                      </span>
                      <Controller
                        control={form.control}
                        name={`days.${i}.date` as const}
                        render={({ field }) => (
                          <CompactDatePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
                      <span className="text-muted-foreground text-xs">→</span>
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
                    </div>

                    {err && (
                      <p className="text-destructive mt-1.5 text-xs">{err}</p>
                    )}
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
                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
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
