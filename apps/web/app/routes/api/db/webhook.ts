import { getDatabaseWebhookHandlerService } from '@aloha/database-webhooks';

import type { Route } from '~/types/app/routes/api/db/+types/webhook';

/**
 * @description POST handler for the webhook route that handles the webhook event
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const service = getDatabaseWebhookHandlerService();

  try {
    // handle the webhook event
    await service.handleWebhook(request);

    // return a successful response
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(error);

    // return an error response
    return new Response(null, { status: 500 });
  }
};
