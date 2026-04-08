import { Calendar, Clock, Mail, MapPin, Phone, User } from 'lucide-react';

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

  if (raw === null || raw === undefined) return '';
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

function getInitials(first?: string | null, last?: string | null): string {
  return `${first?.charAt(0)?.toUpperCase() ?? ''}${last?.charAt(0)?.toUpperCase() ?? ''}`;
}

interface InlineDetailRowProps {
  data: Record<string, unknown>;
  config: CrudModuleConfig;
}

export function InlineDetailRow({ data, config }: InlineDetailRowProps) {
  const fkKeyMap = buildFkKeyMap(config, data);
  const formFields = config?.formFields ?? [];

  const firstName = data['first_name'] as string | undefined;
  const lastName = data['last_name'] as string | undefined;
  const alias = data['preferred_name'] as string | undefined;
  const photoUrl = data['profile_photo_url'] as string | undefined;
  const initials = getInitials(firstName, lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  // Resolve key fields for the detail strip
  const resolve = (key: string) => {
    const field = formFields.find((f) => f.key === key);
    if (!field) {
      const raw = data[key];
      return raw != null ? String(raw) : '';
    }
    return resolveFieldValue(field, data, fkKeyMap);
  };

  const department = resolve('hr_department_id');
  const title = resolve('hr_title_id');
  const workAuth = resolve('hr_work_authorization_id');
  const manager = resolve('compensation_manager_id');
  const teamLead = resolve('team_lead_id');
  const phone = resolve('phone');
  const email = resolve('email');
  const companyEmail = resolve('company_email');
  const startDate = resolve('start_date');
  const payStructure = resolve('pay_structure');
  const otThreshold = resolve('overtime_threshold');
  const housing = resolve('site_id');
  const gender = resolve('gender');

  return (
    <div className="flex gap-5 px-4 py-3">
      {/* Avatar */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={fullName}
            className="h-14 w-14 rounded-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className =
                  'bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold';
                fallback.textContent = initials;
                parent.replaceChild(fallback, target);
              }
            }}
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold">
            {initials}
          </div>
        )}
        {alias && (
          <span className="text-muted-foreground text-[11px]">
            &ldquo;{alias}&rdquo;
          </span>
        )}
      </div>

      {/* Info columns */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Row 1: Name + badges */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{fullName}</span>
          {title && (
            <Badge variant="secondary" className="text-[11px]">
              {title}
            </Badge>
          )}
          {workAuth && (
            <Badge variant="outline" className="text-[11px]">
              {workAuth}
            </Badge>
          )}
          {gender && (
            <span className="text-muted-foreground text-[11px] capitalize">
              {gender}
            </span>
          )}
        </div>

        {/* Row 2: Key info strip */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {department && (
            <InfoChip icon={User} label="Dept" value={department} />
          )}
          {manager && <InfoChip icon={User} label="Mgr" value={manager} />}
          {teamLead && <InfoChip icon={User} label="Lead" value={teamLead} />}
          {housing && (
            <InfoChip icon={MapPin} label="Housing" value={housing} />
          )}
        </div>

        {/* Row 3: Contact + dates */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {(companyEmail || email) && (
            <InfoChip icon={Mail} value={companyEmail || email} />
          )}
          {phone && <InfoChip icon={Phone} value={phone} />}

          {startDate && (
            <InfoChip icon={Calendar} label="Start" value={startDate} />
          )}
          {payStructure && <span className="capitalize">{payStructure}</span>}
          {otThreshold && <span>OT: {otThreshold}h</span>}
        </div>

        {/* Row 4: Audit */}
        <div className="text-muted-foreground/60 flex items-center gap-3 text-[11px]">
          {typeof data['created_at'] === 'string' && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {formatDate(data['created_at'])}
            </span>
          )}
          {typeof data['updated_at'] === 'string' && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {formatDate(data['updated_at'])}
            </span>
          )}
          <Separator orientation="vertical" className="h-3" />
          <span>ID: {String(data[config.pkColumn ?? 'id'] ?? '')}</span>
        </div>
      </div>
    </div>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  value: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <Icon className="h-3 w-3 shrink-0" />
      {label && <span className="text-muted-foreground/70">{label}:</span>}
      <span className="text-foreground">{value}</span>
    </span>
  );
}
