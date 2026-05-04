/**
 * QuickBooks Online OAuth client + token repository.
 *
 * Two responsibilities:
 *   1. Talk to Intuit's OAuth2 token endpoint:
 *        - exchangeAuthCode(code)         after the user authorizes
 *        - refreshAccessToken(refreshToken) when access_token has expired
 *        - revokeRefreshToken(token)      on disconnect
 *   2. Persist the resulting tokens to org_quickbooks_token using the
 *      Supabase service-role client (the table is RLS-locked; the
 *      authenticated browser session can never read it).
 *
 * Server-only — never import from the browser.
 */
import process from 'node:process';

import { getSupabaseServerAdminClient } from '~/lib/supabase/clients/server-admin-client.server';

import {
  getQuickbooksBasicAuthHeader,
  getQuickbooksConfig,
} from './config.server';

export type IntuitTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds (~3600)
  x_refresh_token_expires_in: number; // seconds (~8,726,400 == 101 days)
  token_type: string; // "bearer"
};

export type StoredToken = {
  org_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
  connected_by: string | null;
};

// ---------------------------------------------------------------------------
// Intuit OAuth2 calls
// ---------------------------------------------------------------------------

async function postToTokenEndpoint(
  body: URLSearchParams,
): Promise<IntuitTokenResponse> {
  const { tokenUrl } = getQuickbooksConfig();

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: getQuickbooksBasicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Intuit token request failed (${res.status}): ${text || res.statusText}`,
    );
  }

  return (await res.json()) as IntuitTokenResponse;
}

export async function exchangeAuthCode(
  code: string,
): Promise<IntuitTokenResponse> {
  const { redirectUri } = getQuickbooksConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  return postToTokenEndpoint(body);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<IntuitTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  return postToTokenEndpoint(body);
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const { revokeUrl } = getQuickbooksConfig();

  const res = await fetch(revokeUrl, {
    method: 'POST',
    headers: {
      Authorization: getQuickbooksBasicAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ token: refreshToken }),
  });

  // Intuit returns 200 on success. 400 with "invalid_grant" means the token
  // is already revoked/expired — treat that as success too.
  if (res.ok) return;
  const text = await res.text().catch(() => '');
  if (res.status === 400 && text.includes('invalid_grant')) return;
  throw new Error(
    `Intuit revoke failed (${res.status}): ${text || res.statusText}`,
  );
}

// ---------------------------------------------------------------------------
// Token repository (org_quickbooks_token, service-role only)
// ---------------------------------------------------------------------------

export async function getStoredToken(
  orgId: string,
): Promise<StoredToken | null> {
  const client = getSupabaseServerAdminClient();
  const { data, error } = await client
    .from('org_quickbooks_token')
    .select(
      'org_id, realm_id, access_token, refresh_token, access_expires_at, refresh_expires_at, connected_by',
    )
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load org_quickbooks_token: ${error.message}`);
  }
  return data;
}

type UpsertTokenArgs = {
  orgId: string;
  realmId: string;
  tokens: IntuitTokenResponse;
  connectedBy?: string | null;
};

export async function upsertStoredToken({
  orgId,
  realmId,
  tokens,
  connectedBy,
}: UpsertTokenArgs): Promise<void> {
  const now = Date.now();
  const accessExpiresAt = new Date(
    now + tokens.expires_in * 1000,
  ).toISOString();
  const refreshExpiresAt = new Date(
    now + tokens.x_refresh_token_expires_in * 1000,
  ).toISOString();

  const client = getSupabaseServerAdminClient();
  const { error } = await client.from('org_quickbooks_token').upsert(
    {
      org_id: orgId,
      realm_id: realmId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      access_expires_at: accessExpiresAt,
      refresh_expires_at: refreshExpiresAt,
      // Only overwrite connected_by when explicitly provided (initial connect).
      // Refresh flows leave it unchanged.
      ...(connectedBy !== undefined ? { connected_by: connectedBy } : {}),
      is_deleted: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id' },
  );

  if (error) {
    throw new Error(`Failed to upsert org_quickbooks_token: ${error.message}`);
  }
}

export async function deleteStoredToken(orgId: string): Promise<void> {
  const client = getSupabaseServerAdminClient();
  const { error } = await client
    .from('org_quickbooks_token')
    .delete()
    .eq('org_id', orgId);

  if (error) {
    throw new Error(`Failed to delete org_quickbooks_token: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Convenience: get a valid access token, refreshing if needed.
// ---------------------------------------------------------------------------

const ACCESS_REFRESH_SKEW_MS = 60_000; // refresh if <60s remaining

export async function getValidAccessToken(orgId: string): Promise<{
  accessToken: string;
  realmId: string;
} | null> {
  const stored = await getStoredToken(orgId);
  if (!stored) return null;

  const refreshExpiresAtMs = Date.parse(stored.refresh_expires_at);
  if (Number.isFinite(refreshExpiresAtMs) && refreshExpiresAtMs <= Date.now()) {
    // Refresh token itself expired — user must reconnect.
    return null;
  }

  const accessExpiresAtMs = Date.parse(stored.access_expires_at);
  const expired =
    !Number.isFinite(accessExpiresAtMs) ||
    accessExpiresAtMs - ACCESS_REFRESH_SKEW_MS <= Date.now();

  if (!expired) {
    return { accessToken: stored.access_token, realmId: stored.realm_id };
  }

  const refreshed = await refreshAccessToken(stored.refresh_token);
  await upsertStoredToken({
    orgId,
    realmId: stored.realm_id,
    tokens: refreshed,
  });
  return { accessToken: refreshed.access_token, realmId: stored.realm_id };
}

// ---------------------------------------------------------------------------
// Authenticated QuickBooks API calls.
// ---------------------------------------------------------------------------

const QB_MINOR_VERSION = '70';

export class QuickbooksNotConnectedError extends Error {
  constructor(orgId: string) {
    super(`QuickBooks is not connected for org ${orgId}`);
    this.name = 'QuickbooksNotConnectedError';
  }
}

async function qbApiGet<T>(orgId: string, path: string): Promise<T> {
  const valid = await getValidAccessToken(orgId);
  if (!valid) throw new QuickbooksNotConnectedError(orgId);

  const { apiBaseUrl } = getQuickbooksConfig();
  const sep = path.includes('?') ? '&' : '?';
  const url = `${apiBaseUrl}/v3/company/${encodeURIComponent(valid.realmId)}${path}${sep}minorversion=${QB_MINOR_VERSION}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${valid.accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `QuickBooks API ${res.status} ${path}: ${text || res.statusText}`,
    );
  }

  return (await res.json()) as T;
}

type QueryResponseShape<E extends string, T> = {
  QueryResponse: { startPosition?: number; maxResults?: number } & {
    [K in E]?: T[];
  };
  time?: string;
};

/**
 * Paginate over QuickBooks' SQL-like /query endpoint and return every row.
 *
 * Example: queryQuickbooks<Invoice>(orgId, 'Invoice')
 *          queryQuickbooks<Invoice>(orgId, 'Invoice', "WHERE TxnDate >= '2025-01-01'")
 */
export async function queryQuickbooks<T = unknown, E extends string = string>(
  orgId: string,
  entity: E,
  whereClause = '',
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const results: T[] = [];
  let startPosition = 1;

  // Loop until a page returns fewer than PAGE_SIZE rows.
  // Hard cap at 50 pages (50k rows) as a safety belt against runaway loops.
  for (let i = 0; i < 50; i++) {
    const tail = whereClause ? ` ${whereClause}` : '';
    const sql = `SELECT * FROM ${entity}${tail} STARTPOSITION ${startPosition} MAXRESULTS ${PAGE_SIZE}`;
    const data = await qbApiGet<QueryResponseShape<E, T>>(
      orgId,
      `/query?query=${encodeURIComponent(sql)}`,
    );
    const page = (data.QueryResponse[entity] as T[] | undefined) ?? [];
    results.push(...page);
    if (page.length < PAGE_SIZE) break;
    startPosition += page.length;
  }

  return results;
}

// ---------------------------------------------------------------------------
// CSRF state cookie helpers for the OAuth handshake.
// ---------------------------------------------------------------------------

const STATE_COOKIE = 'qb_oauth_state';
const STATE_COOKIE_MAX_AGE = 600; // 10 minutes

export function buildStateCookie(state: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  return [
    `${STATE_COOKIE}=${encodeURIComponent(state)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${STATE_COOKIE_MAX_AGE}`,
    ...(isProd ? ['Secure'] : []),
  ].join('; ');
}

export function clearStateCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return [
    `${STATE_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    ...(isProd ? ['Secure'] : []),
  ].join('; ');
}

export function readStateCookie(request: Request): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === STATE_COOKIE) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

export function generateState(): string {
  // 32-byte hex string. crypto is available in Node 18+ and Cloud Run.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
