import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const hrEmployeeReviewSchema = z.object({
  hr_employee_id: z.string().min(1, 'Employee is required'),
  review_year: z.number().min(2020).max(2100),
  review_quarter: z.number().min(1).max(4),
  productivity: z.number().min(1).max(3),
  attendance: z.number().min(1).max(3),
  quality: z.number().min(1).max(3),
  engagement: z.number().min(1).max(3),
  notes: z.string().optional(),
  lead_id: z.string().optional(),
  is_locked: z.boolean().default(false),
});

export const hrEmployeeReviewConfig: CrudModuleConfig<
  typeof hrEmployeeReviewSchema
> = {
  tableName: 'hr_employee_review',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'hr_employee_review',
    detail: 'hr_employee_review',
  },

  // Joined display fields via postgrest embeds. flattenRow turns
  // `subject.preferred_name` -> `subject_preferred_name`, etc.
  // hr_department.id IS the display string ('GH', 'Corp', ...) per the
  // 5dfb5f5 slug-indirection drop, so no nested embed is needed —
  // hr_department_id is already human-readable. quarter_label is
  // synthesized in the list-view colDef via valueGetter.
  select: [
    '*',
    'subject:hr_employee!hr_employee_id(preferred_name,profile_photo_url,hr_department_id,start_date)',
    'lead:hr_employee!lead_id(preferred_name)',
  ].join(', '),

  columns: [
    // Sortable flags only on REAL base-table columns. Embed-derived keys
    // can't be sorted via PostgREST without foreignTable order syntax.
    { key: 'subject_preferred_name', label: 'Employee' },
    { key: 'subject_hr_department_id', label: 'Department' },
    {
      key: 'subject_start_date',
      label: 'Start Date',
      type: 'date',
      priority: 'low',
    },
    { key: 'review_year', label: 'Year', type: 'number', sortable: true },
    {
      key: 'review_quarter',
      label: 'Quarter',
      type: 'number',
      sortable: true,
    },
    {
      key: 'productivity',
      label: 'Productivity',
      type: 'number',
      sortable: true,
    },
    {
      key: 'attendance',
      label: 'Attendance',
      type: 'number',
      sortable: true,
    },
    { key: 'quality', label: 'Quality', type: 'number', sortable: true },
    {
      key: 'engagement',
      label: 'Engagement',
      type: 'number',
      sortable: true,
    },
    { key: 'average', label: 'Average', type: 'number', sortable: true },
    { key: 'notes', label: 'Notes', priority: 'low' },
    { key: 'lead_preferred_name', label: 'Lead', priority: 'low' },
    { key: 'is_locked', label: 'Locked', type: 'boolean', priority: 'low' },
  ],

  // Only real base-table text columns are searchable via PostgREST .or().
  search: {
    columns: ['notes'],
    placeholder: 'Search reviews...',
  },

  formFields: [
    {
      key: 'hr_employee_id',
      label: 'Employee',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumn: 'preferred_name',
      required: true,
    },
    { key: 'review_year', label: 'Year', type: 'number', required: true },
    {
      key: 'review_quarter',
      label: 'Quarter',
      type: 'select',
      options: [
        { value: '1', label: 'Q1' },
        { value: '2', label: 'Q2' },
        { value: '3', label: 'Q3' },
        { value: '4', label: 'Q4' },
      ],
      required: true,
    },
    {
      key: 'productivity',
      label: 'Productivity',
      type: 'select',
      options: [
        { value: '1', label: '1 - Below' },
        { value: '2', label: '2 - Meets' },
        { value: '3', label: '3 - Exceeds' },
      ],
      required: true,
    },
    {
      key: 'attendance',
      label: 'Attendance',
      type: 'select',
      options: [
        { value: '1', label: '1 - Below' },
        { value: '2', label: '2 - Meets' },
        { value: '3', label: '3 - Exceeds' },
      ],
      required: true,
    },
    {
      key: 'quality',
      label: 'Quality',
      type: 'select',
      options: [
        { value: '1', label: '1 - Below' },
        { value: '2', label: '2 - Meets' },
        { value: '3', label: '3 - Exceeds' },
      ],
      required: true,
    },
    {
      key: 'engagement',
      label: 'Engagement',
      type: 'select',
      options: [
        { value: '1', label: '1 - Below' },
        { value: '2', label: '2 - Meets' },
        { value: '3', label: '3 - Exceeds' },
      ],
      required: true,
    },
    { key: 'notes', label: 'Notes', type: 'textarea' },
    {
      key: 'lead_id',
      label: 'Review Lead',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumn: 'preferred_name',
    },
    { key: 'is_locked', label: 'Locked', type: 'boolean' },
  ],

  schema: hrEmployeeReviewSchema,

  viewType: { list: 'custom' },
  customViews: {
    list: () => import('~/components/ag-grid/employee-review-list-view'),
  },
  noPagination: true,
};
