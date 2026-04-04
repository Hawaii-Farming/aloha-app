import type { z } from 'zod';

type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'workflow'
  | 'badge';

type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'fk';

type WorkflowColor =
  | 'default'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'secondary';

export interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  type?: ColumnType;
  /** Custom render hint (e.g. 'full_name' concatenates first_name + last_name) */
  render?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'boolean' | 'date-range';
  options?: string[];
}

export interface SearchConfig {
  columns: string[];
  placeholder: string;
}

export interface FormFieldConfig {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  showOnCreate?: boolean;
  showOnEdit?: boolean;
  /** For type='fk': table to query for options */
  fkTable?: string;
  /** For type='fk': column to use as display label */
  fkLabelColumn?: string;
  /** For type='select': allowed values */
  options?: Array<string | { value: string; label: string }>;
}

export interface WorkflowStateConfig {
  label: string;
  color: WorkflowColor;
}

export interface WorkflowTransitionFields {
  [field: string]: 'now' | 'currentEmployee';
}

export interface WorkflowConfig {
  statusColumn: string;
  states: Record<string, WorkflowStateConfig>;
  transitions: Record<string, string[]>;
  transitionFields?: Record<string, WorkflowTransitionFields>;
}

export interface CrudModuleConfig<TSchema extends z.ZodType = z.ZodType> {
  tableName: string;
  pkType: 'text' | 'uuid';
  pkColumn?: string;
  orgScoped: boolean;
  views: {
    list: string;
    detail: string;
  };
  columns: ColumnConfig[];
  search?: SearchConfig;
  filters?: FilterConfig[];
  formFields: FormFieldConfig[];
  workflow?: WorkflowConfig;
  schema: TSchema;
}
