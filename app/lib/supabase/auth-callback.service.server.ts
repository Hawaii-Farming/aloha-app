import {
  AuthError,
  type EmailOtpType,
  SupabaseClient,
} from '@supabase/supabase-js';

/**
 * @name isSafeRedirectPath
 * @description Checks if a path is safe for redirects (prevents open redirect attacks).
 */
function isSafeRedirectPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (path.includes('://')) return false;
  if (path.includes('\\')) return false;
  return true;
}

/**
 * @name getSafeRedirectPath
 * @description Returns the path if safe, otherwise returns the fallback.
 */
function getSafeRedirectPath(
  path: string | null | undefined,
  fallback: string,
): string {
  if (path && isSafeRedirectPath(path)) {
    return path;
  }
  return fallback;
}

/**
 * @name createAuthCallbackService
 * @description Creates an instance of the AuthCallbackService
 */
export function createAuthCallbackService(client: SupabaseClient) {
  return new AuthCallbackService(client);
}

/**
 * @name AuthCallbackService
 * @description Service for handling auth callbacks in Supabase
 */
class AuthCallbackService {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * @name verifyTokenHash
   * @description Verifies the token hash and type and redirects the user to the next page
   */
  async verifyTokenHash(
    request: Request,
    params: {
      redirectPath: string;
      errorPath?: string;
    },
  ): Promise<URL> {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;

    const callbackParam =
      searchParams.get('next') ?? searchParams.get('callback');

    let next = params.redirectPath;
    let nextPath: string | null = null;
    let callbackUrl: URL | null = null;

    if (callbackParam) {
      try {
        // Parse as URL (use dummy base for relative paths)
        callbackUrl = new URL(callbackParam, 'http://localhost');
        const pathname = callbackUrl.pathname;

        // Validate pathname is safe
        next = getSafeRedirectPath(pathname, params.redirectPath);

        // Check for nested next param
        const callbackNextPath = callbackUrl.searchParams.get('next');

        if (callbackNextPath) {
          // Validate nested next path, fall back to pathname if invalid
          const safePath = getSafeRedirectPath(callbackNextPath, pathname);
          nextPath = safePath;
        } else {
          // Use validated pathname
          nextPath = next;
        }
      } catch {
        // Invalid URL format, use default
        next = params.redirectPath;
      }
    }

    const errorPath = params.errorPath ?? '/auth/callback/error';

    // remove the query params from the url
    searchParams.delete('token_hash');
    searchParams.delete('next');
    searchParams.delete('callback');

    if (nextPath) {
      searchParams.set('next', nextPath);
    }

    url.pathname = next;

    if (token_hash && type) {
      const { error } = await this.client.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return url;
      }

      if (error.code) {
        url.searchParams.set('code', error.code);
      }

      const errorMessage = getAuthErrorMessage({
        error: error.message,
        code: error.code,
      });

      url.searchParams.set('error', errorMessage);
    }

    // return the user to an error page with some instructions
    url.pathname = errorPath;

    return url;
  }

  /**
   * @name exchangeCodeForSession
   * @description Exchanges the auth code for a session and redirects the user to the next page or an error page
   */
  async exchangeCodeForSession(
    request: Request,
    params: {
      redirectPath: string;
      errorPath?: string;
    },
  ): Promise<{
    nextPath: string;
  }> {
    const requestUrl = new URL(request.url);
    const searchParams = requestUrl.searchParams;

    const authCode = searchParams.get('code');
    const error = searchParams.get('error');
    const nextUrlPathFromParams = searchParams.get('next');
    const errorPath = params.errorPath ?? '/auth/callback/error';

    const nextUrl = getSafeRedirectPath(
      nextUrlPathFromParams,
      params.redirectPath,
    );

    if (authCode) {
      try {
        const { error } =
          await this.client.auth.exchangeCodeForSession(authCode);

        // if we have an error, we redirect to the error page
        if (error) {
          return onError({
            code: error.code,
            error: error.message,
            path: errorPath,
          });
        }
      } catch (error) {
        console.error(
          {
            error,
            name: `auth.callback`,
          },
          `An error occurred while exchanging code for session`,
        );

        const message = error instanceof Error ? error.message : error;

        return onError({
          code: (error as AuthError)?.code,
          error: message as string,
          path: errorPath,
        });
      }
    }

    if (error) {
      return onError({
        error,
        path: errorPath,
      });
    }

    return {
      nextPath: nextUrl,
    };
  }
}

function onError({
  error,
  path,
  code,
}: {
  error: string;
  path: string;
  code?: string;
}) {
  const errorMessage = getAuthErrorMessage({ error, code });

  console.error(
    {
      error: JSON.stringify(error),
      name: `auth.callback`,
    },
    `An error occurred while signing user in`,
  );

  const searchParams = new URLSearchParams({
    error: errorMessage,
    code: code ?? '',
  });

  const nextPath = `${path}?${searchParams.toString()}`;

  return {
    nextPath,
  };
}

/**
 * Checks if the given error message indicates a verifier error.
 */
function isVerifierError(error: string) {
  return error.includes('both auth code and code verifier should be non-empty');
}

function getAuthErrorMessage(params: { error: string; code?: string }) {
  if (params.code) {
    if (params.code === 'otp_expired') {
      return 'auth:errors.otp_expired';
    }
  }

  if (isVerifierError(params.error)) {
    return 'auth:errors.codeVerifierMismatch';
  }

  return `auth:authenticationErrorAlertBody`;
}
