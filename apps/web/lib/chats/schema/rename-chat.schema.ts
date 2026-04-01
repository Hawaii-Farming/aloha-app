import { z } from 'zod';

export const RenameChatSchema = z.object({
  name: z.string().min(1).max(2000),
});
