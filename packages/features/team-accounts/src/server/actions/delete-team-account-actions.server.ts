import { redirect, redirectDocument } from 'react-router';

import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '@aloha/supabase/database';
import { requireUser } from '@aloha/supabase/require-user';

import { DeleteTeamAccountSchema } from '../../schema';
import { createDeleteTeamAccountService } from '../services/delete-team-account.service';

type UntypedClient = SupabaseClient;

export const deleteTeamAccountAction = async (params: {
  client: SupabaseClient<Database>;
  data: z.infer<typeof DeleteTeamAccountSchema>;
}) => {
  const { payload } = DeleteTeamAccountSchema.parse(params.data);
  const accountId = payload.accountId;
  const auth = await requireUser(params.client);

  if (!auth.data) {
    return redirect(auth.redirectTo);
  }

  const userId = auth.data.id;

  await deleteTeamAccount(params.client, {
    accountId,
    userId,
  });

  return redirectDocument('/home');
};

async function deleteTeamAccount(
  client: SupabaseClient<Database>,
  params: {
    accountId: string;
    userId: string;
  },
) {
  const service = createDeleteTeamAccountService();

  // Verify that the user is an owner of the org
  await assertUserPermissionsToDeleteTeamAccount(client, params);

  // Delete the org
  await service.deleteTeamAccount(client, params);
}

async function assertUserPermissionsToDeleteTeamAccount(
  client: SupabaseClient<Database>,
  params: {
    accountId: string;
    userId: string;
  },
) {
  const untypedClient = client as unknown as UntypedClient;

  const { data, error } = await untypedClient
    .from('hr_employee')
    .select('id')
    .eq('org_id', params.accountId)
    .eq('user_id', params.userId)
    .eq('sys_access_level_id', 'owner')
    .eq('is_deleted', false)
    .single();

  if (error ?? !data) {
    throw new Error('Only the org owner can delete the organization');
  }
}
