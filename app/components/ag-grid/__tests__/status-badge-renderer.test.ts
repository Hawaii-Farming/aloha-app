import { describe, expect, it } from 'vitest';

import { getStatusVariant } from '../cell-renderers/status-badge-renderer';

describe('getStatusVariant', () => {
  it('maps approved to success variant', () => {
    expect(getStatusVariant('approved')).toBe('success');
  });

  it('maps active to success variant', () => {
    expect(getStatusVariant('active')).toBe('success');
  });

  it('maps pending to warning variant', () => {
    expect(getStatusVariant('pending')).toBe('warning');
  });

  it('maps denied to destructive variant', () => {
    expect(getStatusVariant('denied')).toBe('destructive');
  });

  it('maps rejected to destructive variant', () => {
    expect(getStatusVariant('rejected')).toBe('destructive');
  });

  it('maps inactive to outline variant', () => {
    expect(getStatusVariant('inactive')).toBe('outline');
  });

  it('falls back to secondary for unknown status', () => {
    expect(getStatusVariant('unknown')).toBe('secondary');
  });
});
