import { useCallback } from 'react';

import { Link, redirect, useFetcher } from 'react-router';

import { Pencil, Trash2 } from 'lucide-react';

import { AccessGate } from '@aloha/access-control/components';
import { useModuleAccess } from '@aloha/access-control/hooks';
import { createWorkflowAgent } from '@aloha/ai/workflow-automation';
import { getSupabaseServerClient } from '@aloha/supabase/server-client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@aloha/ui/alert-dialog';
import { AppBreadcrumbs } from '@aloha/ui/app-breadcrumbs';
import { Button } from '@aloha/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@aloha/ui/card';
import { PageBody, PageHeader } from '@aloha/ui/page';
import { Trans } from '@aloha/ui/trans';
import { WorkflowHistory } from '@aloha/ui/workflow-history';
import { WorkflowStatusBadge } from '@aloha/ui/workflow-status-badge';
import { WorkflowTransitionButtons } from '@aloha/ui/workflow-transition';

import { loadOrgWorkspace } from '../_lib/org-workspace-loader.server';
import {
  requireModuleAccess,
  requireSubModuleAccess,
} from '../_lib/require-module-access.server';
import { getModuleConfig } from './_config/registry';
import {
  crudDeleteAction,
  crudTransitionAction,
} from './_lib/crud-action.server';
import { loadDetailData } from './_lib/crud-helpers.server';
import { buildHistoryEntries } from './_lib/workflow-helpers';

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
  });

  const workflowConfig = config?.workflow ?? null;

  return {
    moduleAccess,
    subModuleAccess,
    accountSlug,
    record,
    recordId,
    hasWorkflow: !!workflowConfig,
    workflowConfig,
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

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '--';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'string') {
    const datePattern = /^\d{4}-\d{2}-\d{2}/;

    if (datePattern.test(value)) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }

    return value;
  }

  return String(value);
}

function formatFieldLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const hiddenFields = new Set([
  'org_id',
  'is_deleted',
  'created_by',
  'updated_by',
]);

export default function SubModuleDetailPage(props: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  const {
    moduleAccess,
    subModuleAccess,
    accountSlug,
    record,
    recordId,
    hasWorkflow,
    workflowConfig,
  } = props.loaderData;

  const fetcher = useFetcher();

  const handleDelete = useCallback(() => {
    fetcher.submit(
      { intent: 'delete' },
      { method: 'POST', encType: 'application/json' },
    );
  }, [fetcher]);

  const handleTransition = useCallback(
    (newStatus: string) => {
      if (!workflowConfig) return;
      const payload = {
        intent: 'transition',
        statusColumn: workflowConfig.statusColumn,
        newStatus,
        transitionFields: workflowConfig.transitionFields?.[newStatus],
      };
      fetcher.submit(payload as unknown as Record<string, string>, {
        method: 'POST',
        encType: 'application/json',
      });
    },
    [fetcher, workflowConfig],
  );

  const _access = useModuleAccess();
  const isDeleting = fetcher.state !== 'idle';
  const recordName =
    (record.name as string) ?? (record.id as string) ?? recordId;

  const breadcrumbValues: Record<string, string> = {
    [accountSlug]: accountSlug,
    [moduleAccess.module_slug]: moduleAccess.display_name,
    [subModuleAccess.sub_module_slug]: subModuleAccess.display_name,
  };

  const displayFields = Object.entries(record).filter(
    ([key]) => !hiddenFields.has(key),
  );

  return (
    <>
      <PageHeader
        title={recordName}
        description={`${moduleAccess.display_name} > ${subModuleAccess.display_name}`}
      >
        <AppBreadcrumbs values={breadcrumbValues} />
      </PageHeader>

      <PageBody>
        <div className="flex flex-col gap-6" data-test="crud-detail-page">
          <div className="flex items-center gap-2">
            {hasWorkflow && workflowConfig && (
              <WorkflowStatusBadge
                status={record[workflowConfig.statusColumn] as string}
                states={workflowConfig.states}
              />
            )}

            <div className="ml-auto flex items-center gap-2">
              <AccessGate permission="can_edit">
                <Button variant="outline" size="sm" asChild>
                  <Link to="edit">
                    <Pencil className="mr-2 h-4 w-4" />
                    <Trans i18nKey="common:edit" />
                  </Link>
                </Button>
              </AccessGate>

              <AccessGate permission="can_delete">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <Trans i18nKey="common:delete" />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        <Trans i18nKey="common:confirmDelete" />
                      </AlertDialogTitle>

                      <AlertDialogDescription>
                        <Trans i18nKey="common:confirmDeleteMessage" />
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        <Trans i18nKey="common:cancel" />
                      </AlertDialogCancel>

                      <AlertDialogAction onClick={handleDelete}>
                        <Trans i18nKey="common:delete" />
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </AccessGate>
            </div>
          </div>

          {hasWorkflow && workflowConfig && (
            <>
              <AccessGate permission="can_edit">
                <WorkflowTransitionButtons
                  currentStatus={record[workflowConfig.statusColumn] as string}
                  transitions={workflowConfig.transitions}
                  states={workflowConfig.states}
                  onTransition={handleTransition}
                  disabled={fetcher.state !== 'idle'}
                />
              </AccessGate>
              <WorkflowHistory
                entries={buildHistoryEntries(record, workflowConfig)}
              />
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                <Trans i18nKey="common:details" />
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {displayFields.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-muted-foreground text-sm font-medium">
                      {formatFieldLabel(key)}
                    </dt>

                    <dd className="mt-1 text-sm">{formatFieldValue(value)}</dd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
