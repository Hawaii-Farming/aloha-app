import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '~/lib/database.types';

/**
 * Cast Supabase query result data (typed as the generated row or unknown)
 * to a typed array. Centralizes the single boundary cast so callers
 * never need `as unknown as` inline.
 */
export function castRows<T = Record<string, unknown>>(data: unknown): T[] {
  return (data ?? []) as T[];
}

/**
 * Cast a single Supabase query result row to the expected type.
 */
export function castRow<T = Record<string, unknown>>(data: unknown): T {
  return data as T;
}

/**
 * Query a view/table that is not present in the generated Database type.
 * Uses `as never` on the table name to satisfy the Supabase generic constraint.
 */
export function queryUntypedView(
  client: SupabaseClient<Database>,
  viewName: string,
) {
  return client.from(viewName as never);
}

/**
 * Type guard for narrowing unknown errors to objects with a `code` property.
 */
export function isErrorWithCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}
