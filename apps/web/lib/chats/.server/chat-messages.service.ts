import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { getLogger } from '@aloha/shared/logger';

import { Database } from '~/lib/database.types';

import { ChatSettingsSchema } from '../schema/chat-settings.schema';

export function createChatMessagesService(client: SupabaseClient<Database>) {
  return new ChatMessagesService(client);
}

class ChatMessagesService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getMessages(params: { chatReferenceId: string; page: number }) {
    const perPage = 35;
    const startOffset = params.page * perPage;
    const endOffset = startOffset + perPage;

    const { data, error } = await this.client
      .from('chat_messages')
      .select(
        `
        id,
        role,
        content,
        createdAt: created_at,
        chat: chat_id !inner (reference_id)
      `,
      )
      .eq('chat.reference_id', params.chatReferenceId)
      .range(startOffset, endOffset);

    if (error) {
      throw error;
    }

    return data;
  }

  async createChat(params: {
    accountId: string;
    chatReferenceId: string;
    name: string;

    messages: Array<{
      content: string;
      role: 'user' | 'assistant';
    }>;
  }) {
    const logger = await getLogger();

    logger.info(params, `Creating chat...`);

    const { error, data } = await this.client
      .from('chats')
      .insert({
        reference_id: params.chatReferenceId,
        account_id: params.accountId,
        name: params.name,
      })
      .select('reference_id')
      .single();

    if (error) {
      logger.error(error, `Error creating chat`);

      throw error;
    }

    logger.info(`Successfully created chat`);

    return data.reference_id;
  }

  async insertMessage(params: {
    accountId: string;
    chatId: number;

    messages: Array<{
      content: string;
      role: 'user' | 'assistant';
    }>;
  }) {
    const logger = await getLogger();

    logger.info(params, `Inserting messages into chat...`);

    const { data, error } = await this.client.from('chat_messages').insert(
      params.messages.map((message) => ({
        chat_id: params.chatId,
        account_id: params.accountId,
        content: message.content,
        role: message.role,
      })),
    );

    if (error) {
      logger.error(error, `Error inserting messages into chat`);

      throw error;
    }

    logger.info(data, `Successfully inserted messages into chat`);

    return data;
  }

  async getRemainingCredits(params: { accountId: string }) {
    const { data, error } = await this.client
      .from('credits_usage')
      .select('remaining_credits')
      .eq('account_id', params.accountId)
      .single();

    if (error) {
      throw error;
    }

    return data.remaining_credits;
  }

  async getChatIdByReferenceId(referenceId: string) {
    const { data, error } = await this.client
      .from('chats')
      .select('id')
      .eq('reference_id', referenceId)
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  async getChats(slug: string) {
    const { data: chats, error } = await this.client
      .from('chats')
      .select('*, account: account_id !inner (slug)')
      .eq('account.slug', slug)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return chats;
  }

  async getChatSettings(chatReferenceId: string) {
    const { data, error } = await this.client
      .from('chats')
      .select('settings')
      .eq('reference_id', chatReferenceId)
      .single();

    if (error) {
      throw error;
    }

    const settings = (data.settings ?? {}) as Partial<
      z.infer<typeof ChatSettingsSchema>
    >;

    return {
      maxTokens: settings.maxTokens ?? 500,
      systemMessage: settings.systemMessage ?? `You are a helpful assistant`,
      model: settings.model ?? 'gpt-3.5-turbo',
      temperature: settings.temperature ?? 0.7,
    };
  }

  async updateChat(
    params: {
      chatReferenceId: string;
    } & Database['public']['Tables']['chats']['Update'],
  ) {
    const logger = await getLogger();
    const { chatReferenceId, ...updateParams } = params;

    logger.info(params, `Updating chat...`);

    const { data, error } = await this.client
      .from('chats')
      .update(updateParams)
      .eq('reference_id', chatReferenceId);

    if (error) {
      logger.error(error, `Error updating chat`);

      throw error;
    }

    logger.info(data, `Successfully updated chat`);
  }

  async deleteChat(params: { chatReferenceId: string }) {
    const logger = await getLogger();

    logger.info(params, `Deleting chat...`);

    const { error } = await this.client
      .from('chats')
      .delete()
      .eq('reference_id', params.chatReferenceId);

    if (error) {
      logger.error(error, `Error deleting chat`);

      throw error;
    }

    logger.info(params, `Successfully deleted chat`);
  }
}
