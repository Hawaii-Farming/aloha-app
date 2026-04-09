import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from './use-supabase';

export function useSignOut() {
  const client = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Sign out on client first to clear browser tokens
      await client.auth.signOut();
      await queryClient.invalidateQueries();

      // POST to server action to clear server-side auth cookies
      // and redirect to sign-in page
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/auth/sign-out';
      document.body.appendChild(form);
      form.submit();
    },
  });
}
