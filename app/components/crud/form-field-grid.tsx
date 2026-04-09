import type { Control, FieldValues } from 'react-hook-form';

import { renderFormField } from '~/lib/crud/render-form-field';
import type { FormFieldConfig } from '~/lib/crud/types';

interface FormFieldGridProps {
  fields: FormFieldConfig[];
  control: Control<FieldValues>;
  mode: 'create' | 'edit';
  pkColumn: string;
  fkOptions?: Record<string, Array<{ value: string; label: string }>>;
  comboboxOptions?: Record<string, string[]>;
}

export function FormFieldGrid({
  fields,
  control,
  mode,
  pkColumn,
  fkOptions,
  comboboxOptions,
}: FormFieldGridProps) {
  const sections: Array<{
    title: string | null;
    fields: FormFieldConfig[];
  }> = [];

  let current: (typeof sections)[number] = { title: null, fields: [] };

  for (const field of fields) {
    if (field.section) {
      if (current.fields.length > 0) {
        sections.push(current);
      }

      current = { title: field.section, fields: [field] };
    } else {
      current.fields.push(field);
    }
  }

  if (current.fields.length > 0) {
    sections.push(current);
  }

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <div key={section.title ?? sectionIndex}>
          {section.title && (
            <div className="mb-3 border-b pb-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {section.title}
              </h3>
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const isFullWidth =
                field.fullWidth ||
                field.type === 'textarea' ||
                field.type === 'fk';
              const node = renderFormField({
                field,
                control,
                mode,
                pkColumn,
                fkOptions,
                comboboxOptions,
              });

              if (!node) return null;

              return (
                <div
                  key={field.key}
                  className={isFullWidth ? 'sm:col-span-2' : ''}
                >
                  {node}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
