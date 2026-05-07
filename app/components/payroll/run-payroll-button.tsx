import { useCallback, useState } from 'react';

import { createPortal } from 'react-dom';

import { useRevalidator, useRouteLoaderData } from 'react-router';

import { CloudDownload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@aloha/ui/alert-dialog';
import { Button } from '@aloha/ui/button';

interface PayrollConflict {
  employee_name: string;
  payroll_id: string;
  check_date: string;
  invoice_number: string | null;
}

interface RunPayrollResponse {
  success: boolean;
  rowsInserted?: number;
  batchId?: string | null;
  error?: string;
  missingEmployees?: { payroll_id: string; full_name: string }[];
  conflicts?: PayrollConflict[];
  message?: string;
}

interface RunPayrollButtonProps {
  accountSlug: string;
}

const ALLOWED = new Set(['Admin', 'Owner']);

function getSlot(id: string): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.getElementById(id);
}

export function RunPayrollButton({ accountSlug }: RunPayrollButtonProps) {
  const layoutData = useRouteLoaderData('routes/workspace/layout') as
    | { workspace?: { currentOrg?: { access_level_id?: string } } }
    | undefined;
  const accessLevel = layoutData?.workspace?.currentOrg?.access_level_id ?? '';
  const allowed = ALLOWED.has(accessLevel);

  const revalidator = useRevalidator();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [missing, setMissing] = useState<
    { payroll_id: string; full_name: string }[] | null
  >(null);
  const [conflicts, setConflicts] = useState<PayrollConflict[] | null>(null);

  const runPayroll = useCallback(async () => {
    setPending(true);
    try {
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountSlug }),
      });
      const json = (await res.json()) as RunPayrollResponse;

      if (res.status === 422 && json.missingEmployees?.length) {
        setMissing(json.missingEmployees);
        return;
      }
      if (res.status === 409 && json.conflicts?.length) {
        setConflicts(json.conflicts);
        return;
      }
      if (!json.success) {
        toast.error(json.error ?? 'Payroll run failed');
        return;
      }
      const inserted = json.rowsInserted ?? 0;
      if (inserted === 0) {
        toast.info(json.message ?? 'No payroll rows to import');
      } else {
        toast.success(
          `Imported ${inserted} payroll row${inserted === 1 ? '' : 's'}`,
        );
      }
      revalidator.revalidate();
    } catch (e) {
      toast.error(`Payroll run failed: ${(e as Error).message}`);
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  }, [accountSlug, revalidator]);

  const desktopSlot = getSlot('workspace-navbar-filter-slot');
  const mobileSlot = getSlot('workspace-mobile-header-filter-slot');

  if (!allowed) return null;

  const button = (
    <Button
      variant="outline"
      onClick={() => setConfirmOpen(true)}
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run payroll?</AlertDialogTitle>
            <AlertDialogDescription>
              This fetches the latest data from the HRB Google Sheet, validates
              it against the employee register, and inserts merged rows into the
              payroll table. Existing rows are not modified or deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runPayroll} disabled={pending}>
              {pending ? 'Running…' : 'Run'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={missing !== null}
        onOpenChange={(open) => !open && setMissing(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Missing employees in register</AlertDialogTitle>
            <AlertDialogDescription>
              The HRB sheet references {missing?.length ?? 0} employee
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
        onOpenChange={(open) => !open && setConflicts(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Payroll already imported</AlertDialogTitle>
            <AlertDialogDescription>
              {conflicts?.length ?? 0} row
              {conflicts?.length === 1 ? '' : 's'} from the source sheet already
              exist in payroll. Delete them first if you need to re-import, or
              remove the duplicates from the source sheet.
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
