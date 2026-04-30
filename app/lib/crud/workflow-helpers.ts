import type { FormFieldConfig, WorkflowConfig } from '~/lib/crud/types';

export interface WorkflowHistoryEntry {
  action: string;
  at: string | null;
  by: string | null;
}

export function buildDefaultValues(
  fields: FormFieldConfig[],
  record: Record<string, unknown> | null,
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  for (const field of fields) {
    const recordValue = record?.[field.key];
    if (recordValue !== undefined && recordValue !== null) {
      defaults[field.key] = recordValue;
      continue;
    }

    // Create mode: honor field-level defaultValue when present.
    if (record === null && field.defaultValue !== undefined) {
      defaults[field.key] = field.defaultValue;
      continue;
    }

    if (field.type === 'boolean') {
      defaults[field.key] = false;
    } else if (field.type === 'number') {
      defaults[field.key] = undefined;
    } else {
      defaults[field.key] = '';
    }
  }

  return defaults;
}

export function buildHistoryEntries(
  record: Record<string, unknown>,
  workflow: WorkflowConfig,
): WorkflowHistoryEntry[] {
  if (!workflow.transitionFields) {
    return [];
  }

  const entries: WorkflowHistoryEntry[] = [];

  for (const [status, fields] of Object.entries(workflow.transitionFields)) {
    const atField = Object.entries(fields).find(
      ([_key, value]) => value === 'now',
    )?.[0];
    const byField = Object.entries(fields).find(
      ([_key, value]) => value === 'currentEmployee',
    )?.[0];

    if (atField && record[atField]) {
      entries.push({
        action: workflow.states[status]?.label ?? status,
        at: record[atField] as string,
        by: byField ? (record[byField] as string | null) : null,
      });
    }
  }

  entries.sort((a, b) => new Date(a.at!).getTime() - new Date(b.at!).getTime());

  return entries;
}
