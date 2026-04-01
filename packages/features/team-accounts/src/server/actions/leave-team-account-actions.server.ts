import { redirect } from 'react-router';

import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '@aloha/supabase/database';
import { requireUser } from '@aloha/supabase/require-user';
import { getSupabaseServerAdminClient } from '@aloha/supabase/server-admin-client';

import { LeaveTeamAccountSchema } from '../../schema';
import { createLeaveTeamAccountService } from '../services/leave-team-account.service';

export const leaveTeamAccountAction = async (params: {
  data: z.infer<typeof LeaveTeamAccountSchema>;
  client: SupabaseClient<Database>;
}) => {
  const { payload } = LeaveTeamAccountSchema.parse(params.data);

  const auth = await requireUser(params.client);

  if (!auth.data) {
    return redirect(auth.redirectTo);
  }

  const service = createLeaveTeamAccountService(getSupabaseServerAdminClient());

  await service.leaveTeamAccount({
    accountId: payload.accountId,
    userId: auth.data.id,
  });

  return redirect('/home');
};
