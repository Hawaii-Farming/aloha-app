import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearColumnState,
  restoreColumnState,
  saveColumnState,
} from '../column-state';

const mockStorage: Record<string, string> = {};

const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};

const mockApi = {
  getColumnState: vi.fn(() => [
    { colId: 'name', width: 200 },
    { colId: 'status', width: 100 },
  ]),
  applyColumnState: vi.fn(() => true),
};

beforeEach(() => {
  vi.stubGlobal('localStorage', mockLocalStorage);
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveColumnState', () => {
  it('stores JSON with version key in localStorage', () => {
    saveColumnState('employees', mockApi as never);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'ag-grid-state-employees',
      expect.any(String),
    );

    const stored = JSON.parse(
      mockLocalStorage.setItem.mock.calls[0]?.[1] as string,
    );
    expect(stored.version).toBe(1);
    expect(stored.columns).toEqual([
      { colId: 'name', width: 200 },
      { colId: 'status', width: 100 },
    ]);
  });
});

describe('restoreColumnState', () => {
  it('calls applyColumnState with stored data', () => {
    mockStorage['ag-grid-state-employees'] = JSON.stringify({
      version: 1,
      columns: [{ colId: 'name', width: 300 }],
    });

    restoreColumnState('employees', mockApi as never);

    expect(mockApi.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: 'name', width: 300 }],
      applyOrder: true,
    });
  });

  it('does nothing when no saved state', () => {
    restoreColumnState('employees', mockApi as never);

    expect(mockApi.applyColumnState).not.toHaveBeenCalled();
  });

  it('clears corrupted data (invalid JSON)', () => {
    mockStorage['ag-grid-state-employees'] = 'not-json{{{';

    restoreColumnState('employees', mockApi as never);

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
      'ag-grid-state-employees',
    );
    expect(mockApi.applyColumnState).not.toHaveBeenCalled();
  });

  it('clears state with mismatched version', () => {
    mockStorage['ag-grid-state-employees'] = JSON.stringify({
      version: 999,
      columns: [{ colId: 'name', width: 300 }],
    });

    restoreColumnState('employees', mockApi as never);

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
      'ag-grid-state-employees',
    );
    expect(mockApi.applyColumnState).not.toHaveBeenCalled();
  });
});

describe('clearColumnState', () => {
  it('removes key from localStorage', () => {
    mockStorage['ag-grid-state-employees'] = 'some-data';

    clearColumnState('employees');

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
      'ag-grid-state-employees',
    );
  });
});
