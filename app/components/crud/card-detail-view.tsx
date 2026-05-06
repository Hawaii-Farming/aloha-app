import { useCallback, useState } from 'react';

import { useFetcher, useNavigate } from 'react-router';

import { ArrowLeft, Trash2 } from 'lucide-react';

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
import { Trans } from '@aloha/ui/trans';
import { WorkflowStatusBadge } from '@aloha/ui/workflow-status-badge';
import { WorkflowTransitionButtons } from '@aloha/ui/workflow-transition';

import { EditPanel } from '~/components/crud/edit-panel';
import type {
  CrudModuleConfig,
  DetailViewProps,
  FormFieldConfig,
} from '~/lib/crud/types';
import { buildHistoryEntries } from '~/lib/crud/workflow-helpers';
import type { WorkflowHistoryEntry } from '~/lib/crud/workflow-helpers';
import { stateDotClass } from '~/lib/crud/workflow-state-color';
import { formatDate, formatDateTime } from '~/lib/format/date';
import { AccessGate } from '~/lib/workspace/access-gate';

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]!.toUpperCase()}${parts[parts.length - 1]![0]!.toUpperCase()}`;
  }
  return fullName.slice(0, 2).toUpperCase();
}

function getRecordPhotoUrl(
  record: Record<string, unknown>,
): string | undefined {
  const direct = record['profile_photo_url'];
  if (typeof direct === 'string' && direct.length > 0) return direct;
  const subject = record['subject_profile_photo_url'];
  if (typeof subject === 'string' && subject.length > 0) return subject;
  return undefined;
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

  if (raw === null || raw === undefined) return '—';
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

  const subjectFirst = (record['subject_first_name'] as string) ?? '';
  const subjectLast = (record['subject_last_name'] as string) ?? '';
  if (subjectFirst && subjectLast) return `${subjectFirst} ${subjectLast}`;

  return (
    (record['name'] as string) ??
    (record['preferred_name'] as string) ??
    (record['subject_preferred_name'] as string) ??
    (record['employee_name'] as string) ??
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

  if (record['subject_preferred_name'] && record['subject_first_name']) {
    return `"${record['subject_preferred_name']}"`;
  }

  if (select.includes('hr_department') && record['hr_department_name']) {
    return String(record['hr_department_name']);
  }

  return null;
}

function WorkflowInline({ entries }: { entries: WorkflowHistoryEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
      {entries.map((entry, i) => (
        <div
          key={`${entry.action}-${i}`}
          className="flex items-start gap-2 last:after:hidden"
        >
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${stateDotClass(entry.color)}`}
          />
          <div>
            <div className="text-foreground text-sm font-medium">
              {entry.action}
              {entry.at && (
                <span className="text-muted-foreground/80 ml-1.5 text-[11px] font-normal">
                  · {formatDateTime(entry.at)}
                </span>
              )}
            </div>
            {entry.by && (
              <div className="text-muted-foreground text-xs">{entry.by}</div>
            )}
          </div>
          {i < entries.length - 1 && (
            <span
              aria-hidden="true"
              className="text-muted-foreground/40 mt-0.5 ml-2 select-none"
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
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
  const photoUrl = getRecordPhotoUrl(record);
  const initials = getInitials(title);
  const formFields = config?.formFields ?? [];
  const fkKeyMap = buildFkKeyMap(config, record);

  // Pull the first textarea field out — it becomes the right-aside "highlight".
  const highlightField = formFields.find((f) => f.type === 'textarea');
  const highlightValue = highlightField
    ? resolveFieldValue(highlightField, record, fkKeyMap)
    : null;

  // Everything else lives in the left-side facts table. Skip UI-only meta
  // fields (pto-allocation is a write-time helper, not a stored value).
  const factFields = formFields.filter(
    (f) => f.key !== highlightField?.key && f.type !== 'pto-allocation',
  );

  const currentStatus =
    hasWorkflow && workflowConfig
      ? (record[workflowConfig.statusColumn] as string)
      : null;
  const currentStateColor =
    currentStatus && workflowConfig
      ? (workflowConfig.states[currentStatus]?.color ?? 'default')
      : 'default';

  const historyEntries =
    hasWorkflow && workflowConfig
      ? buildHistoryEntries(record, workflowConfig)
      : [];

  // The right-side aside renders when there's something distinct to put
  // there — workflow status or a textarea highlight. Otherwise the facts
  // table fills the full width (Register, etc.).
  const renderAside = hasWorkflow || (highlightField && highlightValue);

  return (
    <>
      <div
        className="bg-card flex min-h-0 flex-1 flex-col"
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
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={title}
                  className="ring-border h-9 w-9 shrink-0 rounded-full object-cover ring-2"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className =
                        'bg-primary/10 text-primary ring-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-2';
                      fallback.textContent = initials;
                      parent.replaceChild(fallback, target);
                    }
                  }}
                />
              ) : (
                <div className="bg-primary/10 text-primary ring-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-2">
                  {initials}
                </div>
              )}
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
          <div
            className={`grid grid-cols-1 ${renderAside ? 'lg:grid-cols-3' : ''}`}
          >
            {/* LEFT: facts table */}
            <div className={`px-6 py-5 ${renderAside ? 'lg:col-span-2' : ''}`}>
              <table className="w-full text-sm">
                <tbody>
                  {factFields.map((field) => {
                    const value = resolveFieldValue(field, record, fkKeyMap);
                    const isEmpty = value === '—';

                    return (
                      <tr
                        key={field.key}
                        className="border-border/60 border-b last:border-b-0"
                      >
                        <td className="text-muted-foreground/70 w-44 py-2 align-top text-[11px] font-normal tracking-wider uppercase">
                          {field.label}
                        </td>
                        <td className="text-foreground py-2 align-top text-sm font-medium">
                          {isEmpty ? (
                            <span className="text-muted-foreground/30">—</span>
                          ) : (
                            value
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Workflow timeline row */}
                  {hasWorkflow && historyEntries.length > 0 && (
                    <tr className="border-border/60 border-b last:border-b-0">
                      <td className="text-muted-foreground/70 w-44 py-3 align-top text-[11px] font-normal tracking-wider uppercase">
                        Workflow
                      </td>
                      <td className="py-3">
                        <WorkflowInline entries={historyEntries} />
                      </td>
                    </tr>
                  )}
                  {/* Audit rows (Created / Updated) inline at the end */}
                  {typeof record['created_at'] === 'string' && (
                    <tr className="border-border/60 border-b last:border-b-0">
                      <td className="text-muted-foreground/70 w-44 py-2 align-top text-[11px] font-normal tracking-wider uppercase">
                        Created
                      </td>
                      <td className="text-foreground py-2 align-top text-sm font-medium">
                        {formatDateTime(record['created_at'])}
                      </td>
                    </tr>
                  )}
                  {typeof record['updated_at'] === 'string' && (
                    <tr>
                      <td className="text-muted-foreground/70 w-44 py-2 align-top text-[11px] font-normal tracking-wider uppercase">
                        Updated
                      </td>
                      <td className="text-foreground py-2 align-top text-sm font-medium">
                        {formatDateTime(record['updated_at'])}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* RIGHT: status + highlight aside */}
            {renderAside && (
              <aside className="px-6 py-5">
                {hasWorkflow && currentStatus && workflowConfig && (
                  <div className="mb-5">
                    <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">
                      Status
                    </h2>
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${stateDotClass(currentStateColor)}`}
                      />
                      <div>
                        <div className="text-foreground text-sm font-medium">
                          {workflowConfig.states[currentStatus]?.label ??
                            currentStatus}
                        </div>
                        {historyEntries.length > 0 && (
                          <div className="text-muted-foreground text-xs">
                            {(() => {
                              const last =
                                historyEntries[historyEntries.length - 1];
                              const parts = [];
                              if (last?.by) parts.push(last.by);
                              if (last?.at) parts.push(formatDateTime(last.at));
                              return parts.join(' · ');
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {highlightField && highlightValue && highlightValue !== '—' && (
                  <div>
                    <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">
                      {highlightField.label}
                    </h2>
                    <p className="text-foreground text-sm leading-relaxed">
                      {highlightValue}
                    </p>
                  </div>
                )}
              </aside>
            )}
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
