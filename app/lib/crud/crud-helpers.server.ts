import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '~/lib/database.types';

import { castRow, castRows } from './typed-query.server';
import type { SelfJoinSpec } from './types';

/** Flattens nested FK objects from Supabase embedded selects.
 *  e.g. { compensation_manager: { preferred_name: 'Joe' } }
 *  becomes { compensation_manager_preferred_name: 'Joe' }.
 *  Recurses into nested embeds: { subject: { hr_department: { name: 'X' } } }
 *  becomes { subject_hr_department_name: 'X' }. Arrays (one-to-many embeds)
 *  are preserved as-is. */
export function flattenRow(
  row: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    const flatKey = prefix ? `${prefix}_${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(
        flat,
        flattenRow(value as Record<string, unknown>, flatKey),
      );
    } else {
      flat[flatKey] = value;
    }
  }

  return flat;
}

async function resolveSelfJoins(
  client: SupabaseClient<Database>,
  tableName: string,
  rows: Record<string, unknown>[],
  selfJoins: Record<string, SelfJoinSpec>,
) {
  // Group joins by lookup table so we batch one query per target table.
  const byTable = new Map<
    string,
    {
      table: string;
      fields: Set<string>;
      entries: Array<{ fkCol: string; fields: string[] }>;
    }
  >();

  for (const [fkCol, spec] of Object.entries(selfJoins)) {
    const table =
      typeof spec === 'string' ? tableName : (spec.table ?? tableName);
    const fields = typeof spec === 'string' ? [spec] : spec.displayFields;

    let group = byTable.get(table);
    if (!group) {
      group = { table, fields: new Set(), entries: [] };
      byTable.set(table, group);
    }
    for (const f of fields) group.fields.add(f);
    group.entries.push({ fkCol, fields });
  }

  // Run lookups in parallel: one per target table.
  const lookupPerTable = new Map<
    string,
    Map<string, Record<string, unknown>>
  >();

  await Promise.all(
    [...byTable.values()].map(async (group) => {
      const ids = new Set<string>();
      for (const row of rows) {
        for (const { fkCol } of group.entries) {
          const val = row[fkCol];
          if (typeof val === 'string' && val) ids.add(val);
        }
      }
      if (ids.size === 0) {
        lookupPerTable.set(group.table, new Map());
        return;
      }
      const { data } = await client
        .from(group.table as never)
        .select(`id, ${[...group.fields].join(', ')}`)
        .in('id', Array.from(ids));
      const map = new Map<string, Record<string, unknown>>();
      for (const item of castRows(data)) map.set(String(item.id), item);
      lookupPerTable.set(group.table, map);
    }),
  );

  return rows.map((row) => {
    const enriched = { ...row };
    for (const [fkCol, spec] of Object.entries(selfJoins)) {
      const table =
        typeof spec === 'string' ? tableName : (spec.table ?? tableName);
      const fields = typeof spec === 'string' ? [spec] : spec.displayFields;
      const refId = row[fkCol];
      const lookup = lookupPerTable.get(table);
      const ref =
        typeof refId === 'string' && refId && lookup
          ? lookup.get(refId)
          : undefined;
      for (const f of fields) {
        enriched[`${fkCol}_${f}`] = ref?.[f] ?? null;
      }
    }
    return enriched;
  });
}

export interface LoadTableDataParams {
  client: SupabaseClient<Database>;
  viewName: string;
  orgId: string;
  searchParams: URLSearchParams;
  searchColumns?: string[];
  defaultSort?: { column: string; ascending: boolean };
  pageSize?: number;
  select?: string;
  selfJoins?: Record<string, SelfJoinSpec>;
  /** Whitelist of column keys allowed for sort/filter from URL params.
   *  If omitted, sort and filter URL params are ignored entirely. */
  allowedColumns?: string[];
  /** Skip the `.eq('is_deleted', false)` filter when the view already
   *  filters deleted rows internally and doesn't expose the column. */
  skipDeletedFilter?: boolean;
}

/** Strip PostgREST filter delimiters from search input to prevent
 *  users from injecting additional filter clauses via the search box. */
export function sanitizeSearch(value: string): string {
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
    .from(params.viewName as never)
    .select(params.select ?? '*', { count: 'exact' })
    .eq('org_id', params.orgId);

  if (!params.skipDeletedFilter) {
    query = query.eq('is_deleted', false);
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

  const rows = castRows(data);
  let flatRows = params.select ? rows.map((r) => flattenRow(r)) : rows;

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
  client: SupabaseClient<Database>;
  viewName: string;
  orgId: string;
  pkColumn: string;
  pkValue: string;
  select?: string;
  selfJoins?: Record<string, SelfJoinSpec>;
}

export async function loadDetailData<T = Record<string, unknown>>(
  params: LoadDetailDataParams,
): Promise<T> {
  const { data, error } = await params.client
    .from(params.viewName as never)
    .select(params.select ?? '*')
    .eq('org_id', params.orgId)
    .eq(params.pkColumn, params.pkValue)
    .single();

  if (error || !data) {
    throw new Response('Not Found', { status: 404 });
  }

  let row = castRow(data);

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
