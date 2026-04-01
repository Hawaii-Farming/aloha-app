import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@aloha/supabase/database';

type UntypedClient = SupabaseClient;

export function createTeamAccountsApi(client: SupabaseClient<Database>) {
  return new TeamAccountsApi(client);
}

class TeamAccountsApi {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getTeamAccount(slug: string) {
    const untypedClient = this.client as unknown as UntypedClient;

    const { data, error } = await untypedClient
      .from('org')
      .select('*')
      .eq('id', slug)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async getTeamAccountById(accountId: string) {
    const untypedClient = this.client as unknown as UntypedClient;

    const { data, error } = await untypedClient
      .from('org')
      .select('*')
      .eq('id', accountId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async getAccountWorkspace(slug: string) {
    const untypedClient = this.client as unknown as UntypedClient;

    const orgPromise = untypedClient
      .from('app_org_context')
      .select('org_id, org_name, employee_id, access_level_id')
      .eq('org_id', slug)
      .single();

    const orgsPromise = untypedClient
      .from('app_user_orgs')
      .select('org_id, org_name');

    const [orgResult, orgsResult, { data: claimsResult }] = await Promise.all([
      orgPromise,
      orgsPromise,
      this.client.auth.getClaims(),
    ]);

    if (orgResult.error) {
      return {
        error: orgResult.error,
        data: null,
      };
    }

    if (orgsResult.error) {
      return {
        error: orgsResult.error,
        data: null,
      };
    }

    if (!claimsResult || !claimsResult.claims) {
      return {
        error: new Error('User is not logged in'),
        data: null,
      };
    }

    const orgData = orgResult.data as Record<string, unknown>;

    if (!orgData) {
      return {
        error: new Error('Org data not found'),
        data: null,
      };
    }

    const user = claimsResult.claims;
    user.id = user.sub;

    return {
      data: {
        account: orgData,
        accounts: orgsResult.data,
        user,
      },
      error: null,
    };
  }

  async hasPermission(params: {
    accountId: string;
    userId: string;
    permission: string;
  }) {
    const untypedClient = this.client as unknown as UntypedClient;

    // Map permission names to hr_module_access columns
    const permissionColumn =
      params.permission === 'roles.manager'
        ? 'can_edit'
        : params.permission === 'delete'
          ? 'can_delete'
          : params.permission === 'verify'
            ? 'can_verify'
            : 'is_enabled';

    const { data, error } = await untypedClient
      .from('hr_employee')
      .select('sys_access_level_id')
      .eq('org_id', params.accountId)
      .eq('user_id', params.userId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      throw error;
    }

    // Admins and owners have all permissions
    const adminRoles = ['admin', 'owner'];
    return adminRoles.includes(
      (data as { sys_access_level_id: string }).sys_access_level_id,
    );
  }

  async getMembersCount(accountId: string) {
    const untypedClient = this.client as unknown as UntypedClient;

    const { count, error } = await untypedClient
      .from('hr_employee')
      .select('*', {
        head: true,
        count: 'exact',
      })
      .eq('org_id', accountId)
      .eq('is_deleted', false);

    if (error) {
      throw error;
    }

    return count;
  }

}
