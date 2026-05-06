/**
 * Auth gate for EDI admin routes.
 *
 * Resolves the signed-in user, finds the hr_employee row that grants
 * Owner or Admin in their org, and returns (userId, orgId). Throws a
 * 403 Response if the user is signed in but doesn't carry Owner/Admin
 * anywhere; throws a redirect (via requireUserLoader) if not signed in.
 *
 * EDI inbound + replay actions all run with org-level authority because
 * they touch sales_po and sales_po_line; only operators with broad
 * editing power should drive them. If we ever need a narrower role
 * (e.g. dedicated "EDI" sub-module access) we widen the IN clause here.
 */
import { requireUserLoader } from '~/lib/require-user-loader';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';

export type EdiAdminContext = {
  userId: string;
  orgId: string;
  employeeId: string;
};

const ADMIN_LEVELS = ['Owner', 'Admin'];

export async function requireEdiAdmin(
  request: Request,
): Promise<EdiAdminContext> {
  const user = await requireUserLoader(request);

  const supabase = getSupabaseServerClient(request);
  const { data, error } = await supabase
    .from('hr_employee')
    .select('id, org_id, sys_access_level_id')
    .eq('user_id', user.sub)
    .eq('is_deleted', false)
    .in('sys_access_level_id', ADMIN_LEVELS)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Response(
      'Forbidden -- EDI actions require Owner or Admin access in at least one org.',
      { status: 403 },
    );
  }

  return {
    userId: user.sub as string,
    orgId: data.org_id,
    employeeId: data.id,
  };
}
