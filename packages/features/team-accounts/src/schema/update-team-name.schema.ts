import { z } from 'zod';

import { CsrfTokenSchema } from '@aloha/csrf/schema';

/**
 * @name RESERVED_NAMES_ARRAY
 * @description Array of reserved names for team accounts
 * This is a list of names that cannot be used for team accounts as they are reserved for other purposes.
 * Please include any new reserved names here.
 */
const RESERVED_NAMES_ARRAY = [
  'settings',
  // please add more reserved names here
];

/**
 * @name TeamNameSchema
 */
const TeamNameSchema = z
  .string({
    description: 'The name of the team account',
  })
  .min(2)
  .max(50)
  .refine(
    (name) => {
      return !RESERVED_NAMES_ARRAY.includes(name.toLowerCase());
    },
    {
      message: 'teams:reservedNameError',
    },
  );

export const TeamNameFormSchema = CsrfTokenSchema.extend({
  name: TeamNameSchema,
});

export const UpdateTeamNameSchema = z.object({
  intent: z.literal('update-team-name'),
  payload: CsrfTokenSchema.extend({
    slug: z.string().min(1).max(255),
    path: z.string().min(1).max(255),
    name: z.string().min(1).max(255),
  }),
});
