/**
 * Port of the Apps Script runPayroll() function.
 * Transforms the 6 raw HRB tabs into hr_payroll-shaped rows.
 */
import type { HrbTabs } from './sheets-client.server';

export interface EmployeeLookup {
  id: string;
  payroll_id: string;
  hr_department_id: string | null;
  hr_work_authorization_id: string | null;
  wc: string | null;
  pay_structure: string | null;
  overtime_threshold: number | null;
  full_name: string;
}

export interface HrPayrollInsert {
  org_id: string;
  hr_employee_id: string;
  payroll_id: string;
  pay_period_start: string;
  pay_period_end: string;
  check_date: string;
  invoice_number: string | null;
  payroll_processor: string;
  is_standard: boolean;
  employee_name: string;
  hr_department_id: string | null;
  hr_work_authorization_id: string | null;
  wc: string | null;
  pay_structure: string | null;
  hourly_rate: number;
  overtime_threshold: number;
  regular_hours: number;
  overtime_hours: number;
  discretionary_overtime_hours: number;
  pto_hours: number;
  total_hours: number;
  pto_hours_accrued: number;
  regular_pay: number;
  overtime_pay: number;
  discretionary_overtime_pay: number;
  pto_pay: number;
  other_pay: number;
  bonus_pay: number;
  auto_allowance: number;
  per_diem: number;
  salary: number;
  gross_wage: number;
  fit: number;
  sit: number;
  social_security: number;
  medicare: number;
  comp_plus: number;
  hds_dental: number;
  pre_tax_401k: number;
  auto_deduction: number;
  child_support: number;
  program_fees: number;
  net_pay: number;
  labor_tax: number;
  other_tax: number;
  workers_compensation: number;
  health_benefits: number;
  other_health_charges: number;
  admin_fees: number;
  hawaii_get: number;
  other_charges: number;
  tdi: number;
  total_cost: number;
}

export interface MissingEmployee {
  payroll_id: string;
  full_name: string;
}

export interface BuildResult {
  rows: HrPayrollInsert[];
  missing: MissingEmployee[];
}

const WC_COLUMNS = ['WC 0008', 'WC 8810', 'WC 8742'] as const;
const STANDARD_INVOICE_HOURS_THRESHOLD = 5000;

export function normId(v: unknown): string {
  return String(v ?? '')
    .replace(/\D/g, '')
    .trim();
}

export function safeNumber(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Accepts ISO ("YYYY-MM-DD"), US ("M/D/YYYY"), or a Date object.
 * Returns "YYYY-MM-DD" in UTC interpretation.
 */
export function isoDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) {
    const [, m = '', d = '', y = ''] = us;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return s;
}

/** "YYYY-MM-DD - YYYY-MM-DD" → { start, end }. The separator MUST have surrounding spaces to disambiguate from the hyphens inside ISO dates. */
export function parsePayPeriod(v: unknown): { start: string; end: string } {
  const s = String(v ?? '').trim();
  const parts = s.split(/\s+-\s+/);
  const [startRaw, endRaw] = parts;
  if (!startRaw || !endRaw) return { start: '', end: '' };
  return { start: isoDate(startRaw), end: isoDate(endRaw) };
}

function buildEmployeeIndex(employees: EmployeeLookup[]) {
  const byId = new Map<string, EmployeeLookup>();
  for (const e of employees) {
    const key = normId(e.payroll_id);
    if (key) byId.set(key, e);
  }
  return byId;
}

function buildKeyedMap<T extends Record<string, unknown>>(
  rows: T[],
  keyFn: (r: T) => string,
): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) {
    const k = keyFn(r);
    if (k) m.set(k, r);
  }
  return m;
}

function mapByEmployeeNameId<T extends Record<string, unknown>>(
  rows: T[],
  regex: RegExp,
): Map<string, T> {
  return buildKeyedMap(rows, (r) => {
    const name = String(r['Employee Name'] ?? '');
    const m = name.match(regex);
    return m ? normId(m[1]) : '';
  });
}

function summaryByInvoice(
  dollar: Record<string, unknown>[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const row of dollar) {
    const inv = String(row['Inv No'] ?? '');
    if (!inv) continue;
    const hours = safeNumber(row['Hours']);
    m.set(inv, (m.get(inv) ?? 0) + hours);
  }
  return m;
}

function pickWcCode(wcRow: Record<string, unknown> | undefined): {
  code: string | null;
  amount: number;
} {
  if (!wcRow) return { code: null, amount: 0 };
  for (const col of WC_COLUMNS) {
    const val = safeNumber(wcRow[col]);
    if (val > 0) return { code: col.replace('WC ', ''), amount: val };
  }
  return { code: null, amount: 0 };
}

/** Validates every $data row's Emp ID resolves in the employee register. */
export function validateEmployees(
  dollar: Record<string, unknown>[],
  empByPayrollId: Map<string, EmployeeLookup>,
): MissingEmployee[] {
  const missing: MissingEmployee[] = [];
  const seen = new Set<string>();
  for (const row of dollar) {
    const id = normId(row['Emp ID']);
    if (!id || seen.has(id)) continue;
    if (!empByPayrollId.has(id)) {
      missing.push({
        payroll_id: id,
        full_name: String(row['Full Name'] ?? 'Unknown'),
      });
      seen.add(id);
    }
  }
  return missing;
}

interface BuildOptions {
  orgId: string;
  payrollProcessor?: string;
}

export function buildPayrollRows(
  tabs: HrbTabs,
  employees: EmployeeLookup[],
  opts: BuildOptions,
): BuildResult {
  const empByPayrollId = buildEmployeeIndex(employees);

  const dollar = tabs['$data'];
  const netPay = tabs['NetPay'];
  const hours = tabs['Hours'];
  const ptoBank = tabs['PTOBank'];
  const wcTab = tabs['WC'];
  const tdi = tabs['TDI'];

  const missing = validateEmployees(dollar, empByPayrollId);
  if (missing.length > 0) return { rows: [], missing };

  const hoursByKey = buildKeyedMap(hours, (r) => {
    const id = normId(r['EMPID']);
    const day = isoDate(r['Check Date']);
    return id ? `${id}_${day}` : '';
  });
  const netPayMap = mapByEmployeeNameId(netPay, /-(\d+)\s*$/);
  const ptoMap = mapByEmployeeNameId(ptoBank, /EMPLOYEE:\s*(\d+)\s*-/i);
  const tdiMap = mapByEmployeeNameId(tdi, /^(\d+)\s*-/);
  const wcMap = mapByEmployeeNameId(wcTab, /^(\d+)\s*-/);

  const invHours = summaryByInvoice(dollar);

  const rows: HrPayrollInsert[] = [];
  for (const d of dollar) {
    const empId = normId(d['Emp ID']);
    if (!empId) continue;
    const emp = empByPayrollId.get(empId);
    if (!emp) continue;

    const checkDate = isoDate(d['Check Date']);
    const { start: payPeriodStart, end: payPeriodEnd } = parsePayPeriod(
      d['Pay Period'],
    );

    const hrRow = hoursByKey.get(`${empId}_${checkDate}`);
    const netRow = netPayMap.get(empId);
    const ptoRow = ptoMap.get(empId);
    const tdiRow = tdiMap.get(empId);
    const wcRow = wcMap.get(empId);

    const wcPick = pickWcCode(wcRow);
    const totalHours = safeNumber(hrRow?.['Total Hours']);
    const overtimeHours = safeNumber(hrRow?.['Overtime Hours']);
    const overtimePay = safeNumber(hrRow?.['Overtime Pay']);
    const overtimeThreshold = safeNumber(emp.overtime_threshold);
    const discretionaryOT = Math.max(totalHours - overtimeThreshold, 0);
    const discretionaryOTPay =
      Math.round((discretionaryOT / (overtimeHours || 1)) * overtimePay * 100) /
      100;

    const invNo = String(d['Inv No'] ?? '');
    const isStandard =
      (invHours.get(invNo) ?? 0) > STANDARD_INVOICE_HOURS_THRESHOLD;

    rows.push({
      org_id: opts.orgId,
      hr_employee_id: emp.id,
      payroll_id: empId,
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
      check_date: checkDate,
      invoice_number: invNo || null,
      payroll_processor: opts.payrollProcessor ?? 'HRB',
      is_standard: isStandard,
      employee_name: String(d['Full Name'] ?? emp.full_name),
      hr_department_id: emp.hr_department_id,
      hr_work_authorization_id: emp.hr_work_authorization_id,
      wc: wcPick.code ?? emp.wc,
      pay_structure: emp.pay_structure,
      hourly_rate: safeNumber(netRow?.['Hourly Rate']),
      overtime_threshold: overtimeThreshold,
      regular_hours: safeNumber(hrRow?.['Regular Hours']),
      overtime_hours: overtimeHours,
      discretionary_overtime_hours: discretionaryOT,
      pto_hours: safeNumber(hrRow?.['PTO Hours']),
      total_hours: totalHours,
      pto_hours_accrued: safeNumber(ptoRow?.['Net YTD Hours Accrued']),
      regular_pay: safeNumber(hrRow?.['Regular Pay']),
      overtime_pay: overtimePay,
      discretionary_overtime_pay: discretionaryOTPay,
      pto_pay: safeNumber(hrRow?.['PTO Pay']),
      other_pay: safeNumber(hrRow?.['Other Pay']),
      bonus_pay: safeNumber(netRow?.['Bonus']),
      auto_allowance: safeNumber(netRow?.['Auto Allowances']),
      per_diem: safeNumber(netRow?.['Per Diem']),
      salary: safeNumber(netRow?.['Salary']),
      gross_wage: safeNumber(d['Gross Wages']),
      fit: safeNumber(netRow?.['FIT']),
      sit: safeNumber(netRow?.['SIT']),
      social_security: safeNumber(netRow?.['Social Security']),
      medicare: safeNumber(netRow?.['Medicare']),
      comp_plus: safeNumber(netRow?.['Comp Plus']),
      hds_dental: safeNumber(netRow?.['HDS Dental']),
      pre_tax_401k: safeNumber(netRow?.['PreTax 401K']),
      auto_deduction: safeNumber(netRow?.['Auto Deduction']),
      child_support: safeNumber(netRow?.['Child Support']),
      program_fees: safeNumber(netRow?.['Program Fees']),
      net_pay: safeNumber(netRow?.['Net Pay']),
      labor_tax: safeNumber(d['Labor Fees']),
      other_tax: safeNumber(d['Other Tax']),
      workers_compensation: safeNumber(d['Workers Comp']),
      health_benefits: safeNumber(d['Health Benefits']),
      other_health_charges: safeNumber(d['Oth Health Chgs']),
      admin_fees: safeNumber(d['Admin Fees']),
      hawaii_get: safeNumber(d['Hawaii GET']),
      other_charges: safeNumber(d['Other Charges']),
      tdi: safeNumber(tdiRow?.['Employer TDI']),
      total_cost: safeNumber(d['Total Cost']),
    });
  }

  return { rows, missing: [] };
}
