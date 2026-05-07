import { type ElementType, useCallback, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import { useRevalidator, useRouteLoaderData } from 'react-router';

import {
  Archive,
  CheckCircle2,
  CloudDownload,
  Eraser,
  FileSpreadsheet,
  Loader2,
  Upload,
  Zap,
} from 'lucide-react';
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

interface TimelineStep {
  icon: ElementType;
  title: string;
  desc: string;
}

const GOOGLE_STEPS: TimelineStep[] = [
  {
    icon: CloudDownload,
    title: 'Read source sheet',
    desc: 'Pulls all 6 HRB tabs over the Sheets API',
  },
  {
    icon: Archive,
    title: 'Archive snapshot',
    desc: 'Saves a dated .xlsx copy to Storage',
  },
  {
    icon: Eraser,
    title: 'Clear source tabs',
    desc: 'Empties the sheet so the next run starts clean',
  },
];

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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="items-center text-center sm:items-center sm:text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
              <Zap className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <DialogTitle className="text-lg">Run payroll</DialogTitle>
            <DialogDescription className="max-w-xs text-balance">
              Validate against the employee register and insert merged rows.
              Existing rows are never modified.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="google" className="mt-3">
            <TabsList className="grid h-10 w-full grid-cols-2">
              <TabsTrigger
                value="google"
                disabled={pending}
                className="gap-1.5"
              >
                <CloudDownload className="h-3.5 w-3.5" />
                Google Drive
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                disabled={pending}
                className="gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload .xlsx
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="google"
              className="mt-4 flex h-[20rem] flex-col justify-between gap-4"
            >
              <div className="flex flex-col items-center gap-3">
                <ol className="w-full">
                  {GOOGLE_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const isLast = i === GOOGLE_STEPS.length - 1;
                    return (
                      <li
                        key={step.title}
                        className="relative flex gap-3 pb-4 last:pb-0"
                      >
                        <div className="flex flex-col items-center">
                          <div className="bg-muted ring-background relative z-10 flex h-8 w-8 items-center justify-center rounded-full ring-4">
                            <Icon
                              className="text-muted-foreground h-4 w-4"
                              strokeWidth={2}
                            />
                          </div>
                          {!isLast && (
                            <div className="bg-border absolute top-8 bottom-0 w-px" />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-foreground text-sm leading-none font-medium">
                            {step.title}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {step.desc}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
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

            <TabsContent
              value="upload"
              className="mt-4 flex h-[20rem] flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <p className="text-foreground text-xs font-medium">
                  Required tabs in your{' '}
                  <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
                    .xlsx
                  </code>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['$data', 'NetPay', 'Hours', 'PTOBank', 'WC', 'TDI'].map(
                    (tab) => (
                      <span
                        key={tab}
                        className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px]"
                      >
                        {tab}
                      </span>
                    ),
                  )}
                </div>
                <p className="text-muted-foreground text-[11px]">
                  The uploaded file is archived. Source is left untouched.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={pending}
                className={`group hover:border-primary hover:bg-accent flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 transition-colors ${
                  uploadFile ? 'border-primary bg-accent/50' : 'border-border'
                }`}
                data-test="run-payroll-upload-dropzone"
              >
                {uploadFile ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-foreground max-w-[16rem] truncate px-3 text-sm font-medium">
                        {uploadFile.name}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {(uploadFile.size / 1024).toFixed(1)} KB · click to
                        replace
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-muted group-hover:bg-background flex h-10 w-10 items-center justify-center rounded-full transition-colors">
                      <Upload className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-foreground text-sm font-medium">
                        Choose an .xlsx file
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Must match the HRB template
                      </p>
                    </div>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="hidden"
                data-test="run-payroll-upload-file"
              />

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
                    <CheckCircle2 className="mr-2 h-4 w-4" />
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
