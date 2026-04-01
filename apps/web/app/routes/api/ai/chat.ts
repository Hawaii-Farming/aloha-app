import { anthropic } from '@ai-sdk/anthropic';
import { type UIMessage, convertToModelMessages, streamText } from 'ai';

import type { AiPageContext } from '~/lib/ai/ai-context';
import { buildSystemPrompt } from '~/lib/ai/build-system-prompt.server';

interface ChatRequest {
  messages: UIMessage[];
  context?: AiPageContext;
}

export async function action({ request }: { request: Request }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          'AI assistant is not configured. Set ANTHROPIC_API_KEY to enable.',
      },
      { status: 501 },
    );
  }

  const body: ChatRequest = await request.json();
  const { messages, context } = body;

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: buildSystemPrompt(context),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
