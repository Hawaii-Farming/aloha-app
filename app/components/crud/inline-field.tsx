import { useEffect, useRef, useState } from 'react';

import { useFetcher } from 'react-router';

import { Calendar, Check, X } from 'lucide-react';

import { Button } from '@aloha/ui/button';
import { Input } from '@aloha/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';
import { Textarea } from '@aloha/ui/textarea';
import { cn } from '@aloha/ui/utils';

import type { FormFieldConfig } from '~/lib/crud/types';

interface InlineFieldProps {
  field: FormFieldConfig;
  /** Current rendered value (already resolved for FK via fkKeyMap). */
  displayValue: string;
  /** Raw value from the record — what's actually stored and submitted. */
  rawValue: unknown;
  fkOptions?: Array<{ value: string; label: string }>;
  comboboxOptions?: string[];
  /** Whether the current user can edit. When false, renders read-only. */
  canEdit: boolean;
}

function formatDateForInput(value: unknown): string {
  if (typeof value !== 'string') return '';
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
}

export function InlineField({
  field,
  displayValue,
  rawValue,
  fkOptions = [],
  comboboxOptions = [],
  canEdit,
}: InlineFieldProps) {
  const fetcher = useFetcher();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | boolean>(() => {
    if (field.type === 'boolean') return rawValue === true;
    if (field.type === 'date') return formatDateForInput(rawValue);
    return rawValue == null ? '' : String(rawValue);
  });

  const isEmpty = displayValue === '--';
  const submitting = fetcher.state !== 'idle';

  const start = () => {
    if (!canEdit) return;
    if (field.type === 'boolean') setDraft(rawValue === true);
    else if (field.type === 'date') setDraft(formatDateForInput(rawValue));
    else setDraft(rawValue == null ? '' : String(rawValue));
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    let next: unknown = draft;
    if (field.type === 'number') {
      next = draft === '' ? null : Number(draft);
    } else if (field.type === 'boolean') {
      next = Boolean(draft);
    } else if (draft === '') {
      next = null;
    }

    // Skip no-op saves
    const same =
      rawValue == null && (next === null || next === '')
        ? true
        : rawValue === next;
    if (same) {
      setEditing(false);
      return;
    }

    fetcher.submit(
      JSON.stringify({ intent: 'patch', data: { [field.key]: next } }),
      { method: 'POST', encType: 'application/json' },
    );
    setEditing(false);
  };

  // Read mode — click wrapper to enter edit
  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={!canEdit}
        data-test={`inline-field-${field.key}`}
        className={cn(
          'group relative flex w-full min-w-0 items-center justify-between gap-2 rounded-md py-0.5 text-left text-base',
          canEdit &&
            'hover:bg-muted/60 -mx-2 cursor-text px-2 transition-colors',
          !canEdit && 'cursor-default',
        )}
      >
        <span
          className={cn(
            isEmpty ? 'text-muted-foreground/40' : 'text-foreground',
            field.type === 'date' && !isEmpty && 'flex items-center gap-1.5',
          )}
        >
          {field.type === 'date' && !isEmpty && (
            <Calendar className="text-muted-foreground h-4 w-4" />
          )}
          {displayValue}
        </span>
      </button>
    );
  }

  // Edit mode
  return (
    <div
      className="flex items-start gap-1"
      data-test={`inline-field-${field.key}-editor`}
    >
      <InlineEditor
        field={field}
        value={draft}
        onChange={setDraft}
        onSave={save}
        onCancel={cancel}
        fkOptions={fkOptions}
        comboboxOptions={comboboxOptions}
        disabled={submitting}
      />
      <div className="flex shrink-0 items-center gap-1 pt-0.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 w-8 rounded-full p-0"
          onClick={save}
          disabled={submitting}
          aria-label="Save"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 rounded-full p-0"
          onClick={cancel}
          disabled={submitting}
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface InlineEditorProps {
  field: FormFieldConfig;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  fkOptions: Array<{ value: string; label: string }>;
  comboboxOptions: string[];
  disabled: boolean;
}

function InlineEditor({
  field,
  value,
  onChange,
  onSave,
  onCancel,
  fkOptions,
  comboboxOptions,
  disabled,
}: InlineEditorProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && field.type !== 'textarea' && !e.shiftKey) {
      e.preventDefault();
      onSave();
    }
  };

  if (field.type === 'textarea') {
    return (
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={3}
        className="min-w-0 flex-1"
      />
    );
  }

  if (field.type === 'boolean') {
    const bool = value === true;
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2 py-1">
        <input
          type="checkbox"
          checked={bool}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4"
        />
        <span className="text-sm">{bool ? 'Yes' : 'No'}</span>
      </div>
    );
  }

  if (field.type === 'select' || field.type === 'radio') {
    return (
      <Select
        value={String(value)}
        onValueChange={(v) => {
          onChange(v);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 min-w-0 flex-1 text-sm">
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === 'fk') {
    return (
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(v)}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 min-w-0 flex-1 text-sm">
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {fkOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === 'combobox') {
    return (
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(v)}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 min-w-0 flex-1 text-sm">
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {comboboxOptions.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // text / number / date
  return (
    <Input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={
        field.type === 'number'
          ? 'number'
          : field.type === 'date'
            ? 'date'
            : 'text'
      }
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className="h-9 min-w-0 flex-1"
    />
  );
}
