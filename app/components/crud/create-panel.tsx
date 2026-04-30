import { useCallback, useEffect, useRef } from 'react';

import { useFetcher, useRevalidator } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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

interface CreatePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CrudModuleConfig | undefined;
  fkOptions: Record<string, Array<{ value: string; label: string }>>;
  comboboxOptions?: Record<string, string[]>;
  subModuleDisplayName: string;
}

export function CreatePanel({
  open,
  onOpenChange,
  config,
  fkOptions,
  comboboxOptions,
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

  // Reactive OT default for HR Register: hr_work_authorization_id drives
  // overtime_threshold (1099/H1/H3/Local → 80, else → 120) while the user
  // has not edited the OT field. useEffect is justified per CLAUDE.md as a
  // cross-field reactive default with no natural event-handler owner — the
  // FkCombobox onChange isn't routed through this component, so a watcher
  // is the cleanest path.
  const workAuthValue = useWatch({
    control: form.control,
    name: 'hr_work_authorization_id',
  });

  useEffect(() => {
    if (config?.tableName !== 'hr_employee') return;
    const otState = form.getFieldState('overtime_threshold', form.formState);
    if (otState.isDirty) return;
    if (!workAuthValue || typeof workAuthValue !== 'string') return;
    const next = ['1099', 'H1', 'H3', 'Local'].includes(workAuthValue)
      ? 80
      : 120;
    form.setValue('overtime_threshold', String(next), { shouldDirty: false });
  }, [workAuthValue, config?.tableName, form]);

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
    } else if (
      fetcher.data === undefined &&
      form.formState.submitCount > 0 &&
      form.formState.isSubmitSuccessful
    ) {
      // Redirect was swallowed — treat as success
      hasHandledSuccess.current = true;
      onOpenChange(false);
      form.reset(buildDefaultValues(formFields, null));
      revalidator.revalidate();
    }
  }, [
    fetcher.state,
    fetcher.data,
    fetcherData,
    form,
    formFields,
    onOpenChange,
    revalidator,
  ]);

  // Reset tracking ref when panel reopens
  useEffect(() => {
    if (open && fetcher.state === 'idle') {
      hasHandledSuccess.current = false;
    }
  }, [open, fetcher.state]);

  const onSubmit = useCallback(
    (data: Record<string, string | number | boolean | null>) => {
      hasHandledSuccess.current = false;
      fetcher.submit(data, {
        method: 'POST',
        action: 'create',
        encType: 'application/json',
      });
    },
    [fetcher],
  );

  const onInvalid = useCallback(
    (errors: Record<string, { message?: string } | undefined>) => {
      console.warn('[create-panel] validation failed', errors);
      const firstKey = Object.keys(errors)[0];
      const firstMessage = firstKey ? errors[firstKey]?.message : undefined;
      toast.error(firstMessage ?? 'Please fix the highlighted fields');
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      form.handleSubmit(onSubmit, onInvalid)(e);
    },
    [form, onSubmit, onInvalid],
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
        className="flex h-full w-full flex-col gap-0 rounded-none border-0 p-0 sm:w-[90%] sm:max-w-2xl sm:rounded-l-2xl sm:border-l"
        data-test="create-panel"
      >
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle>
            <Trans i18nKey="common:create" /> {subModuleDisplayName}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
            data-test="create-panel-form"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FormFieldGrid
                fields={formFields}
                control={form.control}
                mode="create"
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
