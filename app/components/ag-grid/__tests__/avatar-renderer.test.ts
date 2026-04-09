import { describe, expect, it } from 'vitest';

import { getInitials } from '../cell-renderers/avatar-renderer';

describe('getInitials', () => {
  it('returns uppercase initials from first and last name', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
  });

  it('handles single character names', () => {
    expect(getInitials('A', 'B')).toBe('AB');
  });

  it('returns empty string when both names are empty', () => {
    expect(getInitials('', '')).toBe('');
  });

  it('returns first initial when last name is empty', () => {
    expect(getInitials('John', '')).toBe('J');
  });

  it('returns last initial when first name is empty', () => {
    expect(getInitials('', 'Doe')).toBe('D');
  });

  it('handles undefined values gracefully', () => {
    expect(getInitials(undefined, undefined)).toBe('');
  });
});
