import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { getLogger } from '@aloha/shared/logger';
import { Database } from '@aloha/supabase/database';

type UntypedClient = SupabaseClient;

const Schema = z.object({
  accountId: z.string(),
  userId: z.string().uuid(),
});

export function createLeaveTeamAccountService(
  client: SupabaseClient<Database>,
) {
  return new LeaveTeamAccountService(client);
}

class LeaveTeamAccountService {
  private readonly namespace = 'leave-team-account';

  constructor(private readonly adminClient: SupabaseClient<Database>) {}

  async leaveTeamAccount(params: z.infer<typeof Schema>) {
    const logger = await getLogger();

    const ctx = {
      ...params,
      name: this.namespace,
    };

    logger.info(ctx, 'Leaving org...');

    const { accountId, userId } = Schema.parse(params);

    const untypedClient = this.adminClient as unknown as UntypedClient;

    // Soft-delete the employee record and unlink user_id
    const { error } = await untypedClient
      .from('hr_employee')
      .update({
        is_deleted: true,
        user_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', accountId)
      .eq('user_id', userId);

    if (error) {
      logger.error({ ...ctx, error }, 'Failed to leave org');

      throw new Error('Failed to leave org');
    }

    logger.info(ctx, 'Successfully left org');
  }
}
