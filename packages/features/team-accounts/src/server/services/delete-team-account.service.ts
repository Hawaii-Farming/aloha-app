import { SupabaseClient } from '@supabase/supabase-js';

import { getLogger } from '@aloha/shared/logger';
import { Database } from '@aloha/supabase/database';

type UntypedClient = SupabaseClient;

export function createDeleteTeamAccountService() {
  return new DeleteTeamAccountService();
}

class DeleteTeamAccountService {
  private readonly namespace = 'accounts.delete-team-account';

  async deleteTeamAccount(
    adminClient: SupabaseClient<Database>,
    params: {
      accountId: string;
      userId: string;
    },
  ) {
    const logger = await getLogger();

    const ctx = {
      accountId: params.accountId,
      userId: params.userId,
      name: this.namespace,
    };

    logger.info(ctx, `Requested org deletion. Processing...`);

    const untypedClient = adminClient as unknown as UntypedClient;

    // Soft-delete the org
    const { error } = await untypedClient
      .from('org')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.accountId);

    if (error) {
      logger.error(
        {
          ...ctx,
          error,
        },
        'Failed to delete org',
      );

      throw new Error('Failed to delete org');
    }

    logger.info(ctx, 'Successfully deleted org');
  }
}
