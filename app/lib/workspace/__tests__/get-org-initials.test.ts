import { describe, expect, it } from 'vitest';

import { getOrgInitials } from '../get-org-initials';

describe('getOrgInitials', () => {
  it('returns two-letter initials for a two-word org name', () => {
    expect(getOrgInitials('Hawaii Farming')).toBe('HF');
  });

  it('returns one-letter initials for a single-word org name', () => {
    expect(getOrgInitials('Aloha')).toBe('A');
  });

  it('collapses duplicated whitespace and caps at two initials', () => {
    expect(getOrgInitials('hawaii  farming  corp')).toBe('HF');
  });

  it('falls back to the first letter of the user email when org name is empty', () => {
    expect(getOrgInitials('', 'jean@example.com')).toBe('J');
  });

  it('falls back to "A" when both inputs are null', () => {
    expect(getOrgInitials(null, null)).toBe('A');
  });

  it('falls back to "A" when the org name is undefined', () => {
    expect(getOrgInitials(undefined)).toBe('A');
  });

  it('does not throw on script-like inputs and caps length at 2', () => {
    expect(() => getOrgInitials('<script>alert(1)</script>')).not.toThrow();
    const result = getOrgInitials('<script>alert(1)</script>');
    expect(result.length).toBeLessThanOrEqual(2);
  });
});
