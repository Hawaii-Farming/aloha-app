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

  columns: [
    { key: 'full_name', label: 'Employee', sortable: true },
    { key: 'department_name', label: 'Department', sortable: true },
    { key: 'start_date', label: 'Start Date', type: 'date', priority: 'low' },
    { key: 'quarter_label', label: 'Quarter', sortable: true },
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
    { key: 'lead_name', label: 'Lead', sortable: true, priority: 'low' },
    { key: 'is_locked', label: 'Locked', type: 'boolean', priority: 'low' },
  ],

  search: {
    columns: ['full_name', 'department_name'],
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
