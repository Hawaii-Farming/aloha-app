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

function resolveByDisplay(
  record: Record<string, unknown>,
  byField: string | undefined,
): string | null {
  if (!byField) return null;
  const first = record[`${byField}_first_name`];
  const last = record[`${byField}_last_name`];
  const composed = [first, last]
    .filter((v) => typeof v === 'string' && v.length > 0)
    .join(' ');
  if (composed) return composed;
  const raw = record[byField];
  return raw == null ? null : (raw as string);
}

export function buildHistoryEntries(
  record: Record<string, unknown>,
  workflow: WorkflowConfig,
): WorkflowHistoryEntry[] {
  const currentStatus = record[workflow.statusColumn] as string | undefined;
  if (!currentStatus) return [];

  // If the current status matches the configured initial state (e.g. Pending),
  // source the entry from the creation columns (requested_at / requested_by).
  if (
    workflow.initialEntry &&
    workflow.initialEntry.state === currentStatus &&
    record[workflow.initialEntry.atField]
  ) {
    const { state, atField, byField } = workflow.initialEntry;
    return [
      {
        action: workflow.states[state]?.label ?? state,
        at: record[atField] as string,
        by: resolveByDisplay(record, byField),
        color: workflow.states[state]?.color,
      },
    ];
  }

  // Otherwise, emit the entry for the current transitioned-to state.
  const fields = workflow.transitionFields?.[currentStatus];
  if (!fields) return [];

  const atField = Object.entries(fields).find(
    ([_key, value]) => value === 'now',
  )?.[0];
  const byField = Object.entries(fields).find(
    ([_key, value]) => value === 'currentEmployee',
  )?.[0];

  if (!atField || !record[atField]) return [];

  return [
    {
      action: workflow.states[currentStatus]?.label ?? currentStatus,
      at: record[atField] as string,
      by: resolveByDisplay(record, byField),
      color: workflow.states[currentStatus]?.color,
    },
  ];
}
