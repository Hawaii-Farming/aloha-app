import type { ComponentType } from 'react';

import type { z } from 'zod';

export type ListViewType =
  | 'table'
  | 'kanban'
  | 'calendar'
  | 'dashboard'
  | 'custom';

export type DetailViewType = 'card' | 'workspace' | 'custom';

export interface ListViewProps {
  data: Record<string, unknown>[];
  config: CrudModuleConfig;
  tableData: {
    data: Record<string, unknown>[];
    page: number;
    pageSize: number;
    pageCount: number;
    totalCount: number;
  };
  fkOptions: Record<string, Array<{ value: string; label: string }>>;
  comboboxOptions: Record<string, string[]>;
  subModuleDisplayName: string;
  accountSlug: string;
}

export interface DetailViewProps {
  record: Record<string, unknown>;
  config: CrudModuleConfig;
  recordId: string;
  accountSlug: string;
  moduleDisplayName: string;
  subModuleDisplayName: string;
  hasWorkflow: boolean;
  workflowConfig: WorkflowConfig | null;
  fkOptions: Record<string, Array<{ value: string; label: string }>>;
  comboboxOptions: Record<string, string[]>;
}

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
  | 'radio'
  | 'combobox'
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
  /** Column display priority. 'low' columns are hidden by default on mobile
   *  and can be toggled via the column visibility button. Defaults to 'high'. */
  priority?: 'high' | 'low';
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
  /** For type='select' or 'radio': allowed values */
  options?: Array<string | { value: string; label: string }>;
  /** Set to false for system-level FK tables that don't have org_id.
   *  Defaults to true. */
  fkOrgScoped?: boolean;
  /** Column to order FK options by. Defaults to fkLabelColumn. */
  fkOrderColumn?: string;
  /** Additional eq filters when loading FK options.
   *  e.g. { sys_access_level_id: 'manager' } */
  fkFilter?: Record<string, string>;
  /** For type='combobox': source table and column to pull distinct values from.
   *  Defaults to the config's own tableName and this field's key. */
  comboboxSource?: { table: string; column: string };
  /** Span full width in two-column form grid. Defaults to false.
   *  Auto-set to true for 'textarea' types. */
  fullWidth?: boolean;
  /** Section heading for grouping fields visually.
   *  Set on the first field of each group. */
  section?: string;
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

  /** Generate the primary key from form data. Only used when pkType is 'text'.
   *  If not provided, the PK must come from the form. */
  generatePk?: (data: Record<string, unknown>) => string;
  views: {
    list: string;
    detail: string;
  };

  /** Override the default `select('*')` with a custom select string.
   *  Supports Supabase embedded resource syntax for FK joins.
   *  Nested objects are flattened to `fkColumn_fieldName` keys. */
  select?: string;

  /** Resolve self-referential FK columns by looking up a display field
   *  from the same table. Each entry maps: fkColumn → displayField.
   *  e.g. { compensation_manager_id: 'preferred_name' } adds
   *  `compensation_manager_id_preferred_name` to each row. */
  selfJoins?: Record<string, string>;
  columns: ColumnConfig[];
  search?: SearchConfig;
  filters?: FilterConfig[];
  formFields: FormFieldConfig[];
  workflow?: WorkflowConfig;
  schema: TSchema;

  /** Controls which view component renders for list and detail pages.
   *  Omit or set to 'table'/'card' for default CRUD behavior. */
  viewType?: {
    list?: ListViewType;
    detail?: DetailViewType;
  };

  /** Lazy-loaded custom view components for viewType 'custom'. */
  customViews?: {
    list?: () => Promise<{ default: ComponentType<ListViewProps> }>;
    detail?: () => Promise<{ default: ComponentType<DetailViewProps> }>;
  };
}
