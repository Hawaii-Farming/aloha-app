import { useCallback, useState } from 'react';

import { useFetcher } from 'react-router';

import { Calendar, Clock, Pencil, Trash2, User } from 'lucide-react';

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
import { Badge } from '@aloha/ui/badge';
import { Button } from '@aloha/ui/button';
import { Card, CardContent } from '@aloha/ui/card';
import { PageBody } from '@aloha/ui/page';
import { Separator } from '@aloha/ui/separator';
import { Trans } from '@aloha/ui/trans';
import { WorkflowHistory } from '@aloha/ui/workflow-history';
import { WorkflowStatusBadge } from '@aloha/ui/workflow-status-badge';
import { WorkflowTransitionButtons } from '@aloha/ui/workflow-transition';

import { EditPanel } from '~/components/crud/edit-panel';
import type {
  CrudModuleConfig,
  DetailViewProps,
  FormFieldConfig,
} from '~/lib/crud/types';
import { buildHistoryEntries } from '~/lib/crud/workflow-helpers';
import { AccessGate } from '~/lib/workspace/access-gate';

function formatDate(value: string): string {
  const d = new Date(value);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Build a map from FK field key to the flattened record key that holds the resolved name.
 * e.g. { hr_department_id: 'hr_department_name', compensation_manager_id: 'compensation_manager_id_preferred_name' }
 */
function buildFkKeyMap(
  config: CrudModuleConfig,
  record: Record<string, unknown>,
): Record<string, string> {
  const map: Record<string, string> = {};
  const fkFields = (config.formFields ?? []).filter(
    (f) => f.type === 'fk' && f.fkLabelColumn,
  );

  for (const field of fkFields) {
    const label = field.fkLabelColumn!;

    // Try patterns in order of likelihood:
    // 1. Self-join pattern: field_key + _ + fkLabelColumn (e.g. compensation_manager_id_preferred_name)
    const selfJoinKey = `${field.key}_${label}`;

    if (record[selfJoinKey] !== undefined) {
      map[field.key] = selfJoinKey;
      continue;
    }

    // 2. Alias pattern: table alias + _ + fkLabelColumn (e.g. hr_department_name)
    // Strip _id suffix to get the likely alias base
    const baseKey = field.key.replace(/_id$/, '');
    const aliasKey = `${baseKey}_${label}`;

    if (record[aliasKey] !== undefined) {
      map[field.key] = aliasKey;
      continue;
    }

    // 3. Search all record keys for one ending with _fkLabelColumn that contains the base
    for (const rk of Object.keys(record)) {
      if (rk.endsWith(`_${label}`) && rk.includes(baseKey)) {
        map[field.key] = rk;
        break;
      }
    }
  }

  return map;
}

function resolveFieldValue(
  field: FormFieldConfig,
  record: Record<string, unknown>,
  fkKeyMap: Record<string, string>,
): string {
  // For FK fields, use the pre-built map
  const fkRecordKey = fkKeyMap[field.key];

  if (field.type === 'fk' && fkRecordKey) {
    const resolved = record[fkRecordKey];

    if (resolved) return String(resolved);
  }

  const raw = record[field.key];

  if (raw === null || raw === undefined) return '--';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';

  const str = String(raw);

  if (field.type === 'date' && /^\d{4}-\d{2}-\d{2}/.test(str)) {
    return formatDate(str);
  }

  // Proper case for radio/select fields with known options
  if (
    (field.type === 'radio' || field.type === 'select') &&
    field.options?.length
  ) {
    const option = field.options.find(
      (o) => (typeof o === 'string' ? o : o.value) === str,
    );

    if (option) return typeof option === 'string' ? option : option.label;
  }

  return str;
}

function getRecordTitle(
  record: Record<string, unknown>,
  config: CrudModuleConfig,
): string {
  const first = (record['first_name'] as string) ?? '';
  const last = (record['last_name'] as string) ?? '';

  if (first && last) return `${first} ${last}`;

  return (
    (record['name'] as string) ??
    (record['preferred_name'] as string) ??
    (record[config.pkColumn ?? 'id'] as string) ??
    'Record'
  );
}

function getRecordSubtitle(
  record: Record<string, unknown>,
  config: CrudModuleConfig,
): string | null {
  const select = config.select ?? '';

  // Try common subtitle fields
  if (record['preferred_name'] && record['first_name']) {
    return `"${record['preferred_name']}"`;
  }

  if (select.includes('hr_department') && record['hr_department_name']) {
    return String(record['hr_department_name']);
  }

  return null;
}

interface FieldSection {
  title: string | null;
  fields: FormFieldConfig[];
}

function buildSections(formFields: FormFieldConfig[]): FieldSection[] {
  const sections: FieldSection[] = [];
  let current: FieldSection = { title: null, fields: [] };

  for (const field of formFields) {
    if (field.section) {
      if (current.fields.length > 0) sections.push(current);
      current = { title: field.section, fields: [field] };
    } else {
      current.fields.push(field);
    }
  }

  if (current.fields.length > 0) sections.push(current);
  return sections;
}

export function CardDetailView({
  record,
  config,
  recordId,
  subModuleDisplayName,
  hasWorkflow,
  workflowConfig,
  fkOptions,
  comboboxOptions,
}: DetailViewProps) {
  const fetcher = useFetcher();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = useCallback(() => {
    fetcher.submit(
      { intent: 'delete' },
      { method: 'POST', encType: 'application/json' },
    );
  }, [fetcher]);

  const handleTransition = useCallback(
    (newStatus: string) => {
      if (!workflowConfig) return;
      const payload: Record<string, string | Record<string, string> | null> = {
        intent: 'transition',
        statusColumn: workflowConfig.statusColumn,
        newStatus,
        transitionFields: workflowConfig.transitionFields?.[newStatus] ?? null,
      };
      fetcher.submit(payload, {
        method: 'POST',
        encType: 'application/json',
      });
    },
    [fetcher, workflowConfig],
  );

  const isDeleting = fetcher.state !== 'idle';
  const title = getRecordTitle(record, config);
  const subtitle = getRecordSubtitle(record, config);
  const formFields = config?.formFields ?? [];
  const sections = buildSections(formFields);
  const fkKeyMap = buildFkKeyMap(config, record);

  return (
    <>
      <PageBody className="min-h-0 overflow-hidden">
        <div
          className="flex min-h-0 flex-1 flex-col"
          data-test="crud-detail-page"
        >
          {/* Identity bar — frozen at top */}
          <div className="shrink-0 pb-4">
            <Card>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <User className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">{title}</h2>
                    {subtitle && (
                      <p className="text-muted-foreground text-sm">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {hasWorkflow && workflowConfig && (
                    <WorkflowStatusBadge
                      status={record[workflowConfig.statusColumn] as string}
                      states={workflowConfig.states}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                  {hasWorkflow && workflowConfig && (
                    <AccessGate permission="can_edit">
                      <WorkflowTransitionButtons
                        currentStatus={
                          record[workflowConfig.statusColumn] as string
                        }
                        transitions={workflowConfig.transitions}
                        states={workflowConfig.states}
                        onTransition={handleTransition}
                        disabled={fetcher.state !== 'idle'}
                      />
                    </AccessGate>
                  )}

                  <AccessGate permission="can_edit">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
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
                          Delete
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
              </CardContent>
            </Card>
          </div>

          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto pb-6">
            <div className="flex flex-col gap-5">
              {/* Workflow history */}
              {hasWorkflow && workflowConfig && (
                <WorkflowHistory
                  entries={buildHistoryEntries(record, workflowConfig)}
                />
              )}

              {/* Sectioned fields */}
              <Card>
                <CardContent className="py-4">
                  <div className="space-y-6">
                    {sections.map((section, i) => (
                      <div key={section.title ?? i}>
                        {i > 0 && <Separator className="mb-6" />}

                        {section.title && (
                          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                            {section.title}
                          </h3>
                        )}

                        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                          {section.fields.map((field) => {
                            const value = resolveFieldValue(
                              field,
                              record,
                              fkKeyMap,
                            );
                            const isEmpty = value === '--';

                            return (
                              <div key={field.key} className="min-w-0">
                                <dt className="text-muted-foreground text-xs font-medium">
                                  {field.label}
                                </dt>
                                <dd
                                  className={`mt-0.5 truncate text-sm ${isEmpty ? 'text-muted-foreground/50' : ''}`}
                                  title={value}
                                >
                                  {field.type === 'boolean' ? (
                                    <Badge
                                      variant={
                                        record[field.key] === true
                                          ? 'default'
                                          : 'secondary'
                                      }
                                      className="mt-0.5"
                                    >
                                      {value}
                                    </Badge>
                                  ) : (
                                    value
                                  )}
                                </dd>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Audit footer */}
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 px-1 text-xs">
                {typeof record['created_at'] === 'string' && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created {formatDate(record['created_at'])}
                  </span>
                )}
                {typeof record['updated_at'] === 'string' && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {formatDate(record['updated_at'])}
                  </span>
                )}
                <span className="text-muted-foreground/50">
                  ID: {String(record[config.pkColumn ?? 'id'] ?? recordId)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageBody>

      <EditPanel
        open={editOpen}
        onOpenChange={setEditOpen}
        config={config}
        record={record}
        fkOptions={fkOptions}
        comboboxOptions={comboboxOptions}
        subModuleDisplayName={subModuleDisplayName}
      />
    </>
  );
}
