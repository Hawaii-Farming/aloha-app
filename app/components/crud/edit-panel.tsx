import { useCallback, useEffect, useRef } from 'react';

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

import { FormFieldGrid } from '~/components/crud/form-field-grid';
import type { CrudModuleConfig, FormFieldConfig } from '~/lib/crud/types';
import { buildDefaultValues } from '~/lib/crud/workflow-helpers';

const fallbackSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const fallbackFormFields: FormFieldConfig[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
];

interface EditPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CrudModuleConfig | undefined;
  record: Record<string, unknown> | null;
  fkOptions: Record<string, Array<{ value: string; label: string }>>;
  comboboxOptions?: Record<string, string[]>;
  subModuleDisplayName: string;
}

export function EditPanel({
  open,
  onOpenChange,
  config,
  record,
  fkOptions,
  comboboxOptions,
  subModuleDisplayName,
}: EditPanelProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const hasHandledSuccess = useRef(false);

  const formFields = config?.formFields ?? fallbackFormFields;
  const pkColumn = config?.pkColumn ?? 'id';
  const schema = (config?.schema ?? fallbackSchema) as ZodObject<ZodRawShape>;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(formFields, record),
  });

  const fetcherData = fetcher.data as
    | { success: boolean; error?: string; errors?: unknown }
    | undefined;

  const isSubmitting = fetcher.state !== 'idle';

  // Handle fetcher response — refs must be read in useEffect, not render
  useEffect(() => {
    if (fetcher.state !== 'idle' || hasHandledSuccess.current) return;

    if (fetcherData !== undefined && !fetcherData.success) {
      toast.error(fetcherData.error ?? 'Validation failed');
      hasHandledSuccess.current = true;
    } else if (fetcherData !== undefined && fetcherData.success) {
      hasHandledSuccess.current = true;
      onOpenChange(false);
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcherData, onOpenChange, revalidator]);

  // Reset tracking ref when panel reopens
  useEffect(() => {
    if (open && fetcher.state === 'idle') {
      hasHandledSuccess.current = false;
    }
  }, [open, fetcher.state]);

  const onSubmit = useCallback(
    (data: Record<string, unknown>) => {
      hasHandledSuccess.current = false;
      fetcher.submit(JSON.stringify({ intent: 'update', data }), {
        method: 'POST',
        encType: 'application/json',
      });
    },
    [fetcher],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        form.reset(buildDefaultValues(formFields, record));
      }

      onOpenChange(nextOpen);
    },
    [form, formFields, record, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-[90%] flex-col gap-0 p-0 sm:max-w-2xl"
        data-test="edit-panel"
      >
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle>
            <Trans i18nKey="common:edit" /> {subModuleDisplayName}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
            data-test="edit-panel-form"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FormFieldGrid
                fields={formFields}
                control={form.control}
                mode="edit"
                pkColumn={pkColumn}
                fkOptions={fkOptions}
                comboboxOptions={comboboxOptions}
              />
            </div>

            <div className="flex shrink-0 items-center border-t px-6 py-4">
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  variant="brand"
                  disabled={isSubmitting}
                  data-test="edit-panel-submit"
                >
                  <If condition={isSubmitting}>
                    <Trans i18nKey="common:loading" />
                  </If>
                  <If condition={!isSubmitting}>
                    <Trans i18nKey="common:save" />
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
