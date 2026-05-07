import { randomUUID } from 'crypto';

import {
  type EmployeeLookup,
  buildPayrollRows,
} from '~/lib/payroll/run-payroll.server';
import { fetchHrbTabs } from '~/lib/payroll/sheets-client.server';
import { getSupabaseServerAdminClient } from '~/lib/supabase/clients/server-admin-client.server';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';

const ALLOWED_ROLES = new Set(['admin', 'owner']);
const INSERT_BATCH_SIZE = 100;

export const action = async ({ request }: { request: Request }) => {
  if (request.method !== 'POST') {
    return Response.json(
      { success: false, error: 'Method not allowed' },
      { status: 405 },
    );
  }

  const sheetId = process.env.HRB_INPUT_SHEET_ID;
  if (!sheetId) {
    return Response.json(
      { success: false, error: 'HRB_INPUT_SHEET_ID not configured' },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const accountSlug = body.accountSlug as string | undefined;
  if (!accountSlug) {
    return Response.json(
      { success: false, error: 'accountSlug required' },
      { status: 400 },
    );
  }

  const client = getSupabaseServerClient(request);
  const workspace = await loadOrgWorkspace({
    orgSlug: accountSlug,
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

  const { data: empData, error: empErr } = await admin
    .from('hr_employee')
    .select(
      'id, payroll_id, hr_department_id, hr_work_authorization_id, wc, pay_structure, overtime_threshold, first_name, last_name',
    )
    .eq('org_id', orgId);
  if (empErr) {
    return Response.json(
      { success: false, error: `Employee lookup: ${empErr.message}` },
      { status: 500 },
    );
  }

  const employees: EmployeeLookup[] = (empData ?? [])
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

  let tabs;
  try {
    tabs = await fetchHrbTabs(sheetId);
  } catch (e) {
    return Response.json(
      { success: false, error: `Sheets API: ${(e as Error).message}` },
      { status: 502 },
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
      message: 'No payroll rows in source sheet',
    });
  }

  const batchId = randomUUID();
  const stamped = rows.map((r) => ({
    ...r,
    created_by: actingEmployeeId,
    updated_by: actingEmployeeId,
  }));

  let inserted = 0;
  for (let i = 0; i < stamped.length; i += INSERT_BATCH_SIZE) {
    const chunk = stamped.slice(i, i + INSERT_BATCH_SIZE);
    const { error } = await admin.from('hr_payroll').insert(chunk);
    if (error) {
      return Response.json(
        {
          success: false,
          error: `Insert failed: ${error.message}`,
          partialInserted: inserted,
        },
        { status: 500 },
      );
    }
    inserted += chunk.length;
  }

  return Response.json({ success: true, rowsInserted: inserted, batchId });
};
