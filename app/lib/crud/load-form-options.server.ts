import type { SupabaseClient } from '@supabase/supabase-js';

import type { CrudModuleConfig } from '~/lib/crud/types';
import type { Database } from '~/lib/database.types';

import { castRows } from './typed-query.server';

export interface FormOptions {
  fkOptions: Record<string, Array<{ value: string; label: string }>>;
  comboboxOptions: Record<string, string[]>;
}

interface LoadFormOptionsParams {
  client: SupabaseClient<Database>;
  config: CrudModuleConfig | undefined;
  orgId: string;
  subModuleSlug: string;
}

/**
 * Loads FK dropdown options and combobox suggestion lists for a CRUD form.
 * Each FK/combobox query is wrapped in try/catch so a single failure (bad
 * table name, RLS denial, etc.) does not crash the entire page — the field
 * just renders with an empty list.
 *
 * Used by sub-module.tsx, sub-module-detail.tsx, and sub-module-create.tsx.
 */
export async function loadFormOptions(
  params: LoadFormOptionsParams,
): Promise<FormOptions> {
  const { client, config, orgId } = params;

  const fkOptions: Record<string, Array<{ value: string; label: string }>> = {};
  const comboboxOptions: Record<string, string[]> = {};

  if (!config) {
    return { fkOptions, comboboxOptions };
  }

  const fkFields = (config.formFields ?? []).filter(
    (f) =>
      f.type === 'fk' &&
      f.fkTable &&
      (f.fkLabelColumn || (f.fkLabelColumns && f.fkLabelColumns.length > 0)),
  );

  const comboboxFields = (config.formFields ?? []).filter(
    (f) => f.type === 'combobox',
  );

  // Load all FK and combobox queries in parallel. allSettled means a single
  // failure does not block the rest — the failed field just gets an empty list.
  const fkPromises = fkFields.map(async (field) => {
    const labelCols =
      field.fkLabelColumns && field.fkLabelColumns.length > 0
        ? field.fkLabelColumns
        : [field.fkLabelColumn!];
    const orderCol = field.fkOrderColumn ?? labelCols[0]!;
    const selectCols = new Set(['id', orderCol, ...labelCols]);
    let query = client
      .from(field.fkTable! as never)
      .select([...selectCols].join(', '))
      .eq('is_deleted', false);

    if (field.fkOrgScoped !== false) {
      query = query.eq('org_id', orgId);
    }

    if (field.fkFilter) {
      for (const [col, val] of Object.entries(field.fkFilter)) {
        query = query.eq(col, val);
      }
    }

    const { data, error } = await query.order(orderCol).limit(200);

    if (error) {
      console.error(
        `[loadFormOptions] FK lookup failed for ${field.key} (${field.fkTable}):`,
        error.message,
      );
      return { key: field.key, options: [] };
    }

    const rows = castRows(data);
    return {
      key: field.key,
      options: rows.map((row) => ({
        value: String(row['id']),
        label: labelCols
          .map((c) => row[c])
          .filter((v) => v !== null && v !== undefined && String(v).length > 0)
          .map((v) => String(v))
          .join(' '),
      })),
    };
  });

  const comboboxPromises = comboboxFields.map(async (field) => {
    const source = field.comboboxSource ?? {
      table: config.tableName ?? params.subModuleSlug,
      column: field.key,
    };

    const { data, error } = await client
      .from(source.table as never)
      .select(source.column)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .not(source.column, 'is', null)
      .order(source.column)
      .limit(500);

    if (error) {
      console.error(
        `[loadFormOptions] Combobox lookup failed for ${field.key} (${source.table}.${source.column}):`,
        error.message,
      );
      return { key: field.key, values: [] };
    }

    const rows = castRows(data);
    const unique = [...new Set(rows.map((r) => String(r[source.column])))];
    return { key: field.key, values: unique };
  });

  const [fkResults, comboboxResults] = await Promise.all([
    Promise.allSettled(fkPromises),
    Promise.allSettled(comboboxPromises),
  ]);

  for (const result of fkResults) {
    if (result.status === 'fulfilled') {
      fkOptions[result.value.key] = result.value.options;
    }
  }

  for (const result of comboboxResults) {
    if (result.status === 'fulfilled') {
      comboboxOptions[result.value.key] = result.value.values;
    }
  }

  return { fkOptions, comboboxOptions };
}
