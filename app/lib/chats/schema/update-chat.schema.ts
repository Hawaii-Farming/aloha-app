import { z } from 'zod';

import { ChatSettingsSchema } from './chat-settings.schema';

export const UpdateChatSchema = z.object({
  settings: ChatSettingsSchema,
});
