import { describe, expect, it } from 'vitest';

// NOTE: This import intentionally points at a module that does not yet exist.
// Phase 10 Plan 04 (PARITY-03) will create `app/lib/workspace/get-org-initials.ts`.
// Until then this test file is the authoritative red signal for Wave 0: the
// runtime import throws "module not found", which is exactly the Wave 0 state.
// `@ts-expect-error` keeps `pnpm typecheck` green until Plan 04 creates the
// module — at which point the directive itself becomes an unused-error that
// TypeScript will flag, prompting us to remove it as part of the same edit.
// @ts-expect-error — module is created in Plan 10-04 (PARITY-03); red is intentional.
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
