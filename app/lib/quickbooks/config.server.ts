/**
 * QuickBooks Online OAuth + API configuration.
 *
 * Reads INTUIT_* env vars and surfaces:
 *   - the OAuth endpoints (constant for all environments)
 *   - the API base URL (differs between sandbox and production)
 *   - the registered redirect URI
 *
 * Server-only — never import from the browser.
 */
import process from 'node:process';
import { z } from 'zod';

const envSchema = z.object({
  INTUIT_CLIENT_ID: z
    .string({
      required_error: 'INTUIT_CLIENT_ID is required for QuickBooks integration',
    })
    .min(1),
  INTUIT_CLIENT_SECRET: z
    .string({
      required_error:
        'INTUIT_CLIENT_SECRET is required for QuickBooks integration',
    })
    .min(1),
  INTUIT_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  INTUIT_REDIRECT_URI: z
    .string({
      required_error:
        'INTUIT_REDIRECT_URI is required (must match the URI registered in the Intuit Developer Portal)',
    })
    .url(),
});

let cached: ReturnType<typeof envSchema.parse> | null = null;

function getQuickbooksEnv() {
  if (!cached) {
    cached = envSchema.parse({
      INTUIT_CLIENT_ID: process.env.INTUIT_CLIENT_ID,
      INTUIT_CLIENT_SECRET: process.env.INTUIT_CLIENT_SECRET,
      INTUIT_ENV: process.env.INTUIT_ENV,
      INTUIT_REDIRECT_URI: process.env.INTUIT_REDIRECT_URI,
    });
  }
  return cached;
}

export function getQuickbooksConfig() {
  const env = getQuickbooksEnv();

  return {
    clientId: env.INTUIT_CLIENT_ID,
    clientSecret: env.INTUIT_CLIENT_SECRET,
    redirectUri: env.INTUIT_REDIRECT_URI,
    env: env.INTUIT_ENV,

    // OAuth endpoints — same for sandbox and production.
    authorizeUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    revokeUrl: 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',

    // Accounting API base URL — differs by environment.
    apiBaseUrl:
      env.INTUIT_ENV === 'production'
        ? 'https://quickbooks.api.intuit.com'
        : 'https://sandbox-quickbooks.api.intuit.com',

    // Default scope. Add openid+profile+email if OpenID claims are needed.
    scope: 'com.intuit.quickbooks.accounting',
  } as const;
}

export function getQuickbooksBasicAuthHeader() {
  const { clientId, clientSecret } = getQuickbooksConfig();
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${encoded}`;
}
