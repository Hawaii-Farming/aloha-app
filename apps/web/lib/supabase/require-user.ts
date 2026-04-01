import type { JwtPayload, SupabaseClient } from '@supabase/supabase-js';

const SIGN_IN_PATH = '/auth/sign-in';

/**
 * @name UserClaims
 * @description The user claims returned from the Supabase auth API.
 */
type UserClaims = {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  email: string;
  phone: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  role: string;
  aal: `aal1` | `aal2`;
  session_id: string;
  is_anonymous: boolean;
};

/**
 * @name requireUser
 * @description Require a session to be present in the request
 */
export async function requireUser(
  client: SupabaseClient,
  options?: {
    next?: string;
  },
): Promise<
  | {
      error: null;
      data: JwtPayload;
    }
  | {
      error: AuthenticationError;
      data: null;
      redirectTo: string;
    }
> {
  const { data, error } = await client.auth.getClaims();

  if (!data?.claims || error) {
    return {
      data: null,
      error: new AuthenticationError(),
      redirectTo: getRedirectTo(SIGN_IN_PATH, options?.next),
    };
  }

  // the client doesn't type the claims, so we need to cast it to the User type
  const user = data.claims as UserClaims;

  return {
    error: null,
    data: {
      ...user,
      id: user.sub,
    },
  };
}

class AuthenticationError extends Error {
  constructor() {
    super(`Authentication required`);
  }
}

function getRedirectTo(path: string, next?: string) {
  return path + (next ? `?next=${next}` : '');
}
