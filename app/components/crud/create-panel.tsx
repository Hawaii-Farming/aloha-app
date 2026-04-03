import { useCallback, useEffect } from 'react';

import { useFetcher, useRevalidator } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Path } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { ZodObject, ZodRawShape } from 'zod';
import { z } from 'zod';

import { Button } from '@aloha/ui/button';
import { Form } from '@aloha/ui/form';
import { If } from '@aloha/ui/if';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@aloha/ui/sheet';
import { toast } from '@aloha/ui/sonner';
import { Trans } from '@aloha/ui/trans';

import { AiFormAssist } from '~/components/ai/ai-form-assist';
import { renderFormField } from '~/lib/crud/render-form-field';
import type { CrudModuleConfig } from '~/lib/crud/types';
import { buildDefaultValues } from '~/lib/crud/workflow-helpers';

const fallbackSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const fallbackFormFields = [
  { key: 'name', label: 'Name', type: 'text' as const, required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
];

interface CreatePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CrudModuleConfig | undefined;
  fkOptions: Record<string, Array<{ value: string; label: string }>>;
  subModuleDisplayName: string;
}

export function CreatePanel({
  open,
  onOpenChange,
  config,
  fkOptions,
  subModuleDisplayName,
}: CreatePanelProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  const formFields = config?.formFields ?? fallbackFormFields;
  const pkColumn = config?.pkColumn ?? 'id';
  const schema = (config?.schema ?? fallbackSchema) as ZodObject<ZodRawShape>;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(formFields, null),
  });

  const fetcherData = fetcher.data as
    | { success: false; error?: string; errors?: unknown }
    | undefined;

  const isSubmitting = fetcher.state !== 'idle';

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcherData !== undefined) {
      if (fetcherData && !fetcherData.success) {
        toast.error(fetcherData.error ?? 'Validation failed');
      } else if (!fetcherData) {
        // redirect response — action returned redirect, which means success
        onOpenChange(false);
        form.reset(buildDefaultValues(formFields, null));
        revalidator.revalidate();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcherData]);

  // Handle success when action returns non-error data
  useEffect(() => {
    if (
      fetcher.state === 'idle' &&
      fetcher.data !== undefined &&
      typeof fetcher.data === 'object' &&
      'success' in fetcher.data &&
      (fetcher.data as { success: boolean }).success === true
    ) {
      onOpenChange(false);
      form.reset(buildDefaultValues(formFields, null));
      revalidator.revalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  const onSubmit = useCallback(
    (data: Record<string, unknown>) => {
      fetcher.submit(data as unknown as Record<string, string>, {
        method: 'POST',
        action: 'create',
        encType: 'application/json',
      });
    },
    [fetcher],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        form.reset(buildDefaultValues(formFields, null));
      }
      onOpenChange(nextOpen);
    },
    [form, formFields, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-3/4 flex-col sm:max-w-lg"
        data-test="create-panel"
      >
        <SheetHeader>
          <SheetTitle>Create {subModuleDisplayName}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              data-test="create-panel-form"
            >
              <AiFormAssist
                schema={schema}
                setValue={form.setValue}
                fieldNames={formFields.map(
                  (f) => f.key as Path<Record<string, unknown>>,
                )}
              />

              {formFields.map((field) =>
                renderFormField({
                  field,
                  control: form.control,
                  mode: 'create',
                  pkColumn,
                  fkOptions,
                }),
              )}
            </form>
          </Form>
        </div>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
            >
              <If condition={isSubmitting}>
                <Trans i18nKey="common:loading" />
              </If>
              <If condition={!isSubmitting}>
                <Trans i18nKey="common:create" />
              </If>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              <Trans i18nKey="common:cancel" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
