import type { FormFieldConfig, WorkflowConfig } from '~/lib/crud/types';

export interface WorkflowHistoryEntry {
  action: string;
  at: string | null;
  by: string | null;
  color?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary';
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
      // Sentinel: 'today' resolves to current ISO date for date fields.
      if (field.type === 'date' && field.defaultValue === 'today') {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        defaults[field.key] = `${yyyy}-${mm}-${dd}`;
      } else {
        defaults[field.key] = field.defaultValue;
      }
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

  const currentStatus = record[workflow.statusColumn] as string | undefined;

  // Group statuses by their `at` field. When multiple statuses share the
  // same column (e.g. Approved + Denied both write `reviewed_at`), only
  // the current status reflects what actually happened — emitting both
  // would duplicate the same timestamp under two different actions.
  const statusesByAtField = new Map<string, string[]>();
  for (const [status, fields] of Object.entries(workflow.transitionFields)) {
    const atField = Object.entries(fields).find(
      ([_key, value]) => value === 'now',
    )?.[0];
    if (!atField) continue;
    const list = statusesByAtField.get(atField) ?? [];
    list.push(status);
    statusesByAtField.set(atField, list);
  }

  const entries: WorkflowHistoryEntry[] = [];

  for (const [status, fields] of Object.entries(workflow.transitionFields)) {
    const atField = Object.entries(fields).find(
      ([_key, value]) => value === 'now',
    )?.[0];
    const byField = Object.entries(fields).find(
      ([_key, value]) => value === 'currentEmployee',
    )?.[0];

    if (!atField || !record[atField]) continue;

    const sharedWith = statusesByAtField.get(atField) ?? [];
    if (sharedWith.length > 1 && status !== currentStatus) continue;

    entries.push({
      action: workflow.states[status]?.label ?? status,
      at: record[atField] as string,
      by: byField ? (record[byField] as string | null) : null,
      color: workflow.states[status]?.color,
    });
  }

  entries.sort((a, b) => new Date(a.at!).getTime() - new Date(b.at!).getTime());

  return entries;
}
