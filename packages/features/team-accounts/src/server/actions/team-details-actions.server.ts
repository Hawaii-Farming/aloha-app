import { redirect } from 'react-router';

import type { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '@aloha/supabase/database';

import { UpdateTeamNameSchema } from '../../schema';

type UntypedClient = SupabaseClient;

export const updateTeamAccountName = async (params: {
  client: SupabaseClient<Database>;
  data: z.infer<typeof UpdateTeamNameSchema>;
}) => {
  const { payload } = UpdateTeamNameSchema.parse(params.data);
  const { name, slug, path } = payload;

  const untypedClient = params.client as unknown as UntypedClient;

  const { error } = await untypedClient
    .from('org')
    .update({
      name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', slug);

  if (error) {
    return {
      success: false,
    };
  }

  // Org IDs don't change (they're TEXT PKs), so redirect to same path
  const nextPath = path.replace('[account]', slug);

  return redirect(nextPath);
};
