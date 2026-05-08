import { type ElementType, useCallback, useState } from 'react';

import { createPortal } from 'react-dom';

import { useRevalidator, useRouteLoaderData } from 'react-router';

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CloudDownload,
  Eraser,
  Info,
  Loader2,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@aloha/ui/alert-dialog';
import { Button } from '@aloha/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@aloha/ui/dialog';
import { Input } from '@aloha/ui/input';
import { Label } from '@aloha/ui/label';

interface PayrollConflict {
  employee_name: string;
  payroll_id: string;
  check_date: string;
  invoice_number: string | null;
}

interface ReconciliationDetail {
  expected: number;
  computed: number;
  delta: number;
  rowCount: number;
  invoices: {
    invoice_number: string | null;
    check_date: string;
    total_cost: number;
    rows: number;
  }[];
}

interface RunPayrollResponse {
  success: boolean;
  rowsInserted?: number;
  batchId?: string | null;
  archivePath?: string;
  warnings?: string[];
  error?: string;
  missingEmployees?: { payroll_id: string; full_name: string }[];
  conflicts?: PayrollConflict[];
  reconciliation?: ReconciliationDetail;
  message?: string;
}

interface RunPayrollButtonProps {
  accountSlug: string;
}

const ALLOWED = new Set(['Admin', 'Owner']);

function getSlot(id: string): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.getElementById(id);
}

interface TimelineStep {
  icon: ElementType;
  label: string;
}

const GOOGLE_STEPS: TimelineStep[] = [
  { icon: CloudDownload, label: 'Read' },
  { icon: Archive, label: 'Archive' },
  { icon: Eraser, label: 'Clear' },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}

export function RunPayrollButton({ accountSlug }: RunPayrollButtonProps) {
  const layoutData = useRouteLoaderData('routes/workspace/layout') as
    | { workspace?: { currentOrg?: { access_level_id?: string } } }
    | undefined;
  const accessLevel = layoutData?.workspace?.currentOrg?.access_level_id ?? '';
  const allowed = ALLOWED.has(accessLevel);

  const revalidator = useRevalidator();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [missing, setMissing] = useState<
    { payroll_id: string; full_name: string }[] | null
  >(null);
  const [conflicts, setConflicts] = useState<PayrollConflict[] | null>(null);
  const [reconciliation, setReconciliation] =
    useState<ReconciliationDetail | null>(null);
  const [expectedTotalInput, setExpectedTotalInput] = useState('');
  const [status, setStatus] = useState<{
    kind: 'success' | 'info' | 'error';
    message: string;
    warnings?: string[];
  } | null>(null);

  // Accept "$12,345.67", "12345.67", "12,345" — strip everything but
  // digits and the decimal point.
  const parsedTotal = (() => {
    const cleaned = expectedTotalInput.replace(/[^0-9.]/g, '');
    if (!cleaned || cleaned === '.') return NaN;
    return Number(cleaned);
  })();
  const expectedTotal = parsedTotal;
  const expectedTotalValid =
    Number.isFinite(expectedTotal) && expectedTotal > 0;

  const formatTotalInput = (raw: string) => {
    // Keep the user's literal trailing decimal/zeros while injecting
    // thousands separators on the integer portion.
    const cleaned = raw.replace(/[^0-9.]/g, '');
    if (!cleaned) return '';
    const firstDot = cleaned.indexOf('.');
    const intPart =
      firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
    const fracPart =
      firstDot === -1
        ? ''
        : '.' + cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
    const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return intWithCommas + fracPart;
  };

  const resetModalState = useCallback(() => {
    setReconciliation(null);
    setExpectedTotalInput('');
    setStatus(null);
  }, []);

  const handleResult = useCallback(
    (res: Response, json: RunPayrollResponse) => {
      if (res.status === 422 && json.missingEmployees?.length) {
        setMissing(json.missingEmployees);
        return;
      }
      if (res.status === 409 && json.reconciliation) {
        setReconciliation(json.reconciliation);
        return;
      }
      if (res.status === 409 && json.conflicts?.length) {
        setConflicts(json.conflicts);
        return;
      }
      if (!json.success) {
        setStatus({
          kind: 'error',
          message: json.error ?? 'Payroll run failed',
        });
        return;
      }
      const inserted = json.rowsInserted ?? 0;
      if (inserted === 0) {
        setStatus({
          kind: 'info',
          message: json.message ?? 'No payroll rows to import',
        });
      } else {
        setStatus({
          kind: 'success',
          message: `Imported ${inserted} payroll row${inserted === 1 ? '' : 's'}`,
          warnings: json.warnings,
        });
      }
      revalidator.revalidate();
    },
    [revalidator],
  );

  const runFromGoogle = useCallback(async () => {
    if (!expectedTotalValid) return;
    setPending(true);
    setReconciliation(null);
    setStatus(null);
    try {
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountSlug, expectedTotal }),
        signal: AbortSignal.timeout(90_000),
      });
      let json: RunPayrollResponse;
      try {
        json = (await res.json()) as RunPayrollResponse;
      } catch {
        throw new Error(`Server returned ${res.status} (non-JSON body)`);
      }
      handleResult(res, json);
    } catch (e) {
      setStatus({
        kind: 'error',
        message: `Payroll run failed: ${(e as Error).message}`,
      });
    } finally {
      setPending(false);
    }
  }, [accountSlug, expectedTotal, expectedTotalValid, handleResult]);

  const desktopSlot = getSlot('workspace-navbar-actions-slot');
  const mobileSlot = getSlot('workspace-mobile-header-actions-slot');

  if (!allowed) return null;

  const button = (
    <Button
      variant="outline"
      onClick={() => setOpen(true)}
      disabled={pending}
      data-test="run-payroll"
      aria-label="Run payroll"
      className="h-9 shrink-0 rounded-full"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CloudDownload className="h-4 w-4" />
      )}
      <span className="hidden lg:ml-1.5 lg:inline">Run payroll</span>
    </Button>
  );

  return (
    <>
      {desktopSlot && createPortal(button, desktopSlot)}
      {mobileSlot && createPortal(button, mobileSlot)}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (pending) return;
          if (!o) resetModalState();
          setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center sm:items-center sm:text-center">
            <div className="bg-primary/10 ring-primary/20 mb-2 flex h-12 w-12 items-center justify-center rounded-full ring-4">
              <CloudDownload className="text-primary h-6 w-6" />
            </div>
            <DialogTitle className="text-lg">Run payroll</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Pulls this period&rsquo;s payroll from the HRB Google Sheet.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-4">
            <ol className="flex items-center justify-center gap-3">
              {GOOGLE_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isLast = i === GOOGLE_STEPS.length - 1;
                return (
                  <li key={step.label} className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                        <Icon
                          className="text-muted-foreground h-4 w-4"
                          strokeWidth={2}
                        />
                      </div>
                      <span className="text-muted-foreground text-[11px] leading-none">
                        {step.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="bg-border mb-5 h-px w-8" />
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-col gap-2">
              <Label htmlFor="expected-total" className="text-sm">
                Expected total cost
              </Label>
              <div className="relative">
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  id="expected-total"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={expectedTotalInput}
                  onChange={(e) => {
                    setExpectedTotalInput(formatTotalInput(e.target.value));
                    setReconciliation(null);
                  }}
                  disabled={pending}
                  data-test="run-payroll-expected-total"
                  className="pl-6 text-right font-mono tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Sum of <code className="font-mono">$data!Total Cost</code>{' '}
                from the HRB sheet. The import is rejected if the computed
                total disagrees by more than a cent.
              </p>
            </div>

            {reconciliation && (
              <div
                className="border-destructive/50 bg-destructive/5 rounded-md border p-3 text-sm"
                data-test="run-payroll-reconciliation"
              >
                <div className="text-destructive flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Total cost mismatch — nothing was imported
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 font-mono text-xs">
                  <dt className="text-muted-foreground">Expected</dt>
                  <dd className="col-span-2 text-right">
                    {formatCurrency(reconciliation.expected)}
                  </dd>
                  <dt className="text-muted-foreground">Computed</dt>
                  <dd className="col-span-2 text-right">
                    {formatCurrency(reconciliation.computed)}
                  </dd>
                  <dt className="text-destructive">Delta</dt>
                  <dd
                    className={`col-span-2 text-right font-semibold ${
                      reconciliation.delta >= 0
                        ? 'text-destructive'
                        : 'text-amber-600 dark:text-amber-500'
                    }`}
                  >
                    {reconciliation.delta >= 0 ? '+' : ''}
                    {formatCurrency(reconciliation.delta)}
                  </dd>
                  <dt className="text-muted-foreground">Rows</dt>
                  <dd className="col-span-2 text-right">
                    {reconciliation.rowCount}
                  </dd>
                </dl>
                {reconciliation.invoices.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
                      Per-invoice breakdown ({reconciliation.invoices.length})
                    </summary>
                    <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto font-mono text-[11px]">
                      {reconciliation.invoices.map((inv) => (
                        <li
                          key={`${inv.invoice_number ?? '—'}-${inv.check_date}`}
                          className="flex justify-between gap-2"
                        >
                          <span className="text-muted-foreground truncate">
                            {inv.invoice_number ?? '—'} · {inv.check_date} ·{' '}
                            {inv.rows} row{inv.rows === 1 ? '' : 's'}
                          </span>
                          <span>{formatCurrency(inv.total_cost)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <p className="text-muted-foreground mt-2 text-xs">
                  Compare the breakdown against the source sheet to find the
                  off invoice. Re-enter the correct total once fixed.
                </p>
              </div>
            )}

            {status && (
              <div
                className={`flex flex-col gap-1 rounded-md border p-3 text-sm ${
                  status.kind === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                    : status.kind === 'info'
                      ? 'border-border bg-muted/40 text-foreground'
                      : 'border-destructive/50 bg-destructive/5 text-destructive'
                }`}
                data-test={`run-payroll-status-${status.kind}`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {status.kind === 'success' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : status.kind === 'info' ? (
                    <Info className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span>{status.message}</span>
                </div>
                {status.warnings && status.warnings.length > 0 && (
                  <ul className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                    {status.warnings.map((w, i) => (
                      <li key={i}>· {w}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {status?.kind === 'success' ? (
              <Button
                onClick={() => {
                  resetModalState();
                  setOpen(false);
                }}
                className="w-full"
                data-test="run-payroll-done"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Done
              </Button>
            ) : (
              <Button
                onClick={runFromGoogle}
                disabled={pending || !expectedTotalValid}
                className="w-full"
                data-test="run-payroll-google"
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <CloudDownload className="mr-2 h-4 w-4" />
                    Fetch &amp; run
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={missing !== null}
        onOpenChange={(o) => !o && setMissing(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Missing employees in register</AlertDialogTitle>
            <AlertDialogDescription>
              The payroll source references {missing?.length ?? 0} employee
              {missing?.length === 1 ? '' : 's'} not found in the register. Add
              them (or fix their payroll IDs) before re-running.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-muted-foreground max-h-64 overflow-y-auto rounded-md border p-3 text-sm">
            <ul className="space-y-1">
              {missing?.map((m) => (
                <li key={m.payroll_id}>
                  <span className="text-foreground">{m.full_name}</span>{' '}
                  <span className="text-muted-foreground">
                    ({m.payroll_id})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMissing(null)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={conflicts !== null}
        onOpenChange={(o) => !o && setConflicts(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Payroll already imported</AlertDialogTitle>
            <AlertDialogDescription>
              {conflicts?.length ?? 0} row
              {conflicts?.length === 1 ? '' : 's'} from the source already exist
              in payroll. Delete them first if you need to re-import, or remove
              the duplicates from the source.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-muted-foreground max-h-64 overflow-y-auto rounded-md border p-3 text-sm">
            <ul className="space-y-1">
              {conflicts?.map((c) => (
                <li key={`${c.payroll_id}-${c.check_date}-${c.invoice_number}`}>
                  <span className="text-foreground">{c.employee_name}</span>{' '}
                  <span className="text-muted-foreground">
                    ({c.payroll_id}) — check {c.check_date}
                    {c.invoice_number ? `, inv ${c.invoice_number}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setConflicts(null)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
