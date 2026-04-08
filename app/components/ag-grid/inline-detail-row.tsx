import { Calendar, Clock } from 'lucide-react';

import { Badge } from '@aloha/ui/badge';
import { Separator } from '@aloha/ui/separator';

import type { CrudModuleConfig, FormFieldConfig } from '~/lib/crud/types';

function formatDate(value: string): string {
  const d = new Date(value);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

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

function resolveFieldValue(
  field: FormFieldConfig,
  record: Record<string, unknown>,
  fkKeyMap: Record<string, string>,
): string {
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

interface InlineDetailRowProps {
  data: Record<string, unknown>;
  config: CrudModuleConfig;
}

export function InlineDetailRow({ data, config }: InlineDetailRowProps) {
  const formFields = config?.formFields ?? [];
  const sections = buildSections(formFields);
  const fkKeyMap = buildFkKeyMap(config, data);

  return (
    <div className="space-y-4 px-2 py-3">
      {sections.map((section, i) => (
        <div key={section.title ?? i}>
          {i > 0 && <Separator className="mb-4" />}

          {section.title && (
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
              {section.title}
            </h3>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {section.fields.map((field) => {
              const value = resolveFieldValue(field, data, fkKeyMap);
              const isEmpty = value === '--';

              return (
                <div key={field.key} className="min-w-0">
                  <dt className="text-muted-foreground text-[11px] font-medium">
                    {field.label}
                  </dt>
                  <dd
                    className={`truncate text-sm ${isEmpty ? 'text-muted-foreground/50' : ''}`}
                    title={value}
                  >
                    {field.type === 'boolean' ? (
                      <Badge
                        variant={
                          data[field.key] === true ? 'default' : 'secondary'
                        }
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

      {/* Audit footer */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-4 pt-1 text-[11px]">
        {typeof data['created_at'] === 'string' && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created {formatDate(data['created_at'])}
          </span>
        )}
        {typeof data['updated_at'] === 'string' && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Updated {formatDate(data['updated_at'])}
          </span>
        )}
        <span className="text-muted-foreground/50">
          ID: {String(data[config.pkColumn ?? 'id'] ?? '')}
        </span>
      </div>
    </div>
  );
}
