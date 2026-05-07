import { JWT } from 'google-auth-library';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
];

export const HRB_TAB_NAMES = [
  '$data',
  'NetPay',
  'Hours',
  'PTOBank',
  'WC',
  'TDI',
] as const;

export type HrbTabName = (typeof HRB_TAB_NAMES)[number];

export type HrbTabRow = Record<string, string | number | null>;

export type HrbTabs = Record<HrbTabName, HrbTabRow[]>;

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

function loadServiceAccount(): ServiceAccountKey {
  const b64 = process.env.GOOGLE_SHEETS_SA_KEY_B64;
  if (!b64) {
    throw new Error('GOOGLE_SHEETS_SA_KEY_B64 not set');
  }
  const json = Buffer.from(b64, 'base64').toString('utf8');
  const parsed = JSON.parse(json) as ServiceAccountKey;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      'GOOGLE_SHEETS_SA_KEY_B64 is missing client_email or private_key',
    );
  }
  return parsed;
}

function getJwtClient(): JWT {
  const sa = loadServiceAccount();
  return new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: SCOPES,
  });
}

async function getAccessToken(): Promise<string> {
  const jwt = getJwtClient();
  const { token } = await jwt.getAccessToken();
  if (!token) {
    throw new Error('Failed to obtain Google access token');
  }
  return token;
}

function rowsToObjects(values: (string | number | null)[][]): HrbTabRow[] {
  if (!values || values.length < 2) return [];
  const headerRow = values[0] ?? [];
  const headers = headerRow.map((h) => String(h ?? '').trim());
  return values.slice(1).map((row) => {
    const obj: HrbTabRow = {};
    headers.forEach((h, i) => {
      if (!h) return;
      obj[h] = row[i] ?? null;
    });
    return obj;
  });
}

export async function fetchHrbTabs(sheetId: string): Promise<HrbTabs> {
  const token = await getAccessToken();
  const ranges = HRB_TAB_NAMES.map(
    (n) => `ranges=${encodeURIComponent(`'${n}'!A:Z`)}`,
  ).join('&');
  const url = `${SHEETS_API_BASE}/${sheetId}/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API ${res.status}: ${body}`);
  }
  const json = (await res.json()) as {
    valueRanges: { range: string; values?: (string | number | null)[][] }[];
  };

  const tabs = {} as HrbTabs;
  HRB_TAB_NAMES.forEach((name, i) => {
    tabs[name] = rowsToObjects(json.valueRanges[i]?.values ?? []);
  });
  return tabs;
}

/** Clears row 2+ on every HRB tab, leaving headers intact. */
export async function clearHrbTabs(sheetId: string): Promise<void> {
  const token = await getAccessToken();
  const ranges = HRB_TAB_NAMES.map((n) => `'${n}'!A2:Z`);
  const res = await fetch(`${SHEETS_API_BASE}/${sheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ranges }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets batchClear ${res.status}: ${body}`);
  }
}

/** Exports the spreadsheet as xlsx via the Drive API. Returns the raw bytes. */
export async function exportSheetAsXlsx(sheetId: string): Promise<Uint8Array> {
  const token = await getAccessToken();
  const url = `${DRIVE_API_BASE}/${sheetId}/export?mimeType=${encodeURIComponent(XLSX_MIME)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive export ${res.status}: ${body}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}
