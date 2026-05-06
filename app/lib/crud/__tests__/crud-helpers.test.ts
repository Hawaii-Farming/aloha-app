import type { SupabaseClient } from '@supabase/supabase-js';

import { describe, expect, it } from 'vitest';

import type { Database } from '~/lib/database.types';

import { sanitizeSearch } from '../crud-helpers.server';

// ============================================================
// sanitizeSearch
// ============================================================

describe('sanitizeSearch', () => {
  it('strips parentheses', () => {
    expect(sanitizeSearch('foo(bar)')).toBe('foobar');
  });

  it('strips commas', () => {
    expect(sanitizeSearch('foo,bar')).toBe('foobar');
  });

  it('strips asterisks', () => {
    expect(sanitizeSearch('foo*bar')).toBe('foobar');
  });

  it('trims whitespace', () => {
    expect(sanitizeSearch('  hello  ')).toBe('hello');
  });

  it('passes through clean input', () => {
    expect(sanitizeSearch('normal search')).toBe('normal search');
  });

  it('handles empty string', () => {
    expect(sanitizeSearch('')).toBe('');
  });

  it('strips mixed delimiters', () => {
    expect(sanitizeSearch('a(b,c)*d')).toBe('abcd');
  });
});

// ============================================================
// loadTableData — sort and filter validation via mock client
// ============================================================

// Typed mock factory that records method calls without Proxy
function createMockSupabaseChain() {
  const calls: { method: string; args: unknown[] }[] = [];

  const chain: Record<string, (...args: unknown[]) => unknown> = {};

  const methods = [
    'select',
    'eq',
    'is',
    'not',
    'or',
    'ilike',
    'order',
    'in',
  ] as const;

  for (const method of methods) {
    chain[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    };
  }

  chain.range = (...args: unknown[]) => {
    calls.push({ method: 'range', args });
    return Promise.resolve({ data: [], count: 0, error: null });
  };

  const client = {
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] });
      return chain;
    },
  };

  return {
    client: client as unknown as SupabaseClient<Database>,
    calls,
  };
}

// Dynamic import to handle the .server.ts module in vitest
async function getLoadTableData() {
  const mod = await import('../crud-helpers.server');
  return mod.loadTableData;
}

describe('loadTableData sort validation', () => {
  it('falls back to default sort when column not in whitelist', async () => {
    const { client, calls } = createMockSupabaseChain();
    const loadTableData = await getLoadTableData();

    await loadTableData({
      client,
      viewName: 'test_view',
      orgId: 'acme-farms',
      searchParams: new URLSearchParams('sort=evil_column'),
      allowedColumns: ['name'],
      defaultSort: { column: 'created_at', ascending: false },
    });

    const orderCall = calls.find((c) => c.method === 'order');
    expect(orderCall).toBeDefined();
    expect(orderCall!.args[0]).toBe('created_at');
  });

  it('honors whitelisted sort column', async () => {
    const { client, calls } = createMockSupabaseChain();
    const loadTableData = await getLoadTableData();

    await loadTableData({
      client,
      viewName: 'test_view',
      orgId: 'acme-farms',
      searchParams: new URLSearchParams('sort=name'),
      allowedColumns: ['name'],
    });

    const orderCall = calls.find((c) => c.method === 'order');
    expect(orderCall).toBeDefined();
    expect(orderCall!.args[0]).toBe('name');
  });
});

describe('loadTableData filter validation', () => {
  it('rejects filter when column not in whitelist', async () => {
    const { client, calls } = createMockSupabaseChain();
    const loadTableData = await getLoadTableData();

    await loadTableData({
      client,
      viewName: 'test_view',
      orgId: 'acme-farms',
      searchParams: new URLSearchParams('filter_evil=value'),
      allowedColumns: ['name'],
    });

    // eq is called for org_id and is_deleted, but NOT for 'evil'
    const eqCalls = calls.filter((c) => c.method === 'eq');
    const evilCall = eqCalls.find((c) => c.args[0] === 'evil');
    expect(evilCall).toBeUndefined();
  });

  it('accepts filter when column is whitelisted', async () => {
    const { client, calls } = createMockSupabaseChain();
    const loadTableData = await getLoadTableData();

    await loadTableData({
      client,
      viewName: 'test_view',
      orgId: 'acme-farms',
      searchParams: new URLSearchParams('filter_name=John'),
      allowedColumns: ['name'],
    });

    const eqCalls = calls.filter((c) => c.method === 'eq');
    const nameCall = eqCalls.find(
      (c) => c.args[0] === 'name' && c.args[1] === 'John',
    );
    expect(nameCall).toBeDefined();
  });
});

// ============================================================
// resolveSelfJoins (via loadTableData) — cross-table lookup behavior
// ============================================================

interface SelfJoinFixture {
  /** Rows the main `viewName` query returns. */
  mainRows: Record<string, unknown>[];
  /** Lookup table → rows returned for the .in('id', ...) call against it. */
  lookups: Record<string, Record<string, unknown>[]>;
}

/** Mock that routes `from(table)` to either the main result or a per-table
 *  lookup based on the simple-call sequence resolveSelfJoins makes:
 *    .from(table).select('id, ...').in('id', [...])
 *  ...resolving with the rows configured for that table. */
function createSelfJoinMock(fixture: SelfJoinFixture) {
  const calls: { method: string; args: unknown[]; table?: string }[] = [];
  const fromSeen: string[] = [];

  function makeChain(table: string) {
    const chain: Record<string, (...args: unknown[]) => unknown> = {};
    const passthrough = ['select', 'eq', 'is', 'not', 'or', 'ilike', 'order'];

    for (const method of passthrough) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ method, args, table });
        return chain;
      };
    }

    chain.in = (...args: unknown[]) => {
      calls.push({ method: 'in', args, table });
      // The lookup queries terminate in `.in('id', [...])` and are awaited
      // directly. Resolve with the configured fixture rows for that table.
      return Promise.resolve({
        data: fixture.lookups[table] ?? [],
        error: null,
      });
    };

    chain.range = (...args: unknown[]) => {
      // The main viewName query terminates in `.range(from, to)`.
      calls.push({ method: 'range', args, table });
      return Promise.resolve({
        data: fixture.mainRows,
        count: fixture.mainRows.length,
        error: null,
      });
    };

    return chain;
  }

  const client = {
    from: (table: string) => {
      fromSeen.push(table);
      calls.push({ method: 'from', args: [table], table });
      return makeChain(table);
    },
  };

  return {
    client: client as unknown as SupabaseClient<Database>,
    calls,
    fromSeen,
  };
}

describe('resolveSelfJoins (via loadTableData)', () => {
  it('enriches rows with cross-table display fields', async () => {
    const { client } = createSelfJoinMock({
      mainRows: [
        { id: 'r1', subject_compensation_manager_id: 'pavao_peter' },
        { id: 'r2', subject_compensation_manager_id: null },
      ],
      lookups: {
        hr_employee: [
          { id: 'pavao_peter', first_name: 'Peter', last_name: 'Pavao' },
        ],
      },
    });

    const loadTableData = await getLoadTableData();
    const result = await loadTableData<Record<string, unknown>>({
      client,
      viewName: 'hr_time_off_request',
      orgId: 'acme',
      searchParams: new URLSearchParams(),
      selfJoins: {
        subject_compensation_manager_id: {
          table: 'hr_employee',
          displayFields: ['first_name', 'last_name'],
        },
      },
    });

    expect(result.data[0]!.subject_compensation_manager_id_first_name).toBe(
      'Peter',
    );
    expect(result.data[0]!.subject_compensation_manager_id_last_name).toBe(
      'Pavao',
    );
    // Null FK -> null enrichment
    expect(result.data[1]!.subject_compensation_manager_id_first_name).toBe(
      null,
    );
  });

  it('batches multiple selfJoins targeting the same table into one query', async () => {
    const { client, fromSeen } = createSelfJoinMock({
      mainRows: [
        {
          id: 'r1',
          requested_by: 'karen',
          reviewed_by: 'pavao_peter',
          subject_compensation_manager_id: 'pavao_peter',
        },
      ],
      lookups: {
        hr_employee: [
          { id: 'karen', first_name: 'Karen', last_name: 'Martins' },
          { id: 'pavao_peter', first_name: 'Peter', last_name: 'Pavao' },
        ],
      },
    });

    const loadTableData = await getLoadTableData();
    await loadTableData<Record<string, unknown>>({
      client,
      viewName: 'hr_time_off_request',
      orgId: 'acme',
      searchParams: new URLSearchParams(),
      selfJoins: {
        requested_by: {
          table: 'hr_employee',
          displayFields: ['first_name', 'last_name'],
        },
        reviewed_by: {
          table: 'hr_employee',
          displayFields: ['first_name', 'last_name'],
        },
        subject_compensation_manager_id: {
          table: 'hr_employee',
          displayFields: ['first_name', 'last_name'],
        },
      },
    });

    // One call to from('hr_time_off_request') for the main query, and
    // exactly ONE call to from('hr_employee') for the bundled lookup.
    const employeeQueries = fromSeen.filter((t) => t === 'hr_employee');
    expect(employeeQueries).toHaveLength(1);
  });

  it('writes null for unmatched FK ids', async () => {
    const { client } = createSelfJoinMock({
      mainRows: [{ id: 'r1', requested_by: 'unknown_id' }],
      lookups: { hr_employee: [] },
    });

    const loadTableData = await getLoadTableData();
    const result = await loadTableData<Record<string, unknown>>({
      client,
      viewName: 'hr_time_off_request',
      orgId: 'acme',
      searchParams: new URLSearchParams(),
      selfJoins: {
        requested_by: {
          table: 'hr_employee',
          displayFields: ['first_name', 'last_name'],
        },
      },
    });

    expect(result.data[0]!.requested_by_first_name).toBe(null);
    expect(result.data[0]!.requested_by_last_name).toBe(null);
  });

  it('still supports the legacy string spec (same-table self-join)', async () => {
    const { client } = createSelfJoinMock({
      mainRows: [{ id: 'a', compensation_manager_id: 'b' }],
      lookups: {
        hr_employee: [{ id: 'b', preferred_name: 'Pete' }],
      },
    });

    const loadTableData = await getLoadTableData();
    const result = await loadTableData<Record<string, unknown>>({
      client,
      viewName: 'hr_employee',
      orgId: 'acme',
      searchParams: new URLSearchParams(),
      selfJoins: { compensation_manager_id: 'preferred_name' },
    });

    expect(result.data[0]!.compensation_manager_id_preferred_name).toBe('Pete');
  });
});
