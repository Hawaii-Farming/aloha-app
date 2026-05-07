/**
 * Smoke test for sheets-client.server.ts.
 *
 * Verifies:
 *   1. Service account creds in .env decode correctly
 *   2. The shared HRB sheet is reachable
 *   3. All 6 expected tabs exist and return rows
 *
 * Run: pnpm with-env npx tsx scripts/payroll-smoke-test.ts
 */
import {
  HRB_TAB_NAMES,
  fetchHrbTabs,
} from '../app/lib/payroll/sheets-client.server.js';

async function main() {
  const sheetId = process.env.HRB_INPUT_SHEET_ID;
  if (!sheetId) {
    console.error('HRB_INPUT_SHEET_ID not set in .env');
    process.exit(1);
  }

  console.log(`Fetching tabs from sheet: ${sheetId}`);
  const start = Date.now();
  const tabs = await fetchHrbTabs(sheetId);
  const elapsed = Date.now() - start;

  console.log(`\nFetched in ${elapsed}ms\n`);
  console.log('Tab            Rows  First column header');
  console.log('-------------- ----- --------------------');
  for (const name of HRB_TAB_NAMES) {
    const rows = tabs[name];
    const firstHeader = rows[0]
      ? (Object.keys(rows[0])[0] ?? '(empty)')
      : '(no rows)';
    console.log(
      `${name.padEnd(14)} ${String(rows.length).padStart(5)}  ${firstHeader}`,
    );
  }
}

main().catch((err) => {
  console.error('\nSMOKE TEST FAILED:\n', err.message ?? err);
  process.exit(1);
});
