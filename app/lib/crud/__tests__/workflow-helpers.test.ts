import { describe, expect, it } from 'vitest';

import type { WorkflowConfig } from '~/lib/crud/types';

import { buildHistoryEntries } from '../workflow-helpers';

const baseStates = {
  Pending: { label: 'Pending', color: 'warning' as const },
  Approved: { label: 'Approved', color: 'success' as const },
  Denied: { label: 'Denied', color: 'destructive' as const },
};

const baseTransitions = {
  Pending: ['Approved', 'Denied'],
  Approved: [],
  Denied: ['Pending'],
};

const baseTransitionFields = {
  Approved: { reviewed_by: 'currentEmployee', reviewed_at: 'now' },
  Denied: { reviewed_by: 'currentEmployee', reviewed_at: 'now' },
} as const;

const workflow: WorkflowConfig = {
  statusColumn: 'status',
  states: baseStates,
  transitions: baseTransitions,
  transitionFields: baseTransitionFields,
  initialEntry: {
    state: 'Pending',
    atField: 'requested_at',
    byField: 'requested_by',
  },
};

describe('buildHistoryEntries', () => {
  it('emits the initial Pending entry when only requested_at is set', () => {
    const entries = buildHistoryEntries(
      {
        status: 'Pending',
        requested_at: '2025-03-23T09:21:34Z',
        requested_by: 'pavao_peter',
      },
      workflow,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]!.action).toBe('Pending');
    expect(entries[0]!.color).toBe('warning');
    expect(entries[0]!.by).toBe('pavao_peter');
  });

  it('resolves the by field to "First Last" when selfJoin enriched', () => {
    const entries = buildHistoryEntries(
      {
        status: 'Pending',
        requested_at: '2025-03-23T09:21:34Z',
        requested_by: 'pavao_peter',
        requested_by_first_name: 'Peter',
        requested_by_last_name: 'Pavao',
      },
      workflow,
    );

    expect(entries[0]!.by).toBe('Peter Pavao');
  });

  it('emits Pending + Approved when status is Approved', () => {
    const entries = buildHistoryEntries(
      {
        status: 'Approved',
        requested_at: '2025-03-23T09:21:34Z',
        requested_by: 'karen',
        reviewed_at: '2025-03-23T14:57:27Z',
        reviewed_by: 'pavao_peter',
      },
      workflow,
    );

    expect(entries.map((e) => e.action)).toEqual(['Pending', 'Approved']);
  });

  it('dedupes shared reviewed_at column — only emits the current status entry', () => {
    // Approved + Denied both write reviewed_at. Without the dedupe guard
    // this would emit BOTH transition rows even though only one happened.
    const entries = buildHistoryEntries(
      {
        status: 'Approved',
        requested_at: '2025-03-23T09:21:34Z',
        reviewed_at: '2025-03-23T14:57:27Z',
        reviewed_by: 'pavao_peter',
      },
      workflow,
    );

    const transitions = entries.filter((e) => e.action !== 'Pending');
    expect(transitions).toHaveLength(1);
    expect(transitions[0]!.action).toBe('Approved');
  });

  it('sorts entries chronologically by `at`', () => {
    const entries = buildHistoryEntries(
      {
        status: 'Approved',
        requested_at: '2025-03-23T09:00:00Z',
        reviewed_at: '2025-03-23T14:00:00Z',
      },
      workflow,
    );

    const times = entries.map((e) => e.at);
    expect(times).toEqual([...times].sort());
  });

  it('returns empty when transitionFields and initialEntry are absent', () => {
    const entries = buildHistoryEntries(
      { status: 'Pending' },
      {
        statusColumn: 'status',
        states: baseStates,
        transitions: baseTransitions,
      },
    );
    expect(entries).toEqual([]);
  });

  it('omits the initial entry when requested_at is missing', () => {
    const entries = buildHistoryEntries(
      {
        status: 'Approved',
        reviewed_at: '2025-03-23T14:57:27Z',
        reviewed_by: 'pavao_peter',
      },
      workflow,
    );

    expect(entries.map((e) => e.action)).toEqual(['Approved']);
  });
});
