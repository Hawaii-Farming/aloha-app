/**
 * Seed the HRB sheet with a small sample so /api/payroll/run has data to merge.
 *
 * Anchors on two real hr_employee rows (Maria Alcantara 10400518, Eric Batha
 * 10401991), one bi-weekly period 2026-04-15..2026-04-30, check date 2026-05-05,
 * invoice INV-26-09. Total invoice hours 163.5 → is_standard=false.
 *
 * Service account must have Editor on the sheet.
 *
 * Run: pnpm with-env npx tsx scripts/payroll-seed-sample.ts
 */
import { JWT } from 'google-auth-library';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

function loadSa(): ServiceAccountKey {
  const b64 = process.env.GOOGLE_SHEETS_SA_KEY_B64;
  if (!b64) throw new Error('GOOGLE_SHEETS_SA_KEY_B64 not set');
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

async function getToken(): Promise<string> {
  const sa = loadSa();
  const jwt = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: SCOPES,
  });
  const { token } = await jwt.getAccessToken();
  if (!token) throw new Error('No access token');
  return token;
}

const SAMPLE: Record<string, (string | number)[][]> = {
  $data: [
    [
      'Full Name',
      'Emp ID',
      'Pay Period',
      'Check Date',
      'Inv No',
      'Gross Wages',
      'Labor Fees',
      'Other Tax',
      'Workers Comp',
      'Health Benefits',
      'Oth Health Chgs',
      'Admin Fees',
      'Hawaii GET',
      'Other Charges',
      'Total Cost',
      'Hours',
    ],
    [
      'Maria Alcantara',
      10400518,
      '2026-04-15 - 2026-04-30',
      '2026-05-05',
      'INV-26-09',
      1710,
      120,
      35,
      48,
      200,
      8,
      25,
      14,
      0,
      2160,
      85.5,
    ],
    [
      'Eric Batha',
      10401991,
      '2026-04-15 - 2026-04-30',
      '2026-05-05',
      'INV-26-09',
      1716,
      115,
      33,
      0,
      200,
      8,
      25,
      14,
      0,
      2111,
      78,
    ],
  ],
  Hours: [
    [
      'EMPID',
      'Check Date',
      'Regular Hours',
      'Overtime Hours',
      'PTO Hours',
      'Total Hours',
      'Regular Pay',
      'Overtime Pay',
      'PTO Pay',
      'Other Pay',
      'Total Pay',
    ],
    [10400518, '2026-05-05', 80, 5.5, 0, 85.5, 1600, 165, 0, 0, 1765],
    [10401991, '2026-05-05', 78, 0, 0, 78, 1716, 0, 0, 0, 1716],
  ],
  NetPay: [
    [
      'Employee Name',
      'Hourly Rate',
      'Auto Allowances',
      'Bonus',
      'Per Diem',
      'Salary',
      'FIT',
      'SIT',
      'Social Security',
      'Medicare',
      'Comp Plus',
      'HDS Dental',
      'PreTax 401K',
      'Auto Deduction',
      'Child Support',
      'Program Fees',
      'Net Pay',
    ],
    [
      'Maria Alcantara-10400518',
      20,
      0,
      0,
      0,
      0,
      150,
      60,
      106,
      25,
      0,
      30,
      50,
      0,
      0,
      0,
      1344,
    ],
    [
      'Eric Batha-10401991',
      22,
      0,
      100,
      0,
      0,
      160,
      65,
      106,
      24,
      0,
      30,
      50,
      0,
      0,
      0,
      1281,
    ],
  ],
  PTOBank: [
    ['Employee Name', 'Net YTD Hours Accrued'],
    ['EMPLOYEE: 10400518 - Maria Alcantara', 24],
    ['EMPLOYEE: 10401991 - Eric Batha', 16],
  ],
  WC: [
    ['Employee Name', 'WC 0008', 'WC 8810', 'WC 8742'],
    ['10400518 - Maria Alcantara', 0, 48, 0],
    ['10401991 - Eric Batha', 0, 0, 0],
  ],
  TDI: [
    ['Employee Name', 'Employer TDI'],
    ['10400518 - Maria Alcantara', 2.5],
    ['10401991 - Eric Batha', 2.5],
  ],
};

async function main() {
  const sheetId = process.env.HRB_INPUT_SHEET_ID;
  if (!sheetId) throw new Error('HRB_INPUT_SHEET_ID not set');

  const token = await getToken();

  console.log('Clearing existing tab data...');
  const clearRanges = Object.keys(SAMPLE).map((n) => `'${n}'!A1:Z`);
  const clearRes = await fetch(
    `${SHEETS_API_BASE}/${sheetId}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ranges: clearRanges }),
    },
  );
  if (!clearRes.ok) {
    throw new Error(`batchClear ${clearRes.status}: ${await clearRes.text()}`);
  }

  console.log('Writing sample rows to all 6 tabs...');
  const writeRes = await fetch(
    `${SHEETS_API_BASE}/${sheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: Object.entries(SAMPLE).map(([tab, values]) => ({
          range: `'${tab}'!A1`,
          values,
        })),
      }),
    },
  );
  if (!writeRes.ok) {
    throw new Error(`batchUpdate ${writeRes.status}: ${await writeRes.text()}`);
  }
  const result = (await writeRes.json()) as {
    totalUpdatedRows: number;
    totalUpdatedCells: number;
  };
  console.log(
    `Done. ${result.totalUpdatedRows} rows / ${result.totalUpdatedCells} cells written across 6 tabs.`,
  );
}

main().catch((err) => {
  console.error('SEED FAILED:', err.message ?? err);
  process.exit(1);
});
