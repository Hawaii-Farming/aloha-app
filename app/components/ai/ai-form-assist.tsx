/**
 * AiFormAssist - AI-powered form filling pattern component.
 *
 * A reusable button that consumers place inside their forms. It accepts
 * a Zod schema and a form's `setValue` function, prompts the user for
 * text, sends it to an API route that uses `generateObject`, and
 * populates the form fields from the structured response.
 *
 * Usage:
 *   <AiFormAssist
 *     schema={MyFormSchema}
 *     setValue={form.setValue}
 *     fieldNames={['name', 'description', 'category']}
 *   />
 *
 * Requires an API route at /api/ai/form-assist (or custom apiEndpoint):
 *   export async function action({ request }: ActionFunctionArgs) {
 *     const { prompt, fieldDescriptions } = await request.json();
 *     const result = await generateObject({
 *       model: anthropic('claude-sonnet-4-20250514'),
 *       schema: z.object({ fields: z.record(z.unknown()) }),
 *       prompt: `Extract form fields from: ${prompt}\nFields: ${JSON.stringify(fieldDescriptions)}`,
 *     });
 *     return Response.json(result.object);
 *   }
 */
import { useState } from 'react';

import { Sparkles } from 'lucide-react';
import type { FieldValues, Path, UseFormSetValue } from 'react-hook-form';
import type { ZodObject, ZodRawShape } from 'zod';

import { Button } from '@aloha/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@aloha/ui/popover';
import { Textarea } from '@aloha/ui/textarea';

interface AiFormAssistProps<T extends FieldValues> {
  schema: ZodObject<ZodRawShape>;
  setValue: UseFormSetValue<T>;
  fieldNames: Path<T>[];
  apiEndpoint?: string;
}

function extractFieldDescriptions(
  schema: ZodObject<ZodRawShape>,
  fieldNames: string[],
) {
  const shape = schema.shape;

  return fieldNames
    .filter((name) => name in shape)
    .map((name) => ({
      name,
      description: shape[name]?.description ?? name,
    }));
}

export function AiFormAssist<T extends FieldValues>(
  props: AiFormAssistProps<T>,
) {
  const {
    schema,
    setValue,
    fieldNames,
    apiEndpoint = '/api/ai/form-assist',
  } = props;

  const [state, setState] = useState<{
    open: boolean;
    loading: boolean;
    error: string | null;
    prompt: string;
  }>({
    open: false,
    loading: false,
    error: null,
    prompt: '',
  });

  const handleGenerate = async () => {
    if (!state.prompt.trim()) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const fieldDescriptions = extractFieldDescriptions(
        schema,
        fieldNames as string[],
      );

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.prompt,
          fieldDescriptions,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        setState((prev) => ({
          ...prev,
          loading: false,
          error: text || `Request failed (${response.status})`,
        }));
        return;
      }

      const data = (await response.json()) as {
        fields: Record<string, unknown>;
      };
      let filledCount = 0;

      for (const fieldName of fieldNames) {
        const value = data.fields[fieldName as string];

        if (value !== undefined && value !== null) {
          setValue(fieldName, value as Parameters<typeof setValue>[1]);
          filledCount++;
        }
      }

      setState({
        open: false,
        loading: false,
        error: null,
        prompt: '',
      });

      if (filledCount > 0) {
        // Toast notification handled by consumer's toast provider
        void filledCount;
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to generate fields',
      }));
    }
  };

  return (
    <Popover
      open={state.open}
      onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Fill with AI
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium">AI Form Assist</p>
          <p className="text-muted-foreground text-xs">
            Paste text or describe what to fill, and AI will extract the
            relevant fields.
          </p>

          <Textarea
            placeholder="Paste text or describe what to fill..."
            value={state.prompt}
            onChange={(e) =>
              setState((prev) => ({ ...prev, prompt: e.target.value }))
            }
            rows={4}
            disabled={state.loading}
          />

          {state.error && (
            <p className="text-destructive text-xs">{state.error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setState((prev) => ({ ...prev, open: false }))}
              disabled={state.loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={state.loading || !state.prompt.trim()}
            >
              {state.loading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
