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
