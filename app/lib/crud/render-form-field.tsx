import type { Control, FieldValues, Path } from 'react-hook-form';

import { CreatableCombobox } from '@aloha/ui/creatable-combobox';
import { FkCombobox } from '@aloha/ui/fk-combobox';
import {
  FormBooleanField,
  FormDateField,
  FormDateTimeField,
  FormNumberField,
  FormRadioField,
  FormSelectField,
  FormTextField,
  FormTextareaField,
} from '@aloha/ui/form-fields';

import { PtoAllocationField } from '~/components/crud/pto-allocation-field';
import type { FormFieldConfig } from '~/lib/crud/types';

interface RenderFormFieldParams {
  field: FormFieldConfig;
  control: Control<FieldValues>;
  mode: 'create' | 'edit';
  pkColumn: string;
  fkOptions?: Record<string, Array<{ value: string; label: string }>>;
  comboboxOptions?: Record<string, string[]>;
}

export function renderFormField({
  field,
  control,
  mode,
  pkColumn,
  fkOptions,
  comboboxOptions,
}: RenderFormFieldParams): React.ReactNode | null {
  if (mode === 'create' && field.showOnCreate === false) {
    return null;
  }

  if (mode === 'edit' && field.showOnEdit === false) {
    return null;
  }

  const isPk = field.key === pkColumn;
  const name = field.key as Path<FieldValues>;

  switch (field.type) {
    case 'text':
      return (
        <FormTextField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
          disabled={isPk && mode === 'edit'}
          description={
            isPk && mode === 'edit'
              ? 'Primary key cannot be changed'
              : undefined
          }
        />
      );

    case 'textarea':
      return (
        <FormTextareaField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
        />
      );

    case 'number':
      return (
        <FormNumberField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
        />
      );

    case 'date':
      return (
        <FormDateField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
          defaultMonth={
            field.pickerDefaultMonth === 'today' ? new Date() : undefined
          }
          endMonth={
            field.allowFutureDates
              ? new Date(new Date().getFullYear() + 10, 11, 31)
              : undefined
          }
        />
      );

    case 'datetime':
      return (
        <FormDateTimeField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
        />
      );

    case 'boolean':
      return (
        <FormBooleanField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
        />
      );

    case 'radio':
      return (
        <FormRadioField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
          options={(field.options ?? []).map((o) =>
            typeof o === 'string' ? { value: o, label: o } : o,
          )}
        />
      );

    case 'select':
      return (
        <FormSelectField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
          options={(field.options ?? []).map((o) =>
            typeof o === 'string' ? { value: o, label: o } : o,
          )}
        />
      );

    case 'combobox':
      return (
        <CreatableCombobox
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
          options={comboboxOptions?.[field.key] ?? []}
        />
      );

    case 'fk':
      return (
        <FkCombobox
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          required={field.required}
          options={fkOptions?.[field.key] ?? []}
        />
      );

    case 'pto-allocation':
      return <PtoAllocationField key={field.key} label={field.label} />;

    default:
      return null;
  }
}
