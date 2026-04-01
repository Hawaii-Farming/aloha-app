import { RecordChange, Tables } from '../record-change.type';

export function createDatabaseWebhookRouterService() {
  return new DatabaseWebhookRouterService();
}

/**
 * @name DatabaseWebhookRouterService
 * @description Service that routes the webhook event to the appropriate service
 */
class DatabaseWebhookRouterService {
  /**
   * @name handleWebhook
   * @description Handle the webhook event
   * @param body
   */
  async handleWebhook(body: RecordChange<keyof Tables>) {
    switch (body.table) {
      default: {
        return;
      }
    }
  }
}
