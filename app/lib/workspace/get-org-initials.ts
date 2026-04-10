/**
 * Derives a short (1-2 character) initial string from an org name,
 * falling back to the first letter of the user's email, and finally
 * to the literal 'A' (for Aloha). Used by the navbar and sidebar-footer
 * avatar fallbacks so the signed-in user can see which tenant they are
 * currently scoped to at a glance.
 *
 * Contract:
 *   - 'Hawaii Farming'                    -> 'HF'
 *   - 'Aloha'                             -> 'A'
 *   - 'hawaii  farming  corp'             -> 'HF' (max 2 words, whitespace collapsed)
 *   - '', 'jean@example.com'              -> 'J'
 *   - null, null                          -> 'A'
 *   - undefined                           -> 'A'
 *   - '<script>alert(1)</script>'         -> length <= 2, no throw
 *
 * Pure: no side effects, safe to call during render.
 */
export function getOrgInitials(
  orgName: string | null | undefined,
  fallbackEmail?: string | null,
): string {
  const name = (orgName ?? '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
    const letters = parts
      .map((p) => p[0]!.toUpperCase())
      .join('')
      .slice(0, 2);
    if (letters) return letters;
  }
  const email = (fallbackEmail ?? '').trim();
  if (email) return email[0]!.toUpperCase();
  return 'A';
}
