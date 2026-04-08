import type { GridApi } from 'ag-grid-community';

const STORAGE_PREFIX = 'ag-grid-state-';
const STATE_VERSION = 3;

interface StoredState {
  version: number;
  columns: unknown[];
}

export function saveColumnState(subModuleSlug: string, api: GridApi): void {
  const state = api.getColumnState();
  const stored: StoredState = { version: STATE_VERSION, columns: state };
  localStorage.setItem(
    `${STORAGE_PREFIX}${subModuleSlug}`,
    JSON.stringify(stored),
  );
}

export function restoreColumnState(subModuleSlug: string, api: GridApi): void {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${subModuleSlug}`);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw) as StoredState;
    if (stored.version !== STATE_VERSION) {
      clearColumnState(subModuleSlug);
      return;
    }
    api.applyColumnState({
      state: stored.columns as Parameters<
        typeof api.applyColumnState
      >[0]['state'],
      applyOrder: true,
    });
  } catch {
    clearColumnState(subModuleSlug);
  }
}

export function clearColumnState(subModuleSlug: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${subModuleSlug}`);
}
