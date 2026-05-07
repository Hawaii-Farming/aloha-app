import { useCallback, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import { useRevalidator, useRouteLoaderData } from 'react-router';

import { CloudDownload, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

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
  DialogHeader,
  DialogTitle,
} from '@aloha/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@aloha/ui/tabs';

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
  archivePath?: string;
  warnings?: string[];
  error?: string;
  missingEmployees?: { payroll_id: string; full_name: string }[];
  conflicts?: PayrollConflict[];
  message?: string;
  source?: 'google' | 'upload';
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
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [missing, setMissing] = useState<
    { payroll_id: string; full_name: string }[] | null
  >(null);
  const [conflicts, setConflicts] = useState<PayrollConflict[] | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResult = useCallback(
    (res: Response, json: RunPayrollResponse) => {
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
      if (json.warnings?.length) {
        for (const w of json.warnings) toast.warning(w);
      }
      revalidator.revalidate();
      setOpen(false);
    },
    [revalidator],
  );

  const runFromGoogle = useCallback(async () => {
    setPending(true);
    try {
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountSlug }),
      });
      const json = (await res.json()) as RunPayrollResponse;
      handleResult(res, json);
    } catch (e) {
      toast.error(`Payroll run failed: ${(e as Error).message}`);
    } finally {
      setPending(false);
    }
  }, [accountSlug, handleResult]);

  const runFromUpload = useCallback(async () => {
    if (!uploadFile) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.append('accountSlug', accountSlug);
      fd.append('file', uploadFile);
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        body: fd,
      });
      const json = (await res.json()) as RunPayrollResponse;
      handleResult(res, json);
    } catch (e) {
      toast.error(`Payroll run failed: ${(e as Error).message}`);
    } finally {
      setPending(false);
    }
  }, [accountSlug, handleResult, uploadFile]);

  const desktopSlot = getSlot('workspace-navbar-filter-slot');
  const mobileSlot = getSlot('workspace-mobile-header-filter-slot');

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
          if (!pending) setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Run payroll</DialogTitle>
            <DialogDescription>
              Pull the latest HRB data, validate against the employee
              register, and insert merged rows. Existing rows are not
              modified.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="google" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="google" disabled={pending}>
                From Google Drive
              </TabsTrigger>
              <TabsTrigger value="upload" disabled={pending}>
                From Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="mt-4 space-y-3">
              <p className="text-muted-foreground text-sm">
                Reads the configured HRB sheet, archives a snapshot, and
                clears the source tabs after import.
              </p>
              <Button
                onClick={runFromGoogle}
                disabled={pending}
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
            </TabsContent>

            <TabsContent value="upload" className="mt-4 space-y-3">
              <p className="text-muted-foreground text-sm">
                Upload an .xlsx export from HRB matching the
                HF_Payroll_Template tabs ($data, NetPay, Hours, PTOBank, WC,
                TDI). The uploaded file is archived; nothing is cleared.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-2 file:text-foreground hover:file:bg-muted/80"
                data-test="run-payroll-upload-file"
              />
              {uploadFile && (
                <p className="text-muted-foreground text-xs">
                  {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
              <Button
                onClick={runFromUpload}
                disabled={pending || !uploadFile}
                className="w-full"
                data-test="run-payroll-upload-submit"
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Run from file
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
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
              {missing?.length === 1 ? '' : 's'} not found in the register.
              Add them (or fix their payroll IDs) before re-running.
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
              {conflicts?.length === 1 ? '' : 's'} from the source already
              exist in payroll. Delete them first if you need to re-import,
              or remove the duplicates from the source.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-muted-foreground max-h-64 overflow-y-auto rounded-md border p-3 text-sm">
            <ul className="space-y-1">
              {conflicts?.map((c) => (
                <li
                  key={`${c.payroll_id}-${c.check_date}-${c.invoice_number}`}
                >
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
