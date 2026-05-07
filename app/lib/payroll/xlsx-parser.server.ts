/**
 * Parses an HRB-format xlsx file (HF_Payroll_Template) into the same HrbTabs
 * shape that fetchHrbTabs returns. Lets the run-payroll action accept either
 * a Sheets API fetch or a user-uploaded file with the same downstream code.
 */
import * as XLSX from 'xlsx';

import {
  HRB_TAB_NAMES,
  type HrbTabName,
  type HrbTabRow,
  type HrbTabs,
} from './sheets-client.server';

export function parseXlsxToHrbTabs(bytes: Uint8Array): HrbTabs {
  // cellDates:true makes Excel date cells come out as JS Date objects;
  // run-payroll's isoDate() handles those via its `instanceof Date` branch.
  // Without this, dates come back as serial numbers (e.g. 45000) and get
  // misread as year 45000 → Postgres timestamp overflow.
  const wb = XLSX.read(bytes, { type: 'array', cellDates: true });
  const tabs = {} as HrbTabs;
  const missing: string[] = [];

  for (const name of HRB_TAB_NAMES) {
    const sheet = wb.Sheets[name];
    if (!sheet) {
      missing.push(name);
      tabs[name as HrbTabName] = [];
      continue;
    }
    // defval: null mirrors how Sheets API returns empty cells
    const rows = XLSX.utils.sheet_to_json<HrbTabRow>(sheet, {
      defval: null,
      raw: true,
    });
    tabs[name as HrbTabName] = rows;
  }

  if (missing.length > 0) {
    throw new Error(
      `Uploaded xlsx is missing required tabs: ${missing.join(', ')}. ` +
        `Expected: ${HRB_TAB_NAMES.join(', ')}`,
    );
  }

  return tabs;
}
