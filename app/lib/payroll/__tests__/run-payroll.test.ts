import { describe, expect, it } from 'vitest';

import {
  type EmployeeLookup,
  buildPayrollRows,
  isoDate,
  normId,
  parsePayPeriod,
  safeNumber,
  validateEmployees,
} from '../run-payroll.server';
import type { HrbTabs } from '../sheets-client.server';

const ORG = 'hawaii_farming';

const EMP_ALICE: EmployeeLookup = {
  id: 'emp_alice',
  payroll_id: '101',
  hr_department_id: 'GH',
  hr_work_authorization_id: 'H2A',
  wc: '8810',
  pay_structure: 'hourly',
  overtime_threshold: 40,
  full_name: 'Alice Akamai',
};

const EMP_BOB: EmployeeLookup = {
  id: 'emp_bob',
  payroll_id: '202',
  hr_department_id: 'PH',
  hr_work_authorization_id: '1099',
  wc: '0008',
  pay_structure: 'salary',
  overtime_threshold: 0,
  full_name: 'Bob Brown',
};

function makeTabs(overrides: Partial<HrbTabs> = {}): HrbTabs {
  return {
    $data: [],
    NetPay: [],
    Hours: [],
    PTOBank: [],
    WC: [],
    TDI: [],
    ...overrides,
  };
}

describe('helpers', () => {
  it('normId strips non-digits', () => {
    expect(normId(' 101 ')).toBe('101');
    expect(normId('emp-202!')).toBe('202');
    expect(normId(101)).toBe('101');
    expect(normId(null)).toBe('');
    expect(normId(undefined)).toBe('');
  });

  it('safeNumber coerces and falls back to 0', () => {
    expect(safeNumber('12.5')).toBe(12.5);
    expect(safeNumber(7)).toBe(7);
    expect(safeNumber('')).toBe(0);
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber('abc')).toBe(0);
  });

  it('isoDate handles ISO, US, and Date inputs', () => {
    expect(isoDate('2026-04-15')).toBe('2026-04-15');
    expect(isoDate('4/15/2026')).toBe('2026-04-15');
    expect(isoDate('1/3/2026')).toBe('2026-01-03');
    expect(isoDate(new Date('2026-04-15T00:00:00Z'))).toBe('2026-04-15');
  });

  it('parsePayPeriod splits the standard format', () => {
    expect(parsePayPeriod('2026-04-01 - 2026-04-15')).toEqual({
      start: '2026-04-01',
      end: '2026-04-15',
    });
    expect(parsePayPeriod('4/1/2026 - 4/15/2026')).toEqual({
      start: '2026-04-01',
      end: '2026-04-15',
    });
  });
});

describe('validateEmployees', () => {
  it('returns missing emp ids that are not in the register', () => {
    const dollar = [
      { 'Emp ID': '101', 'Full Name': 'Alice' },
      { 'Emp ID': '999', 'Full Name': 'Ghost' },
      { 'Emp ID': '999', 'Full Name': 'Ghost' }, // dedupe
    ];
    const idx = new Map([['101', EMP_ALICE]]);
    const missing = validateEmployees(dollar, idx);
    expect(missing).toEqual([{ payroll_id: '999', full_name: 'Ghost' }]);
  });

  it('returns empty when all emps resolve', () => {
    const dollar = [{ 'Emp ID': '101', 'Full Name': 'Alice' }];
    const idx = new Map([['101', EMP_ALICE]]);
    expect(validateEmployees(dollar, idx)).toEqual([]);
  });
});

describe('buildPayrollRows', () => {
  it('aborts and returns missing when register is incomplete', () => {
    const tabs = makeTabs({
      $data: [
        {
          'Emp ID': '999',
          'Full Name': 'Ghost',
          'Inv No': 'INV-1',
          'Pay Period': '2026-04-01 - 2026-04-15',
          'Check Date': '2026-04-20',
          Hours: 40,
        },
      ],
    });
    const result = buildPayrollRows(tabs, [EMP_ALICE], { orgId: ORG });
    expect(result.rows).toEqual([]);
    expect(result.missing).toEqual([{ payroll_id: '999', full_name: 'Ghost' }]);
  });

  it('joins all 6 tabs and produces a full hr_payroll row', () => {
    const tabs = makeTabs({
      $data: [
        {
          'Emp ID': '101',
          'Full Name': 'Alice Akamai',
          'Inv No': 'INV-100',
          'Pay Period': '2026-04-01 - 2026-04-15',
          'Check Date': '2026-04-20',
          'Gross Wages': 2000,
          'Labor Fees': 50,
          'Other Tax': 10,
          'Workers Comp': 25,
          'Health Benefits': 200,
          'Oth Health Chgs': 5,
          'Admin Fees': 15,
          'Hawaii GET': 8,
          'Other Charges': 0,
          'Total Cost': 2400,
          Hours: 6000, // pushes invoice over 5000 → standard
        },
      ],
      Hours: [
        {
          EMPID: '101',
          'Check Date': '2026-04-20',
          'Regular Hours': 40,
          'Overtime Hours': 5,
          'PTO Hours': 0,
          'Total Hours': 45,
          'Regular Pay': 800,
          'Overtime Pay': 150,
          'PTO Pay': 0,
          'Other Pay': 0,
          'Total Pay': 950,
        },
      ],
      NetPay: [
        {
          'Employee Name': 'Alice Akamai-101',
          'Hourly Rate': 20,
          'Auto Allowances': 0,
          Bonus: 100,
          'Per Diem': 50,
          Salary: 0,
          FIT: 80,
          SIT: 30,
          'Social Security': 60,
          Medicare: 14,
          'Comp Plus': 0,
          'HDS Dental': 25,
          'PreTax 401K': 100,
          'Auto Deduction': 0,
          'Child Support': 0,
          'Program Fees': 0,
          'Net Pay': 1500,
        },
      ],
      PTOBank: [
        {
          'Employee Name': 'EMPLOYEE: 101 - Alice',
          'Net YTD Hours Accrued': 32.5,
        },
      ],
      WC: [
        {
          'Employee Name': '101 - Alice',
          'WC 0008': 0,
          'WC 8810': 25,
          'WC 8742': 0,
        },
      ],
      TDI: [
        {
          'Employee Name': '101 - Alice',
          'Employer TDI': 4.5,
        },
      ],
    });

    const result = buildPayrollRows(tabs, [EMP_ALICE], { orgId: ORG });
    expect(result.missing).toEqual([]);
    expect(result.rows).toHaveLength(1);

    const row = result.rows[0]!;
    expect(row.hr_employee_id).toBe('emp_alice');
    expect(row.payroll_id).toBe('101');
    expect(row.pay_period_start).toBe('2026-04-01');
    expect(row.pay_period_end).toBe('2026-04-15');
    expect(row.check_date).toBe('2026-04-20');
    expect(row.invoice_number).toBe('INV-100');
    expect(row.payroll_processor).toBe('HRB');
    expect(row.is_standard).toBe(true); // invoice hours 6000 > 5000
    expect(row.employee_name).toBe('Alice Akamai');
    expect(row.hr_department_id).toBe('GH');
    expect(row.wc).toBe('8810'); // 8810 is the non-zero code
    expect(row.pay_structure).toBe('hourly');

    expect(row.hourly_rate).toBe(20);
    expect(row.regular_hours).toBe(40);
    expect(row.overtime_hours).toBe(5);
    expect(row.total_hours).toBe(45);
    expect(row.overtime_threshold).toBe(40);
    expect(row.discretionary_overtime_hours).toBe(5); // max(45-40, 0)
    expect(row.discretionary_overtime_pay).toBe(150); // (5/5) * 150

    expect(row.bonus_pay).toBe(100);
    expect(row.per_diem).toBe(50);
    expect(row.gross_wage).toBe(2000);
    expect(row.tdi).toBe(4.5);
    expect(row.pto_hours_accrued).toBe(32.5);
    expect(row.net_pay).toBe(1500);
    expect(row.total_cost).toBe(2400);
    expect(row.hawaii_get).toBe(8);
  });

  it('marks row as off-cycle when invoice total ≤ 5000 hours', () => {
    const tabs = makeTabs({
      $data: [
        {
          'Emp ID': '101',
          'Full Name': 'Alice',
          'Inv No': 'ADJUST-1',
          'Pay Period': '2026-04-01 - 2026-04-15',
          'Check Date': '2026-04-22',
          Hours: 4, // only 4 hours on the whole invoice
        },
      ],
    });
    const result = buildPayrollRows(tabs, [EMP_ALICE], { orgId: ORG });
    expect(result.rows[0]!.is_standard).toBe(false);
  });

  it('picks the first non-zero WC code among 0008/8810/8742', () => {
    const baseTabs = (wcRow: Record<string, unknown>) =>
      makeTabs({
        $data: [
          {
            'Emp ID': '101',
            'Full Name': 'Alice',
            'Inv No': 'I',
            'Pay Period': '2026-04-01 - 2026-04-15',
            'Check Date': '2026-04-20',
            Hours: 1,
          },
        ],
        WC: [{ 'Employee Name': '101 - Alice', ...wcRow }],
      });

    const rOnly0008 = buildPayrollRows(
      baseTabs({ 'WC 0008': 12, 'WC 8810': 0, 'WC 8742': 0 }),
      [EMP_ALICE],
      { orgId: ORG },
    );
    expect(rOnly0008.rows[0]!.wc).toBe('0008');

    const rOnly8742 = buildPayrollRows(
      baseTabs({ 'WC 0008': 0, 'WC 8810': 0, 'WC 8742': 99 }),
      [EMP_ALICE],
      { orgId: ORG },
    );
    expect(rOnly8742.rows[0]!.wc).toBe('8742');

    const rAllZero = buildPayrollRows(
      baseTabs({ 'WC 0008': 0, 'WC 8810': 0, 'WC 8742': 0 }),
      [EMP_ALICE],
      { orgId: ORG },
    );
    // Falls back to employee's stored wc
    expect(rAllZero.rows[0]!.wc).toBe('8810');
  });

  it('handles missing side-tab data without crashing', () => {
    const tabs = makeTabs({
      $data: [
        {
          'Emp ID': '202',
          'Full Name': 'Bob Brown',
          'Inv No': 'INV-2',
          'Pay Period': '2026-04-01 - 2026-04-15',
          'Check Date': '2026-04-20',
          Hours: 1,
        },
      ],
      // No Hours/NetPay/PTO/WC/TDI rows for 202
    });
    const result = buildPayrollRows(tabs, [EMP_BOB], { orgId: ORG });
    expect(result.missing).toEqual([]);
    const row = result.rows[0]!;
    expect(row.regular_hours).toBe(0);
    expect(row.overtime_hours).toBe(0);
    expect(row.total_hours).toBe(0);
    expect(row.pto_hours_accrued).toBe(0);
    expect(row.tdi).toBe(0);
    expect(row.discretionary_overtime_hours).toBe(0);
    expect(row.discretionary_overtime_pay).toBe(0);
    expect(row.wc).toBe('0008'); // falls back to employee's stored wc
  });

  it('aggregates invoice totals across multiple employees on same invoice', () => {
    const tabs = makeTabs({
      $data: [
        {
          'Emp ID': '101',
          'Full Name': 'Alice',
          'Inv No': 'BIG-INV',
          'Pay Period': '2026-04-01 - 2026-04-15',
          'Check Date': '2026-04-20',
          Hours: 3000,
        },
        {
          'Emp ID': '202',
          'Full Name': 'Bob',
          'Inv No': 'BIG-INV',
          'Pay Period': '2026-04-01 - 2026-04-15',
          'Check Date': '2026-04-20',
          Hours: 2500, // 3000+2500=5500 → both standard
        },
      ],
    });
    const result = buildPayrollRows(tabs, [EMP_ALICE, EMP_BOB], {
      orgId: ORG,
    });
    expect(result.rows.every((r) => r.is_standard)).toBe(true);
  });
});
