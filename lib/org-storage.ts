/**
 * Org localStorage persistence.
 * Per D-06: store last-used org in localStorage, updated on org switch.
 *
 * IMPORTANT: These functions use localStorage and must only be called
 * in browser context (clientLoader, event handlers, components).
 * Never call from server loaders.
 */

const LAST_ORG_KEY = 'aloha:last_org';

export { LAST_ORG_KEY };

export function getLastOrg(): string | null {
  try {
    return localStorage.getItem(LAST_ORG_KEY);
  } catch {
    return null;
  }
}

export function setLastOrg(orgId: string): void {
  try {
    localStorage.setItem(LAST_ORG_KEY, orgId);
  } catch {
    // localStorage may be unavailable in some contexts
  }
}
