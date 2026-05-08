import type { SupabaseClient } from '@supabase/supabase-js';

import { randomUUID } from 'crypto';

import type { Database } from '~/lib/database.types';
import {
  type EmployeeLookup,
  type HrPayrollInsert,
  buildPayrollRows,
} from '~/lib/payroll/run-payroll.server';
import {
  type HrbTabs,
  clearHrbTabs,
  exportSheetAsXlsx,
  fetchHrbTabs,
} from '~/lib/payroll/sheets-client.server';
import { getSupabaseServerAdminClient } from '~/lib/supabase/clients/server-admin-client.server';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';

const ALLOWED_ROLES = new Set(['Admin', 'Owner']);
const INSERT_BATCH_SIZE = 100;
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
// Total-cost reconciliation: any difference larger than this (rounded
// dollars) is reported as a discrepancy. Penny-level drift from float
// summation is tolerated.
const TOTAL_TOLERANCE_CENTS = 1;

type AdminClient = SupabaseClient<Database>;

interface ParsedRequest {
  accountSlug: string;
  expectedTotal: number;
}

async function parseRequest(request: Request): Promise<ParsedRequest> {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const accountSlug = body.accountSlug;
  if (typeof accountSlug !== 'string' || !accountSlug) {
    throw new Response('accountSlug required', { status: 400 });
  }
  const expectedTotalRaw = body.expectedTotal;
  const expectedTotal =
    typeof expectedTotalRaw === 'number'
      ? expectedTotalRaw
      : Number(expectedTotalRaw);
  if (!Number.isFinite(expectedTotal) || expectedTotal <= 0) {
    throw new Response('expectedTotal must be a positive number', {
      status: 400,
    });
  }
  return { accountSlug, expectedTotal };
}

async function loadEmployees(
  admin: AdminClient,
  orgId: string,
): Promise<EmployeeLookup[]> {
  const { data, error } = await admin
    .from('hr_employee')
    .select(
      'id, payroll_id, hr_department_id, hr_work_authorization_id, wc, pay_structure, overtime_threshold, first_name, last_name',
    )
    .eq('org_id', orgId);
  if (error) throw new Error(`Employee lookup: ${error.message}`);
  return (data ?? [])
    .filter((e) => !!e.payroll_id)
    .map((e) => ({
      id: e.id,
      payroll_id: e.payroll_id ?? '',
      hr_department_id: e.hr_department_id,
      hr_work_authorization_id: e.hr_work_authorization_id,
      wc: e.wc,
      pay_structure: e.pay_structure,
      overtime_threshold: e.overtime_threshold,
      full_name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
    }));
}

async function findConflicts(
  admin: AdminClient,
  orgId: string,
  rows: HrPayrollInsert[],
) {
  const checkDates = [...new Set(rows.map((r) => r.check_date))];
  const invoiceNumbers = [
    ...new Set(
      rows.map((r) => r.invoice_number).filter((v): v is string => !!v),
    ),
  ];
  const { data, error } = await admin
    .from('hr_payroll')
    .select('hr_employee_id, check_date, invoice_number, employee_name')
    .eq('org_id', orgId)
    .in('check_date', checkDates)
    .in(
      'invoice_number',
      invoiceNumbers.length > 0 ? invoiceNumbers : ['__none__'],
    );
  if (error) throw new Error(`Conflict check: ${error.message}`);
  const existingKeys = new Set(
    (data ?? []).map(
      (r) => `${r.hr_employee_id}|${r.check_date}|${r.invoice_number ?? ''}`,
    ),
  );
  return rows
    .filter((r) =>
      existingKeys.has(
        `${r.hr_employee_id}|${r.check_date}|${r.invoice_number ?? ''}`,
      ),
    )
    .map((r) => ({
      employee_name: r.employee_name,
      payroll_id: r.payroll_id,
      check_date: r.check_date,
      invoice_number: r.invoice_number,
    }));
}

interface InvoiceTotal {
  invoice_number: string | null;
  check_date: string;
  total_cost: number;
  rows: number;
}

function summarizeByInvoice(rows: HrPayrollInsert[]): InvoiceTotal[] {
  const byKey = new Map<string, InvoiceTotal>();
  for (const r of rows) {
    const key = `${r.invoice_number ?? '—'}|${r.check_date}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.total_cost += r.total_cost;
      existing.rows += 1;
    } else {
      byKey.set(key, {
        invoice_number: r.invoice_number,
        check_date: r.check_date,
        total_cost: r.total_cost,
        rows: 1,
      });
    }
  }
  return Array.from(byKey.values()).sort((a, b) => b.total_cost - a.total_cost);
}

async function insertBatched(
  admin: AdminClient,
  rows: (HrPayrollInsert & { created_by: string; updated_by: string })[],
) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
    const chunk = rows.slice(i, i + INSERT_BATCH_SIZE);
    const { error } = await admin.from('hr_payroll').insert(chunk);
    if (error) {
      return {
        ok: false as const,
        error: `Insert failed: ${error.message}`,
        partialInserted: inserted,
      };
    }
    inserted += chunk.length;
  }
  return { ok: true as const, inserted };
}

export const action = async ({ request }: { request: Request }) => {
  const t0 = Date.now();
  const log = (step: string, extra?: Record<string, unknown>) => {
    console.info(`[payroll/run] +${Date.now() - t0}ms ${step}`, extra ?? '');
  };

  if (request.method !== 'POST') {
    return Response.json(
      { success: false, error: 'Method not allowed' },
      { status: 405 },
    );
  }

  let parsed: ParsedRequest;
  try {
    parsed = await parseRequest(request);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json(
      { success: false, error: (e as Error).message },
      { status: 400 },
    );
  }
  log('parsed request', { accountSlug: parsed.accountSlug });

  const sheetId = process.env.HRB_INPUT_SHEET_ID;
  if (!sheetId) {
    return Response.json(
      { success: false, error: 'HRB_INPUT_SHEET_ID not configured' },
      { status: 500 },
    );
  }

  const client = getSupabaseServerClient(request);
  const workspace = await loadOrgWorkspace({
    orgSlug: parsed.accountSlug,
    client,
    request,
  });
  if (!ALLOWED_ROLES.has(workspace.currentOrg.access_level_id)) {
    return Response.json(
      { success: false, error: 'Forbidden — admin or owner required' },
      { status: 403 },
    );
  }

  const orgId = workspace.currentOrg.org_id;
  const actingEmployeeId = workspace.currentOrg.employee_id;
  const admin = getSupabaseServerAdminClient();
  log('auth ok');

  let employees: EmployeeLookup[];
  try {
    employees = await loadEmployees(admin, orgId);
  } catch (e) {
    return Response.json(
      { success: false, error: (e as Error).message },
      { status: 500 },
    );
  }
  log('loaded employees', { count: employees.length });

  let tabs: HrbTabs;
  try {
    tabs = await fetchHrbTabs(sheetId);
  } catch (e) {
    return Response.json(
      { success: false, error: `Sheets API: ${(e as Error).message}` },
      { status: 502 },
    );
  }
  log('fetched HRB tabs', {
    $data: tabs.$data.length,
    NetPay: tabs.NetPay.length,
    Hours: tabs.Hours.length,
  });

  const { rows, missing } = buildPayrollRows(tabs, employees, {
    orgId,
    payrollProcessor: 'HRB',
  });
  log('built rows', { rows: rows.length, missing: missing.length });

  if (missing.length > 0) {
    return Response.json(
      {
        success: false,
        error: 'Missing employees in register',
        missingEmployees: missing,
      },
      { status: 422 },
    );
  }

  if (rows.length === 0) {
    return Response.json({
      success: true,
      rowsInserted: 0,
      batchId: null,
      message: 'No payroll rows in source',
    });
  }

  // Reconcile against the total the user typed in. Computed in cents to
  // avoid float drift. Mirrors the $data!Total Cost grand total in HRB.
  const computedCents = Math.round(
    rows.reduce((sum, r) => sum + r.total_cost * 100, 0),
  );
  const expectedCents = Math.round(parsed.expectedTotal * 100);
  const deltaCents = computedCents - expectedCents;
  if (Math.abs(deltaCents) > TOTAL_TOLERANCE_CENTS) {
    return Response.json(
      {
        success: false,
        error: 'Total cost mismatch — payroll not imported',
        reconciliation: {
          expected: expectedCents / 100,
          computed: computedCents / 100,
          delta: deltaCents / 100,
          rowCount: rows.length,
          invoices: summarizeByInvoice(rows),
        },
      },
      { status: 409 },
    );
  }

  let conflicts;
  try {
    conflicts = await findConflicts(admin, orgId, rows);
  } catch (e) {
    return Response.json(
      { success: false, error: (e as Error).message },
      { status: 500 },
    );
  }
  if (conflicts.length > 0) {
    return Response.json(
      {
        success: false,
        error: 'Some payroll rows already exist for these employees',
        conflicts,
      },
      { status: 409 },
    );
  }

  const batchId = randomUUID();
  const stamped = rows.map((r) => ({
    ...r,
    created_by: actingEmployeeId,
    updated_by: actingEmployeeId,
  }));

  log('inserting rows', { count: stamped.length });
  const insertResult = await insertBatched(admin, stamped);
  log('insert done', { inserted: insertResult.ok ? insertResult.inserted : 0 });
  if (!insertResult.ok) {
    return Response.json(
      {
        success: false,
        error: insertResult.error,
        partialInserted: insertResult.partialInserted,
      },
      { status: 500 },
    );
  }

  const maxCheckDate = rows
    .map((r) => r.check_date)
    .sort()
    .pop()!;
  const archivePath = `${orgId}/${batchId}__${maxCheckDate}.xlsx`;
  const warnings: string[] = [];
  const bucket = process.env.HRB_ARCHIVE_BUCKET ?? 'payroll-archives';

  try {
    const xlsxBytes = await exportSheetAsXlsx(sheetId);
    const { error: uploadErr } = await admin.storage
      .from(bucket)
      .upload(archivePath, xlsxBytes, { contentType: XLSX_MIME });
    if (uploadErr) warnings.push(`Archive upload failed: ${uploadErr.message}`);
  } catch (e) {
    warnings.push(`Archive failed: ${(e as Error).message}`);
  }

  log('archive uploaded');

  try {
    await clearHrbTabs(sheetId);
  } catch (e) {
    warnings.push(`Source sheet clear failed: ${(e as Error).message}`);
  }
  log('source cleared, returning');

  return Response.json({
    success: true,
    rowsInserted: insertResult.inserted,
    batchId,
    archivePath,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
};
