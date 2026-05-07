import { useCallback } from 'react';

import { Link, redirect, useFetcher } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Path } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { ZodObject, ZodRawShape } from 'zod';
import { z } from 'zod';

import { Button } from '@aloha/ui/button';
import { Card, CardContent } from '@aloha/ui/card';
import { Form } from '@aloha/ui/form';
import { If } from '@aloha/ui/if';
import { PageBody, PageHeader } from '@aloha/ui/page';
import { Separator } from '@aloha/ui/separator';
import { toast } from '@aloha/ui/sonner';
import { Trans } from '@aloha/ui/trans';

import { AiFormAssist } from '~/components/ai/ai-form-assist';
import { FormFieldGrid } from '~/components/crud/form-field-grid';
import {
  crudCreateAction,
  crudUpdateAction,
} from '~/lib/crud/crud-action.server';
import { loadDetailData } from '~/lib/crud/crud-helpers.server';
import { loadFormOptions } from '~/lib/crud/load-form-options.server';
import { getModuleConfig } from '~/lib/crud/registry';
import type { FormFieldConfig } from '~/lib/crud/types';
import { buildDefaultValues } from '~/lib/crud/workflow-helpers';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';
import {
  requireModuleAccess,
  requireSubModuleAccess,
} from '~/lib/workspace/require-module-access.server';

const fallbackSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const fallbackFormFields: FormFieldConfig[] = [
  {
    key: 'id',
    label: 'ID',
    type: 'text',
    required: true,
    showOnCreate: true,
    showOnEdit: false,
  },
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export const loader = async (args: {
  request: Request;
  params: Record<string, string>;
}) => {
  const accountSlug = args.params.account as string;
  const moduleSlug = args.params.module as string;
  const subModuleSlug = args.params.subModule as string;
  const recordId = args.params.recordId;
  const client = getSupabaseServerClient(args.request);

  const [moduleAccess, subModuleAccess] = await Promise.all([
    requireModuleAccess({ client, moduleSlug, orgSlug: accountSlug }),
    requireSubModuleAccess({
      client,
      moduleSlug,
      subModuleSlug,
      orgSlug: accountSlug,
    }),
  ]);

  const config = getModuleConfig(subModuleSlug);
  const viewName = config?.views.detail ?? subModuleSlug;
  const pkColumn = config?.pkColumn ?? 'id';

  // Detail row (edit mode only) and form options share no dependency.
  const [record, formOptions] = await Promise.all([
    recordId
      ? loadDetailData<Record<string, unknown>>({
          client,
          viewName,
          orgId: accountSlug,
          pkColumn,
          pkValue: recordId,
        })
      : Promise.resolve(null),
    loadFormOptions({
      client,
      config,
      orgId: accountSlug,
      subModuleSlug,
    }),
  ]);
  const { fkOptions, comboboxOptions } = formOptions;

  return {
    moduleAccess,
    subModuleAccess,
    accountSlug,
    mode: recordId ? ('edit' as const) : ('create' as const),
    record,
    fkOptions,
    comboboxOptions,
  };
};

export const action = async (args: {
  request: Request;
  params: Record<string, string>;
}) => {
  const accountSlug = args.params.account as string;
  const moduleSlug = args.params.module as string;
  const subModuleSlug = args.params.subModule as string;
  const recordId = args.params.recordId;
  const client = getSupabaseServerClient(args.request);
  const formData = await args.request.json();
  const config = getModuleConfig(subModuleSlug);
  const tableName = config?.tableName ?? subModuleSlug;
  const schema = config?.schema ?? fallbackSchema;
  const pkColumn = config?.pkColumn ?? 'id';
  const pkType = config?.pkType ?? 'text';
  const workspace = await loadOrgWorkspace({
    orgSlug: accountSlug,
    client,
    request: args.request,
  });

  // Housing creates now hit org_site_housing directly — no category
  // resolution needed since the table is housing-only by definition.

  // Prevent editing locked employee reviews (T-06-09)
  if (recordId && subModuleSlug === 'Employee Review') {
    const { data: existing } = await client
      .from('hr_employee_review' as never)
      .select('is_locked')
      .eq('id', recordId)
      .single();
    if ((existing as unknown as Record<string, unknown>)?.is_locked === true) {
      return {
        success: false,
        error: 'This review is locked and cannot be edited.',
      };
    }
  }

  if (recordId) {
    const result = await crudUpdateAction({
      client,
      tableName,
      orgId: accountSlug,
      employeeId: workspace.currentOrg.employee_id,
      data: formData,
      schema,
      pkColumn,
      pkValue: recordId,
    });

    if (!result.success) return result;
  } else {
    const result = await crudCreateAction({
      client,
      tableName,
      orgId: accountSlug,
      employeeId: workspace.currentOrg.employee_id,
      data: formData,
      schema,
      pkType,
      generatePk: config?.generatePk,
      additionalFields: config?.additionalCreateFields,
    });

    if (!result.success) return result;
  }

  return redirect(`/home/${accountSlug}/${moduleSlug}/${subModuleSlug}`);
};

export default function SubModuleCreatePage(props: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const {
    moduleAccess,
    subModuleAccess,
    accountSlug,
    mode,
    record,
    fkOptions,
    comboboxOptions,
  } = props.loaderData;

  const fetcher = useFetcher();

  const config = getModuleConfig(subModuleAccess.sub_module_slug);
  const formFields = config?.formFields ?? fallbackFormFields;
  const pkColumn = config?.pkColumn ?? 'id';
  const schema = (config?.schema ?? fallbackSchema) as ZodObject<ZodRawShape>;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(formFields, record),
  });

  const onSubmit = useCallback(
    (data: Record<string, string | number | boolean | null>) => {
      fetcher.submit(data, {
        method: 'POST',
        encType: 'application/json',
      });
    },
    [fetcher],
  );

  const onInvalid = useCallback(
    (errors: Record<string, { message?: string } | undefined>) => {
      console.warn('[sub-module-create] validation failed', errors);
      const firstKey = Object.keys(errors)[0];
      const firstMessage = firstKey ? errors[firstKey]?.message : undefined;
      toast.error(firstMessage ?? 'Please fix the highlighted fields');
    },
    [],
  );

  const isSubmitting = fetcher.state !== 'idle';

  const fetcherData = fetcher.data as
    | { success: false; error?: string; errors?: unknown }
    | undefined;

  if (fetcherData && !fetcherData.success) {
    toast.error(fetcherData.error ?? 'Validation failed');
  }

  const title =
    mode === 'edit'
      ? `Edit ${subModuleAccess.display_name}`
      : `Create ${subModuleAccess.display_name}`;

  return (
    <>
      <PageHeader
        title={title}
        description={`${moduleAccess.display_name} > ${subModuleAccess.display_name}`}
      ></PageHeader>

      <PageBody>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                className="space-y-6"
                data-test="crud-create-form"
              >
                <AiFormAssist
                  schema={schema}
                  setValue={form.setValue}
                  fieldNames={formFields.map(
                    (f) => f.key as Path<Record<string, unknown>>,
                  )}
                />

                <FormFieldGrid
                  fields={formFields}
                  control={form.control}
                  mode={mode}
                  pkColumn={pkColumn}
                  fkOptions={fkOptions}
                  comboboxOptions={comboboxOptions}
                />

                <Separator />

                <div className="flex items-center gap-3">
                  <Button type="submit" variant="brand" disabled={isSubmitting}>
                    <If condition={isSubmitting}>
                      <Trans i18nKey="common:loading" />
                    </If>

                    <If condition={!isSubmitting}>
                      <Trans
                        i18nKey={
                          mode === 'edit' ? 'common:save' : 'common:create'
                        }
                      />
                    </If>
                  </Button>

                  <Button variant="outline" asChild>
                    <Link
                      to={`/home/${accountSlug}/${moduleAccess.module_slug}/${subModuleAccess.sub_module_slug}`}
                      prefetch="intent"
                    >
                      <Trans i18nKey="common:cancel" />
                    </Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
