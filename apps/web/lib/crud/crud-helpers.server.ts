import type { SupabaseClient } from '@supabase/supabase-js';

export interface LoadTableDataParams {
  client: SupabaseClient;
  viewName: string;
  orgId: string;
  searchParams: URLSearchParams;
  searchColumns?: string[];
  defaultSort?: { column: string; ascending: boolean };
  pageSize?: number;
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
  const sortBy =
    params.searchParams.get('sort') ??
    params.defaultSort?.column ??
    'created_at';
  const sortDir =
    params.searchParams.get('dir') ??
    (params.defaultSort?.ascending ? 'asc' : 'desc');
  const search = params.searchParams.get('q') ?? '';
  const showDeleted = params.searchParams.get('deleted') === 'true';
  const size = params.pageSize ?? 25;
  const from = (page - 1) * size;
  const to = from + size - 1;

  let query = params.client
    .from(params.viewName)
    .select('*', { count: 'exact' })
    .eq('org_id', params.orgId);

  // Soft-delete filter (TABLE-08)
  if (!showDeleted) {
    query = query.eq('is_deleted', false);
  }

  // Text search (TABLE-05) using PostgREST .or() syntax
  if (search && params.searchColumns?.length) {
    const searchFilter = params.searchColumns
      .map((col) => `${col}.ilike.%${search}%`)
      .join(',');
    query = query.or(searchFilter);
  }

  // Column filters (TABLE-04): parse filter_<column>=value from search params
  for (const [key, value] of params.searchParams.entries()) {
    if (key.startsWith('filter_') && value) {
      const column = key.replace('filter_', '');
      query = query.eq(column, value);
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

  return {
    data: (data ?? []) as T[],
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
}

export async function loadDetailData<T = Record<string, unknown>>(
  params: LoadDetailDataParams,
): Promise<T> {
  const { data, error } = await params.client
    .from(params.viewName)
    .select('*')
    .eq('org_id', params.orgId)
    .eq(params.pkColumn, params.pkValue)
    .single();

  if (error || !data) {
    throw new Response('Not Found', { status: 404 });
  }

  return data as T;
}
