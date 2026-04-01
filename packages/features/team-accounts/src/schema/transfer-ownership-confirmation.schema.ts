import { z } from 'zod';

import { CsrfTokenSchema } from '@aloha/csrf/schema';

export const TransferOwnershipConfirmationSchema = CsrfTokenSchema.extend({
  userId: z.string().uuid(),
  otp: z.string().min(6),
  accountId: z.string().uuid(),
});

export const TransferOwnershipSchema = z.object({
  intent: z.literal('transfer-ownership'),
  payload: TransferOwnershipConfirmationSchema,
});
