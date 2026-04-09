import type { SupabaseClient } from '@supabase/supabase-js';

import type { z } from 'zod';

interface CrudActionParams {
  client: SupabaseClient;
  tableName: string;
  orgId: string;
  employeeId: string;
}

export async function crudCreateAction(
  params: CrudActionParams & {
    data: Record<string, unknown>;
    schema: z.ZodType;
    pkType: 'text' | 'uuid';
    generatePk?: (data: Record<string, unknown>) => string;
    additionalFields?: Record<string, 'currentEmployee' | 'currentOrg'>;
  },
) {
  const parsed = params.schema.safeParse(params.data);

  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten() };
  }

  const insertData: Record<string, unknown> = {
    ...parsed.data,
    org_id: params.orgId,
    created_by: params.employeeId,
    updated_by: params.employeeId,
  };

  if (params.generatePk) {
    insertData.id = params.generatePk(parsed.data as Record<string, unknown>);
  }

  if (params.additionalFields) {
    for (const [field, value] of Object.entries(params.additionalFields)) {
      if (value === 'currentEmployee') {
        insertData[field] = params.employeeId;
      } else if (value === 'currentOrg') {
        insertData[field] = params.orgId;
      }
    }
  }

  const { data, error } = await params.client
    .from(params.tableName)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}

export async function crudUpdateAction(
  params: CrudActionParams & {
    data: Record<string, unknown>;
    schema: z.ZodType;
    pkColumn: string;
    pkValue: string;
  },
) {
  const parsed = params.schema.safeParse(params.data);

  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten() };
  }

  const updateData = {
    ...parsed.data,
    updated_by: params.employeeId,
  };

  const { data, error } = await params.client
    .from(params.tableName)
    .update(updateData)
    .eq(params.pkColumn, params.pkValue)
    .eq('org_id', params.orgId)
    .select()
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}

export async function crudDeleteAction(
  params: CrudActionParams & {
    pkColumn: string;
    pkValue: string;
  },
) {
  // Soft delete: set is_deleted = true, not actual DELETE
  const { error } = await params.client
    .from(params.tableName)
    .update({
      is_deleted: true,
      updated_by: params.employeeId,
    })
    .eq(params.pkColumn, params.pkValue)
    .eq('org_id', params.orgId);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function crudBulkDeleteAction(
  params: CrudActionParams & {
    pkColumn: string;
    pkValues: string[];
  },
) {
  const { error } = await params.client
    .from(params.tableName)
    .update({
      is_deleted: true,
      updated_by: params.employeeId,
    })
    .in(params.pkColumn, params.pkValues)
    .eq('org_id', params.orgId);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, count: params.pkValues.length };
}

export async function crudBulkTransitionAction(
  params: CrudActionParams & {
    pkColumn: string;
    pkValues: string[];
    statusColumn: string;
    newStatus: string;
    transitionFields?: Record<string, 'now' | 'currentEmployee'>;
    extraFields?: Record<string, unknown>;
  },
) {
  const updateData: Record<string, unknown> = {
    [params.statusColumn]: params.newStatus,
    updated_by: params.employeeId,
  };

  if (params.transitionFields) {
    for (const [field, value] of Object.entries(params.transitionFields)) {
      if (value === 'now') {
        updateData[field] = new Date().toISOString();
      } else if (value === 'currentEmployee') {
        updateData[field] = params.employeeId;
      }
    }
  }

  if (params.extraFields) {
    Object.assign(updateData, params.extraFields);
  }

  const { error } = await params.client
    .from(params.tableName)
    .update(updateData)
    .in(params.pkColumn, params.pkValues)
    .eq('org_id', params.orgId);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, count: params.pkValues.length };
}

export async function crudTransitionAction(
  params: CrudActionParams & {
    pkColumn: string;
    pkValue: string;
    statusColumn: string;
    newStatus: string;
    transitionFields?: Record<string, 'now' | 'currentEmployee'>;
    extraFields?: Record<string, unknown>;
  },
) {
  const updateData: Record<string, unknown> = {
    [params.statusColumn]: params.newStatus,
    updated_by: params.employeeId,
  };

  // WF-03: Set transition fields (e.g., approved_at = now, approved_by = currentEmployee)
  if (params.transitionFields) {
    for (const [field, value] of Object.entries(params.transitionFields)) {
      if (value === 'now') {
        updateData[field] = new Date().toISOString();
      } else if (value === 'currentEmployee') {
        updateData[field] = params.employeeId;
      }
    }
  }

  if (params.extraFields) {
    Object.assign(updateData, params.extraFields);
  }

  const { error } = await params.client
    .from(params.tableName)
    .update(updateData)
    .eq(params.pkColumn, params.pkValue)
    .eq('org_id', params.orgId);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}
