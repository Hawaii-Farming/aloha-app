import { Suspense, lazy } from 'react';

import { redirect, useParams } from 'react-router';

import type { z } from 'zod';

import { CardDetailView } from '~/components/crud/card-detail-view';
import { createWorkflowAgent } from '~/lib/ai/workflow-automation.server';
import {
  crudDeleteAction,
  crudTransitionAction,
  crudUpdateAction,
} from '~/lib/crud/crud-action.server';
import { loadDetailData } from '~/lib/crud/crud-helpers.server';
import { loadFormOptions } from '~/lib/crud/load-form-options.server';
import { getModuleConfig } from '~/lib/crud/registry';
import type { CrudModuleConfig, DetailViewProps } from '~/lib/crud/types';
import { getSupabaseServerClient } from '~/lib/supabase/clients/server-client.server';
import { loadOrgWorkspace } from '~/lib/workspace/org-workspace-loader.server';
import {
  requireModuleAccess,
  requireSubModuleAccess,
} from '~/lib/workspace/require-module-access.server';

export const loader = async (args: {
  request: Request;
  params: Record<string, string>;
}) => {
  const accountSlug = args.params.account as string;
  const moduleSlug = args.params.module as string;
  const subModuleSlug = args.params.subModule as string;
  const recordId = args.params.recordId as string;
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

  const record = await loadDetailData<Record<string, unknown>>({
    client,
    viewName,
    orgId: accountSlug,
    pkColumn,
    pkValue: recordId,
    select: config?.select,
    selfJoins: config?.selfJoins,
  });

  const workflowConfig = config?.workflow ?? null;

  const { fkOptions, comboboxOptions } = await loadFormOptions({
    client,
    config,
    orgId: accountSlug,
    subModuleSlug,
  });

  return {
    config,
    moduleAccess,
    subModuleAccess,
    accountSlug,
    record,
    recordId,
    hasWorkflow: !!workflowConfig,
    workflowConfig,
    fkOptions,
    comboboxOptions,
  };
};

export const action = async (args: {
  request: Request;
  params: Record<string, string>;
}) => {
  const accountSlug = args.params.account as string;
  const recordId = args.params.recordId as string;
  const subModuleSlug = args.params.subModule as string;
  const moduleSlug = args.params.module as string;
  const client = getSupabaseServerClient(args.request);
  const body = await args.request.json();
  const workspace = await loadOrgWorkspace({
    orgSlug: accountSlug,
    client,
    request: args.request,
  });

  const config = getModuleConfig(subModuleSlug);
  const tableName = config?.tableName ?? subModuleSlug;
  const pkColumn = config?.pkColumn ?? 'id';

  if (body.intent === 'update') {
    const schema = config?.schema;

    if (!schema) {
      return { success: false, error: 'No schema configured' };
    }

    return crudUpdateAction({
      client,
      tableName,
      orgId: accountSlug,
      employeeId: workspace.currentOrg.employee_id,
      data: body.data,
      schema,
      pkColumn,
      pkValue: recordId,
    });
  }

  if (body.intent === 'patch') {
    const schema = config?.schema;

    if (!schema) {
      return { success: false, error: 'No schema configured' };
    }

    // Partial update — inline-edit sends one field at a time, so validate
    // against a partial schema so required fields aren't mistakenly required.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partialSchema = (schema as any).partial() as z.ZodType;

    return crudUpdateAction({
      client,
      tableName,
      orgId: accountSlug,
      employeeId: workspace.currentOrg.employee_id,
      data: body.data,
      schema: partialSchema,
      pkColumn,
      pkValue: recordId,
    });
  }

  if (body.intent === 'delete') {
    const result = await crudDeleteAction({
      client,
      tableName,
      orgId: accountSlug,
      employeeId: workspace.currentOrg.employee_id,
      pkColumn,
      pkValue: recordId,
    });

    if (result.success) {
      return redirect(`/home/${accountSlug}/${moduleSlug}/${subModuleSlug}`);
    }

    return result;
  }

  if (body.intent === 'transition') {
    const result = await crudTransitionAction({
      client,
      tableName,
      orgId: accountSlug,
      employeeId: workspace.currentOrg.employee_id,
      pkColumn,
      pkValue: recordId,
      statusColumn: body.statusColumn,
      newStatus: body.newStatus,
      transitionFields: body.transitionFields,
    });

    // Workflow agent evaluation (scaffold - fire-and-forget)
    if (process.env.ANTHROPIC_API_KEY) {
      const agent = createWorkflowAgent({
        tools: {},
        systemPrompt: `You evaluate workflow transitions for ${subModuleSlug} records in an internal business application.`,
      });

      agent
        .evaluate(
          `Record ${recordId} in ${subModuleSlug} is transitioning to status "${body.newStatus}". Evaluate whether this transition is appropriate.`,
        )
        .then((evalResult) => {
          console.info(
            `[workflow-agent] ${subModuleSlug}/${recordId} -> ${body.newStatus}: ${evalResult.text}`,
          );
        })
        .catch(() => {
          // AI evaluation is optional - do not block the transition
        });
    }

    return result;
  }

  return new Response('Invalid action', { status: 400 });
};

const detailViewCache = new Map<string, React.ComponentType<DetailViewProps>>();

function resolveDetailView(subModuleSlug: string) {
  // Re-resolve config from the client-side registry — loader serialization
  // strips non-serializable fields like customViews (function references).
  const freshConfig = getModuleConfig(subModuleSlug);
  const viewType = freshConfig?.viewType?.detail ?? 'card';

  if (viewType !== 'custom' || !freshConfig?.customViews?.detail) {
    return CardDetailView;
  }

  const cacheKey = freshConfig.tableName ?? 'default';
  const cached = detailViewCache.get(cacheKey);
  if (cached) return cached;

  const component = lazy(freshConfig.customViews.detail);
  detailViewCache.set(cacheKey, component);
  return component;
}

export default function SubModuleDetailPage(props: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const {
    config,
    moduleAccess,
    subModuleAccess,
    accountSlug,
    record,
    recordId,
    hasWorkflow,
    workflowConfig,
    fkOptions,
    comboboxOptions,
  } = props.loaderData;

  const params = useParams();
  const subModuleSlug = params.subModule ?? config?.tableName ?? '';
  const ViewComponent = resolveDetailView(subModuleSlug);

  // Loader serialization strips Zod schema methods and other non-JSON fields;
  // re-resolve from the client registry so EditPanel's zodResolver works.
  const freshConfig =
    (getModuleConfig(subModuleSlug) as CrudModuleConfig) ??
    (config as CrudModuleConfig);

  const viewProps: DetailViewProps = {
    record,
    config: freshConfig,
    recordId,
    accountSlug,
    moduleDisplayName: moduleAccess.display_name,
    subModuleDisplayName: subModuleAccess.display_name,
    hasWorkflow,
    workflowConfig,
    fkOptions,
    comboboxOptions,
  };

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading view...</div>
        </div>
      }
    >
      {/* eslint-disable-next-line react-hooks/static-components -- cached lazy component */}
      <ViewComponent {...viewProps} />
    </Suspense>
  );
}
