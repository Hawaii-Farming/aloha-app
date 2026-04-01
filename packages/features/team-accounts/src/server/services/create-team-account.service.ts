import { SupabaseClient } from '@supabase/supabase-js';

import { getLogger } from '@aloha/shared/logger';
import { Database } from '@aloha/supabase/database';

type UntypedClient = SupabaseClient;

export function createCreateTeamAccountService(
  client: SupabaseClient<Database>,
) {
  return new CreateTeamAccountService(client);
}

class CreateTeamAccountService {
  private readonly namespace = 'accounts.create-team-account';

  constructor(private readonly client: SupabaseClient<Database>) {}

  async createNewOrganizationAccount(params: { name: string; userId: string }) {
    const logger = await getLogger();
    const ctx = { ...params, namespace: this.namespace };

    logger.info(ctx, `Creating new org...`);

    const untypedClient = this.client as unknown as UntypedClient;

    // Generate a slug from the name
    const slug = params.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    // Create the org
    const { error: orgError } = await untypedClient.from('org').insert({
      id: slug,
      name: params.name,
      currency: 'USD',
    });

    if (orgError) {
      logger.error({ error: orgError, ...ctx }, `Error creating org`);
      throw new Error('Error creating org');
    }

    // Create the owner employee record
    const { error: empError } = await untypedClient
      .from('hr_employee')
      .insert({
        id: `${slug}-owner`,
        org_id: slug,
        first_name: 'Owner',
        last_name: params.name,
        user_id: params.userId,
        sys_access_level_id: 'owner',
      });

    if (empError) {
      logger.error({ error: empError, ...ctx }, `Error creating owner employee`);
      throw new Error('Error creating owner employee');
    }

    // Seed org_modules from sys_module
    const { data: sysModules } = await untypedClient
      .from('sys_module')
      .select('id, name, display_order')
      .eq('is_deleted', false);

    if (sysModules) {
      const orgModules = (sysModules as Array<{ id: string; name: string; display_order: number }>).map(
        (m) => ({
          id: `${slug}-${m.id}`,
          org_id: slug,
          sys_module_id: m.id,
          display_name: m.name,
          display_order: m.display_order,
          is_enabled: true,
        }),
      );

      await untypedClient.from('org_module').insert(orgModules);

      // Grant owner access to all modules
      const moduleAccess = orgModules.map((m) => ({
        org_id: slug,
        hr_employee_id: `${slug}-owner`,
        org_module_id: m.id,
        is_enabled: true,
        can_edit: true,
        can_delete: true,
        can_verify: true,
      }));

      await untypedClient.from('hr_module_access').insert(moduleAccess);
    }

    logger.info(ctx, `Org created successfully`);

    return { data: { slug }, error: null };
  }
}
