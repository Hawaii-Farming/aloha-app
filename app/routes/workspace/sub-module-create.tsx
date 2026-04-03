import { useCallback } from 'react';

import { Link, redirect, useFetcher } from 'react-router';

import type { SupabaseClient } from '@supabase/supabase-js';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Path } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { ZodObject, ZodRawShape } from 'zod';
import { z } from 'zod';


import { Button } from '@aloha/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@aloha/ui/card';
import { Form } from '@aloha/ui/form';
import { If } from '@aloha/ui/if';
import { PageBody, PageHeader } from '@aloha/ui/page';
import { toast } from '@aloha/ui/sonner';
import { Trans } from '@aloha/ui/trans';

import { AiFormAssist } from '~/components/ai/ai-form-assist';
import {
  crudCreateAction,
  crudUpdateAction,
} from '~/lib/crud/crud-action.server';
import { loadDetailData } from '~/lib/crud/crud-helpers.server';
import { getModuleConfig } from '~/lib/crud/registry';
import { renderFormField } from '~/lib/crud/render-form-field';
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

const fallbackFormFields = [
  {
    key: 'id',
    label: 'ID',
    type: 'text' as const,
    required: true,
    showOnCreate: true,
    showOnEdit: false,
  },
  { key: 'name', label: 'Name', type: 'text' as const, required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
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

  let record: Record<string, unknown> | null = null;

  if (recordId) {
    record = await loadDetailData<Record<string, unknown>>({
      client,
      viewName,
      orgId: accountSlug,
      pkColumn,
      pkValue: recordId,
    });
  }

  const fkFields = (config?.formFields ?? []).filter((f) => f.type === 'fk');
  const fkOptions: Record<string, Array<{ value: string; label: string }>> = {};

  const untypedClient = client as unknown as SupabaseClient;

  for (const field of fkFields) {
    if (field.fkTable && field.fkLabelColumn) {
      const { data } = await untypedClient
        .from(field.fkTable)
        .select(`id, ${field.fkLabelColumn}`)
        .eq('org_id', accountSlug)
        .eq('is_deleted', false)
        .order(field.fkLabelColumn)
        .limit(200);

      const rows = (data ?? []) as unknown as Record<string, unknown>[];
      fkOptions[field.key] = rows.map((row) => ({
        value: String(row['id']),
        label: String(row[field.fkLabelColumn!]),
      }));
    }
  }

  return {
    moduleAccess,
    subModuleAccess,
    accountSlug,
    mode: recordId ? ('edit' as const) : ('create' as const),
    record,
    fkOptions,
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
    (data: Record<string, unknown>) => {
      fetcher.submit(data as unknown as Record<string, string>, {
        method: 'POST',
        encType: 'application/json',
      });
    },
    [fetcher],
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
      >
      </PageHeader>

      <PageBody>
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
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

                {formFields.map((field) =>
                  renderFormField({
                    field,
                    control: form.control,
                    mode,
                    pkColumn,
                    fkOptions,
                  }),
                )}

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={isSubmitting}>
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
