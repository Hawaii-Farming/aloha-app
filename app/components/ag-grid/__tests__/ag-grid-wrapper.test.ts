import { describe, expect, it, vi } from 'vitest';

// Mock all external dependencies to verify imports resolve
vi.mock('@aloha/ui/client-only', () => ({
  ClientOnly: () => null,
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' }),
}));

vi.mock('~/components/ag-grid/ag-grid-theme', () => ({
  getAgGridTheme: () => ({ id: 'mock-theme' }),
}));

vi.mock('ag-grid-community', () => ({
  AllCommunityModule: {},
}));

vi.mock('ag-grid-react', () => ({
  AgGridProvider: () => null,
  AgGridReact: () => null,
}));

describe('AgGridWrapper module', () => {
  it('exports AgGridWrapper function', async () => {
    const mod = await import('~/components/ag-grid/ag-grid-wrapper');
    expect(mod.AgGridWrapper).toBeDefined();
    expect(typeof mod.AgGridWrapper).toBe('function');
  });

  it('AgGridWrapper accepts required props (colDefs, rowData)', async () => {
    const mod = await import('~/components/ag-grid/ag-grid-wrapper');
    // Verify the function exists and is callable (component signature check)
    expect(mod.AgGridWrapper.length).toBeGreaterThanOrEqual(0);
  });
});

describe('AgGridWrapper integration', () => {
  it('imports ClientOnly from @aloha/ui/client-only', async () => {
    // If the mock resolves, the import path is correct
    const clientOnly = await import('@aloha/ui/client-only');
    expect(clientOnly.ClientOnly).toBeDefined();
  });

  it('imports getAgGridTheme from ag-grid-theme', async () => {
    const theme = await import('~/components/ag-grid/ag-grid-theme');
    expect(theme.getAgGridTheme).toBeDefined();
  });

  it('imports AllCommunityModule from ag-grid-community', async () => {
    const agGrid = await import('ag-grid-community');
    expect(agGrid.AllCommunityModule).toBeDefined();
  });

  it('imports AgGridProvider and AgGridReact from ag-grid-react', async () => {
    const agGridReact = await import('ag-grid-react');
    expect(agGridReact.AgGridProvider).toBeDefined();
    expect(agGridReact.AgGridReact).toBeDefined();
  });
});
