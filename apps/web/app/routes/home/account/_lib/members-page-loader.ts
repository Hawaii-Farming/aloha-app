import { SupabaseClient } from '@supabase/supabase-js';

import { requireUser } from '@aloha/supabase/require-user';

import { Database } from '~/lib/database.types';

type UntypedClient = SupabaseClient;

export async function loadMembersPageData(
  client: SupabaseClient<Database>,
  slug: string,
) {
  return Promise.all([
    loadAccountMembers(client, slug),
    requireUser(client),
    canAddMember(),
  ]);
}

async function canAddMember() {
  return Promise.resolve(true);
}

async function loadAccountMembers(
  client: SupabaseClient<Database>,
  orgId: string,
) {
  const untypedClient = client as unknown as UntypedClient;

  const { data, error } = await untypedClient
    .from('hr_employee')
    .select(
      `
      id,
      org_id,
      first_name,
      last_name,
      email,
      user_id,
      sys_access_level_id,
      profile_photo_url,
      created_at,
      updated_at
    `,
    )
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .not('user_id', 'is', null)
    .order('created_at');

  if (error) {
    console.error(error);
    throw error;
  }

  // Map to the shape expected by AccountMembersTable
  const members = (data ?? []).map(
    (emp: Record<string, unknown>) => ({
      user_id: emp.user_id as string,
      account_id: emp.org_id as string,
      name: `${emp.first_name} ${emp.last_name}`,
      email: (emp.email as string) ?? '',
      picture_url: (emp.profile_photo_url as string) ?? '',
      role: emp.sys_access_level_id as string,
      role_hierarchy_level: getRoleLevel(emp.sys_access_level_id as string),
      primary_owner_user_id: '',
      created_at: emp.created_at as string,
      updated_at: emp.updated_at as string,
    }),
  );

  // Find the owner to set primary_owner_user_id
  const owner = members.find((m) => m.role === 'owner');
  const ownerUserId = owner?.user_id ?? '';

  for (const member of members) {
    member.primary_owner_user_id = ownerUserId;
  }

  return members;
}

function getRoleLevel(accessLevelId: string): number {
  const levels: Record<string, number> = {
    owner: 1,
    admin: 2,
    manager: 3,
    team_lead: 4,
    employee: 5,
  };
  return levels[accessLevelId] ?? 5;
}
