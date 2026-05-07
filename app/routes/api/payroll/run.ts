import { randomUUID } from 'crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '~/lib/database.types';
import {
  type EmployeeLookup,
  type HrPayrollInsert,
  buildPayrollRows,
} from '~/lib/payroll/run-payroll.server';
import {
  clearHrbTabs,
  exportSheetAsXlsx,
  fetchHrbTabs,
  type HrbTabs,
} from '~/lib/payroll/sheets-client.server';
import { parseXlsxToHrbTabs } from '~/lib/payroll/xlsx-parser.server';
import { getSupabaseServerAdminClient } from '~/lib/supabase/clients/server-admin-client.server';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';

const ALLOWED_ROLES = new Set(['Admin', 'Owner']);
const INSERT_BATCH_SIZE = 100;
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type AdminClient = SupabaseClient<Database>;
type Source = 'google' | 'upload';

interface ParsedRequest {
  accountSlug: string;
  source: Source;
  uploadBytes?: Uint8Array;
  uploadFilename?: string;
}

async function parseRequest(request: Request): Promise<ParsedRequest> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file');
    const accountSlug = form.get('accountSlug');
    if (!(file instanceof File)) {
      throw new Response('file required', { status: 400 });
    }
    if (typeof accountSlug !== 'string' || !accountSlug) {
      throw new Response('accountSlug required', { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    return {
      accountSlug,
      source: 'upload',
      uploadBytes: bytes,
      uploadFilename: file.name,
    };
  }
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const accountSlug = body.accountSlug as string | undefined;
  if (!accountSlug) {
    throw new Response('accountSlug required', { status: 400 });
  }
  return { accountSlug, source: 'google' };
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

  const sheetId = process.env.HRB_INPUT_SHEET_ID;
  if (parsed.source === 'google' && !sheetId) {
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

  let employees: EmployeeLookup[];
  try {
    employees = await loadEmployees(admin, orgId);
  } catch (e) {
    return Response.json(
      { success: false, error: (e as Error).message },
      { status: 500 },
    );
  }

  let tabs: HrbTabs;
  try {
    if (parsed.source === 'google') {
      tabs = await fetchHrbTabs(sheetId!);
    } else {
      tabs = parseXlsxToHrbTabs(parsed.uploadBytes!);
    }
  } catch (e) {
    return Response.json(
      {
        success: false,
        error:
          parsed.source === 'google'
            ? `Sheets API: ${(e as Error).message}`
            : `Xlsx parse: ${(e as Error).message}`,
      },
      { status: parsed.source === 'google' ? 502 : 400 },
    );
  }

  const { rows, missing } = buildPayrollRows(tabs, employees, {
    orgId,
    payrollProcessor: 'HRB',
  });

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

  const insertResult = await insertBatched(admin, stamped);
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
    const xlsxBytes =
      parsed.source === 'google'
        ? await exportSheetAsXlsx(sheetId!)
        : parsed.uploadBytes!;
    const { error: uploadErr } = await admin.storage
      .from(bucket)
      .upload(archivePath, xlsxBytes, { contentType: XLSX_MIME });
    if (uploadErr) warnings.push(`Archive upload failed: ${uploadErr.message}`);
  } catch (e) {
    warnings.push(`Archive failed: ${(e as Error).message}`);
  }

  if (parsed.source === 'google') {
    try {
      await clearHrbTabs(sheetId!);
    } catch (e) {
      warnings.push(`Source sheet clear failed: ${(e as Error).message}`);
    }
  }

  return Response.json({
    success: true,
    rowsInserted: insertResult.inserted,
    batchId,
    archivePath,
    source: parsed.source,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
};
