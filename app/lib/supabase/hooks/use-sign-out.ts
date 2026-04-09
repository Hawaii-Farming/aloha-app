import { useMutation } from '@tanstack/react-query';

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      // POST to server action which signs out server-side
      // (clears auth cookies) and redirects to sign-in.
      // We skip client-side signOut() because the auth change
      // listener would reload the page before the form submits.
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/auth/sign-out';
      document.body.appendChild(form);
      form.submit();
    },
  });
}
