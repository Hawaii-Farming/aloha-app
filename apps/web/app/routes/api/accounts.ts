import { z } from 'zod';

import { CsrfTokenSchema } from '@aloha/csrf/schema';
import { verifyCsrfToken } from '@aloha/csrf/server';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';

import type { Route } from '~/types/app/routes/api/+types/accounts';

const Schema = z.object({
  payload: CsrfTokenSchema.extend({
    name: z.string(),
  }),
  intent: z.literal('create-account'),
});

export async function action({ request }: Route.ActionArgs) {
  const body = Schema.parse(await request.json());
  const client = getSupabaseServerClient(request);

  await verifyCsrfToken(request, body.payload.csrfToken);

  switch (body.intent) {
    case 'create-account': {
      const { createTeamAccountAction } =
        await import('@aloha/team-accounts/actions');

      return createTeamAccountAction({
        client,
        data: body.payload,
      });
    }
  }
}
