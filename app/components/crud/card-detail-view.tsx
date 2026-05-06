import { useCallback, useState } from 'react';

import { useFetcher, useNavigate } from 'react-router';

import { ArrowLeft, Calendar, Clock, Trash2, User } from 'lucide-react';

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
import { Button } from '@aloha/ui/button';
import { Separator } from '@aloha/ui/separator';
import { Trans } from '@aloha/ui/trans';
import { WorkflowHistory } from '@aloha/ui/workflow-history';
import { WorkflowStatusBadge } from '@aloha/ui/workflow-status-badge';
import { WorkflowTransitionButtons } from '@aloha/ui/workflow-transition';

import { EditPanel } from '~/components/crud/edit-panel';
import { InlineField } from '~/components/crud/inline-field';
import type {
  CrudModuleConfig,
  DetailViewProps,
  FormFieldConfig,
} from '~/lib/crud/types';
import { buildHistoryEntries } from '~/lib/crud/workflow-helpers';
import { AccessGate } from '~/lib/workspace/access-gate';
import { useHasPermission } from '~/lib/workspace/use-module-access';

function formatDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildFkKeyMap(
  config: CrudModuleConfig,
  record: Record<string, unknown>,
): Record<string, string> {
  const map: Record<string, string> = {};
  const fkFields = (config.formFields ?? []).filter(
    (f) =>
      f.type === 'fk' &&
      (f.fkLabelColumn || (f.fkLabelColumns && f.fkLabelColumns.length > 0)),
  );

  for (const field of fkFields) {
    // Multi-column FK labels are resolved separately via resolveFkLabelColumns;
    // skip them here so the single-key map only handles fkLabelColumn fields.
    if (field.fkLabelColumns && field.fkLabelColumns.length > 0) {
      continue;
    }
    if (!field.fkLabelColumn) continue;

    const label = field.fkLabelColumn;
    const selfJoinKey = `${field.key}_${label}`;

    if (record[selfJoinKey] !== undefined) {
      map[field.key] = selfJoinKey;
      continue;
    }

    const baseKey = field.key.replace(/_id$/, '');
    const aliasKey = `${baseKey}_${label}`;

    if (record[aliasKey] !== undefined) {
      map[field.key] = aliasKey;
      continue;
    }

    for (const rk of Object.keys(record)) {
      if (rk.endsWith(`_${label}`) && rk.includes(baseKey)) {
        map[field.key] = rk;
        break;
      }
    }
  }

  return map;
}

function resolveFkLabelColumns(
  field: FormFieldConfig,
  record: Record<string, unknown>,
): string | null {
  if (!field.fkLabelColumns || field.fkLabelColumns.length === 0) {
    return null;
  }
  const baseKey = field.key.replace(/_id$/, '');
  const embedAlias = field.fkEmbedAlias;
  const parts: string[] = [];
  for (const col of field.fkLabelColumns) {
    const selfJoinKey = `${field.key}_${col}`;
    const aliasKey = `${baseKey}_${col}`;
    const embedKey = embedAlias ? `${embedAlias}_${col}` : null;
    const raw =
      embedKey && record[embedKey] !== undefined
        ? record[embedKey]
        : record[selfJoinKey] !== undefined
          ? record[selfJoinKey]
          : record[aliasKey];
    if (raw !== null && raw !== undefined && String(raw).length > 0) {
      parts.push(String(raw));
    }
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

function resolveFieldValue(
  field: FormFieldConfig,
  record: Record<string, unknown>,
  fkKeyMap: Record<string, string>,
): string {
  if (field.type === 'fk') {
    const composed = resolveFkLabelColumns(field, record);
    if (composed) return composed;
  }

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
  subModuleDisplayName,
  hasWorkflow,
  workflowConfig,
  fkOptions,
  comboboxOptions,
}: DetailViewProps) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const canEdit = useHasPermission('can_edit');

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
      <div
        className="flex min-h-0 flex-1 flex-col"
        data-test="crud-detail-page"
      >
        {/* Top bar: back + actions */}
        <div className="border-border flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="bg-border h-5 w-px" />

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                <User className="text-primary h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-foreground text-sm font-semibold">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-muted-foreground ml-1.5 text-sm">
                    {subtitle}
                  </span>
                )}
              </div>
              {hasWorkflow && workflowConfig && (
                <WorkflowStatusBadge
                  status={record[workflowConfig.statusColumn] as string}
                  states={workflowConfig.states}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasWorkflow && workflowConfig && (
              <AccessGate permission="can_edit">
                <WorkflowTransitionButtons
                  currentStatus={record[workflowConfig.statusColumn] as string}
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
                Edit
              </Button>
            </AccessGate>

            <AccessGate permission="can_delete">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-8 py-8">
            {/* Workflow history */}
            {hasWorkflow && workflowConfig && (
              <div className="mb-8">
                <WorkflowHistory
                  entries={buildHistoryEntries(record, workflowConfig)}
                />
              </div>
            )}

            {/* Field sections */}
            <div className="space-y-8">
              {sections.map((section, i) => (
                <div key={section.title ?? i}>
                  {section.title && (
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-foreground text-base font-semibold tracking-wide">
                        {section.title}
                      </h2>
                      <Separator className="flex-1" />
                    </div>
                  )}

                  {!section.title && i > 0 && <Separator className="mb-4" />}

                  <div className="grid grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                    {section.fields.map((field) => {
                      const value = resolveFieldValue(field, record, fkKeyMap);
                      const fkOptionsForField =
                        field.type === 'fk'
                          ? (fkOptions?.[field.key] ?? [])
                          : [];
                      const comboboxOptionsForField =
                        field.type === 'combobox'
                          ? (comboboxOptions?.[field.key] ?? [])
                          : [];

                      return (
                        <div key={field.key} className="min-w-0">
                          <dt className="text-muted-foreground mb-1 text-sm font-medium tracking-wider uppercase">
                            {field.label}
                          </dt>
                          <dd>
                            <InlineField
                              field={field}
                              displayValue={value}
                              rawValue={record[field.key]}
                              fkOptions={fkOptionsForField}
                              comboboxOptions={comboboxOptionsForField}
                              canEdit={canEdit}
                            />
                          </dd>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Audit footer */}
            <div className="border-border mt-10 border-t pt-4">
              <div className="text-muted-foreground flex flex-wrap items-center gap-5 text-xs">
                {typeof record['created_at'] === 'string' && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Created {formatDate(record['created_at'])}
                  </span>
                )}
                {typeof record['updated_at'] === 'string' && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {formatDate(record['updated_at'])}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
