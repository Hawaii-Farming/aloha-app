import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

interface FormAssistRequest {
  prompt: string;
  fieldDescriptions: Array<{ name: string; description: string }>;
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

  const body: FormAssistRequest = await request.json();
  const { prompt, fieldDescriptions } = body;

  const result = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: z.object({
      fields: z.record(z.unknown()),
    }),
    prompt: `Extract form field values from the following text.\n\nText: ${prompt}\n\nFields to extract: ${JSON.stringify(fieldDescriptions)}\n\nReturn a JSON object with a "fields" key containing extracted values. Use the field names as keys. Only include fields you can confidently extract from the text.`,
  });

  return Response.json(result.object);
}
