import { describe, expect, it } from 'vitest';

import { getAgGridTheme } from '../ag-grid-theme';

describe('getAgGridTheme', () => {
  it('returns a theme object (not null/undefined)', () => {
    const theme = getAgGridTheme();
    expect(theme).toBeTruthy();
  });

  it('does not throw when called', () => {
    expect(() => getAgGridTheme()).not.toThrow();
  });
});
