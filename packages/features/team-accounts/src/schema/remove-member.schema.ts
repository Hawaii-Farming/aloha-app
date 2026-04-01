import { z } from 'zod';

import { CsrfTokenSchema } from '@aloha/csrf/schema';

export const RemoveMemberSchema = z.object({
  payload: CsrfTokenSchema.extend({
    accountId: z.string().uuid(),
    userId: z.string().uuid(),
  }),
  intent: z.literal('remove-member'),
});
