'use client';

import { useCallback } from 'react';

import { useAppEvents } from '@aloha/shared/events';
import { useAuthChangeListener } from '@aloha/supabase/hooks/use-auth-change-listener';

export function AuthProvider(props: React.PropsWithChildren) {
  const dispatchEvent = useDispatchAppEventFromAuthEvent();

  useAuthChangeListener({
    onEvent: (event, session) => {
      dispatchEvent(event, session?.user.id, {
        email: session?.user.email ?? '',
      });
    },
  });

  return props.children;
}

function useDispatchAppEventFromAuthEvent() {
  const { emit } = useAppEvents();

  return useCallback(
    (
      type: string,
      userId: string | undefined,
      traits: Record<string, string> = {},
    ) => {
      switch (type) {
        case 'SIGNED_IN':
          if (userId) {
            emit({
              type: 'user.signedIn',
              payload: { userId, ...traits },
            });
          }

          break;

        case 'USER_UPDATED':
          emit({
            type: 'user.updated',
            payload: { userId: userId!, ...traits },
          });

          break;
      }
    },
    [emit],
  );
}
