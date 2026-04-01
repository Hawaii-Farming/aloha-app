import type { Control, FieldValues, Path } from 'react-hook-form';

import type { FormFieldConfig } from '@aloha/crud/types';
import { FkCombobox } from '@aloha/ui/fk-combobox';
import {
  FormBooleanField,
  FormDateField,
  FormNumberField,
  FormSelectField,
  FormTextField,
  FormTextareaField,
} from '@aloha/ui/form-fields';

interface RenderFormFieldParams {
  field: FormFieldConfig;
  control: Control<FieldValues>;
  mode: 'create' | 'edit';
  pkColumn: string;
  fkOptions?: Record<string, Array<{ value: string; label: string }>>;
}

export function renderFormField({
  field,
  control,
  mode,
  pkColumn,
  fkOptions,
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
        />
      );

    case 'number':
      return (
        <FormNumberField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
        />
      );

    case 'date':
      return (
        <FormDateField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
        />
      );

    case 'boolean':
      return (
        <FormBooleanField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
        />
      );

    case 'select':
      return (
        <FormSelectField
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
        />
      );

    case 'fk':
      return (
        <FkCombobox
          key={field.key}
          control={control}
          name={name}
          label={field.label}
          options={fkOptions?.[field.key] ?? []}
        />
      );

    default:
      return null;
  }
}
