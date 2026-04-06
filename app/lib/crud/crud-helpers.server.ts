import type { SupabaseClient } from '@supabase/supabase-js';

/** Flattens nested FK objects from Supabase embedded selects.
 *  e.g. { compensation_manager: { preferred_name: 'Joe' } }
 *  becomes { compensation_manager_preferred_name: 'Joe' } */
function flattenRow(row: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        flat[`${key}_${nestedKey}`] = nestedValue;
      }
    } else {
      flat[key] = value;
    }
  }

  return flat;
}

async function resolveSelfJoins(
  client: SupabaseClient,
  tableName: string,
  rows: Record<string, unknown>[],
  selfJoins: Record<string, string>,
) {
  const displayFields = [...new Set(Object.values(selfJoins))];
  const fkColumns = Object.keys(selfJoins);

  const ids = new Set<string>();

  for (const row of rows) {
    for (const fkCol of fkColumns) {
      const val = row[fkCol];

      if (typeof val === 'string' && val) {
        ids.add(val);
      }
    }
  }

  if (ids.size === 0) return rows;

  const { data: lookupData } = await client
    .from(tableName)
    .select(`id, ${displayFields.join(', ')}`)
    .in('id', Array.from(ids));

  const lookup = new Map<string, Record<string, unknown>>();

  for (const item of (lookupData ?? []) as unknown as Record<
    string,
    unknown
  >[]) {
    lookup.set(String(item.id), item);
  }

  return rows.map((row) => {
    const enriched = { ...row };

    for (const [fkCol, displayField] of Object.entries(selfJoins)) {
      const refId = row[fkCol];

      if (typeof refId === 'string' && refId) {
        const ref = lookup.get(refId);
        enriched[`${fkCol}_${displayField}`] = ref?.[displayField] ?? null;
      } else {
        enriched[`${fkCol}_${displayField}`] = null;
      }
    }

    return enriched;
  });
}

export interface LoadTableDataParams {
  client: SupabaseClient;
  viewName: string;
  orgId: string;
  searchParams: URLSearchParams;
  searchColumns?: string[];
  defaultSort?: { column: string; ascending: boolean };
  pageSize?: number;
  select?: string;
  selfJoins?: Record<string, string>;
  /** Whitelist of column keys allowed for sort/filter from URL params.
   *  If omitted, sort and filter URL params are ignored entirely. */
  allowedColumns?: string[];
}

/** Strip PostgREST filter delimiters from search input to prevent
 *  users from injecting additional filter clauses via the search box. */
function sanitizeSearch(value: string): string {
  return value.replace(/[,()*]/g, '').trim();
}

export interface TableDataResult<T = Record<string, unknown>> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function loadTableData<T = Record<string, unknown>>(
  params: LoadTableDataParams,
): Promise<TableDataResult<T>> {
  const page = Number(params.searchParams.get('page') ?? '1');
  const allowed = new Set(params.allowedColumns ?? []);
  const fallbackSort = params.defaultSort?.column ?? 'created_at';
  const requestedSort = params.searchParams.get('sort');
  // Only honor the URL sort column if it's in the whitelist
  const sortBy =
    requestedSort && allowed.has(requestedSort) ? requestedSort : fallbackSort;
  const sortDir =
    params.searchParams.get('dir') ??
    (params.defaultSort?.ascending ? 'asc' : 'desc');
  const rawSearch = params.searchParams.get('q') ?? '';
  const search = sanitizeSearch(rawSearch);
  const size = params.pageSize ?? 25;
  const from = (page - 1) * size;
  const to = from + size - 1;

  let query = params.client
    .from(params.viewName)
    .select(params.select ?? '*', { count: 'exact' })
    .eq('org_id', params.orgId)
    .eq('is_deleted', false);

  // Active/Inactive filter: toggle between active (no end_date) and inactive (has end_date)
  const showInactive = params.searchParams.get('inactive') === 'true';

  if (showInactive) {
    query = query.not('end_date', 'is', null);
  } else {
    query = query.is('end_date', null);
  }

  // Text search (TABLE-05) using PostgREST .or() syntax
  if (search && params.searchColumns?.length) {
    const searchFilter = params.searchColumns
      .map((col) => `${col}.ilike.%${search}%`)
      .join(',');
    query = query.or(searchFilter);
  }

  // Column filters (TABLE-04): parse filter_<column>=value from search params.
  // Only honor filters whose column is in the whitelist — silently drop the rest.
  for (const [key, value] of params.searchParams.entries()) {
    if (key.startsWith('filter_') && value) {
      const column = key.replace('filter_', '');
      if (allowed.has(column)) {
        query = query.eq(column, value);
      }
    }
  }

  // Sorting (TABLE-03)
  query = query.order(sortBy, { ascending: sortDir === 'asc' });

  // Pagination (TABLE-02)
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Response(error.message, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  let flatRows = params.select ? rows.map(flattenRow) : rows;

  if (params.selfJoins && flatRows.length > 0) {
    flatRows = await resolveSelfJoins(
      params.client,
      params.viewName,
      flatRows,
      params.selfJoins,
    );
  }

  return {
    data: flatRows as T[],
    totalCount: count ?? 0,
    page,
    pageSize: size,
    pageCount: Math.ceil((count ?? 0) / size),
  };
}

export interface LoadDetailDataParams {
  client: SupabaseClient;
  viewName: string;
  orgId: string;
  pkColumn: string;
  pkValue: string;
  select?: string;
  selfJoins?: Record<string, string>;
}

export async function loadDetailData<T = Record<string, unknown>>(
  params: LoadDetailDataParams,
): Promise<T> {
  const { data, error } = await params.client
    .from(params.viewName)
    .select(params.select ?? '*')
    .eq('org_id', params.orgId)
    .eq(params.pkColumn, params.pkValue)
    .single();

  if (error || !data) {
    throw new Response('Not Found', { status: 404 });
  }

  let row = data as unknown as Record<string, unknown>;

  if (params.select) {
    row = flattenRow(row);
  }

  if (params.selfJoins) {
    const resolved = await resolveSelfJoins(
      params.client,
      params.viewName,
      [row],
      params.selfJoins,
    );
    row = resolved[0] ?? row;
  }

  return row as T;
}
