import { useCallback, useRef } from 'react';

import { useFetcher, useRevalidator } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { ZodObject, ZodRawShape } from 'zod';
import { z } from 'zod';

import { Button } from '@aloha/ui/button';
import { Form } from '@aloha/ui/form';
import { If } from '@aloha/ui/if';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@aloha/ui/sheet';
import { toast } from '@aloha/ui/sonner';
import { Trans } from '@aloha/ui/trans';

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
  const hasHandledSuccess = useRef(false);

  const formFields = config?.formFields ?? fallbackFormFields;
  const pkColumn = config?.pkColumn ?? 'id';
  const schema = (config?.schema ?? fallbackSchema) as ZodObject<ZodRawShape>;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(formFields, null),
  });

  const fetcherData = fetcher.data as
    | { success: boolean; error?: string; errors?: unknown }
    | undefined;

  const isSubmitting = fetcher.state !== 'idle';

  // Handle fetcher response inline (no useEffect)
  // The create action returns redirect() on success, which useFetcher swallows
  // (fetcherData stays undefined). On error, it returns { success: false, error }.
  if (fetcher.state === 'idle' && !hasHandledSuccess.current) {
    if (fetcherData !== undefined && !fetcherData.success) {
      toast.error(fetcherData.error ?? 'Validation failed');
      hasHandledSuccess.current = true;
    } else if (
      fetcher.data === undefined &&
      fetcher.state === 'idle' &&
      form.formState.submitCount > 0 &&
      form.formState.isSubmitSuccessful
    ) {
      // Redirect was swallowed — treat as success
      hasHandledSuccess.current = true;
      onOpenChange(false);
      form.reset(buildDefaultValues(formFields, null));
      revalidator.revalidate();
    }
  }

  // Reset tracking ref when panel reopens
  if (open && hasHandledSuccess.current && fetcher.state === 'idle') {
    hasHandledSuccess.current = false;
  }

  const onSubmit = useCallback(
    (data: Record<string, unknown>) => {
      hasHandledSuccess.current = false;
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
        className="flex h-full w-3/4 flex-col gap-0 p-0 sm:max-w-lg"
        data-test="create-panel"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>
            <Trans i18nKey="common:create" /> {subModuleDisplayName}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-hidden"
            data-test="create-panel-form"
          >
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {formFields.map((field) =>
                  renderFormField({
                    field,
                    control: form.control,
                    mode: 'create',
                    pkColumn,
                    fkOptions,
                  }),
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center border-t px-6 py-4">
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  variant="brand"
                  disabled={isSubmitting}
                  data-test="create-panel-submit"
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
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
