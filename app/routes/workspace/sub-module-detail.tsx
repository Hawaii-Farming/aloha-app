import { lazy, Suspense } from 'react';

import { redirect } from 'react-router';

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

function resolveDetailView(config: CrudModuleConfig | undefined) {
  const viewType = config?.viewType?.detail ?? 'card';

  switch (viewType) {
    case 'custom': {
      const loader = config?.customViews?.detail;

      if (loader) {
        return lazy(loader);
      }

      return CardDetailView;
    }

    // Future view types will be added here:
    // case 'workspace':

    default:
      return CardDetailView;
  }
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

  const ViewComponent = resolveDetailView(config);

  const viewProps: DetailViewProps = {
    record,
    config: config as CrudModuleConfig,
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
      <ViewComponent {...viewProps} />
    </Suspense>
  );
}
