import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { getLogger } from '@aloha/shared/logger';
import { Database } from '@aloha/supabase/database';

import type {
  RemoveMemberSchema,
  TransferOwnershipSchema,
  UpdateMemberRoleSchema,
} from '../../schema';

type UntypedClient = SupabaseClient;

export function createAccountMembersService(client: SupabaseClient<Database>) {
  return new AccountMembersService(client);
}

class AccountMembersService {
  private readonly namespace = 'account-members';

  constructor(private readonly client: SupabaseClient<Database>) {}

  async removeMemberFromAccount({
    payload,
  }: z.infer<typeof RemoveMemberSchema>) {
    const logger = await getLogger();

    const ctx = {
      namespace: this.namespace,
      ...payload,
    };

    logger.info(ctx, `Removing member from org...`);

    const untypedClient = this.client as unknown as UntypedClient;

    // Soft-delete the employee record and unlink user_id
    const { error } = await untypedClient
      .from('hr_employee')
      .update({
        is_deleted: true,
        user_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', payload.accountId)
      .eq('user_id', payload.userId);

    if (error) {
      logger.error(
        {
          ...ctx,
          error,
        },
        `Failed to remove member from org`,
      );

      return {
        success: false,
      };
    }

    logger.info(ctx, `Successfully removed member from org.`);

    return {
      success: true,
    };
  }

  async updateMemberRole(
    { payload }: z.infer<typeof UpdateMemberRoleSchema>,
    adminClient: SupabaseClient<Database>,
  ) {
    const logger = await getLogger();

    const ctx = {
      namespace: this.namespace,
      ...payload,
    };

    logger.info(ctx, `Updating member access level...`);

    const untypedAdminClient = adminClient as unknown as UntypedClient;

    const { error } = await untypedAdminClient
      .from('hr_employee')
      .update({
        sys_access_level_id: payload.role,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', payload.accountId)
      .eq('user_id', payload.userId)
      .eq('is_deleted', false);

    if (error) {
      logger.error(
        {
          ...ctx,
          error,
        },
        `Failed to update member access level`,
      );

      return {
        success: false,
      };
    }

    logger.info(ctx, `Successfully updated member access level`);

    return {
      success: true,
    };
  }

  async transferOwnership(
    { payload }: z.infer<typeof TransferOwnershipSchema>,
    adminClient: SupabaseClient<Database>,
  ) {
    const logger = await getLogger();

    const ctx = {
      namespace: this.namespace,
      ...payload,
    };

    logger.info(ctx, `Transferring ownership of org...`);

    const untypedAdminClient = adminClient as unknown as UntypedClient;

    // Set the new owner to 'owner' access level
    const { error: newOwnerError } = await untypedAdminClient
      .from('hr_employee')
      .update({
        sys_access_level_id: 'owner',
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', payload.accountId)
      .eq('user_id', payload.userId)
      .eq('is_deleted', false);

    if (newOwnerError) {
      logger.error(
        { ...ctx, error: newOwnerError },
        `Failed to set new owner`,
      );

      return {
        success: false,
      };
    }

    // Demote the current owner to 'admin'
    const { data: currentUser } = await this.client.auth.getUser();

    if (currentUser?.user) {
      await untypedAdminClient
        .from('hr_employee')
        .update({
          sys_access_level_id: 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', payload.accountId)
        .eq('user_id', currentUser.user.id)
        .eq('is_deleted', false);
    }

    logger.info(ctx, `Successfully transferred ownership of org`);

    return {
      success: true,
    };
  }
}
