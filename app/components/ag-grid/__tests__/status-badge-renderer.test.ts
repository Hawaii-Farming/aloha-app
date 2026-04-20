import { describe, expect, it } from 'vitest';

import { StatusBadgeRenderer } from '../cell-renderers/status-badge-renderer';

describe('StatusBadgeRenderer', () => {
  it('is exported as a function', () => {
    expect(typeof StatusBadgeRenderer).toBe('function');
  });

  it('returns null for falsy values (null, undefined, empty string)', () => {
    expect(StatusBadgeRenderer({ value: null } as never)).toBeNull();
    expect(StatusBadgeRenderer({ value: undefined } as never)).toBeNull();
    expect(StatusBadgeRenderer({ value: '' } as never)).toBeNull();
  });

  it('returns a JSX span element for a non-empty string value', () => {
    const out = StatusBadgeRenderer({ value: 'approved' } as never) as {
      type: string;
      props: { className: string; children: string };
    } | null;
    expect(out).not.toBeNull();
    expect(out!.type).toBe('span');
    expect(out!.props.className).toContain('capitalize');
    expect(out!.props.children).toBe('approved');
  });
});
