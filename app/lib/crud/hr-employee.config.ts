import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const hrEmployeeSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    preferred_name: z.string().optional(),
    gender: z.string().optional(),
    date_of_birth: z.string().optional(),
    ethnicity: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    company_email: z.string().optional(),
    hr_department_id: z.string().optional(),
    sys_access_level_id: z.string().min(1, 'Access level is required'),
    team_lead_id: z.string().optional(),
    compensation_manager_id: z.string().optional(),
    hr_work_authorization_id: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    payroll_id: z.string().optional(),
    pay_structure: z.string().optional(),
    overtime_threshold: z.union([z.string(), z.number()]).optional(),
    wc: z.string().optional(),
    payroll_processor: z.string().optional(),
    pay_delivery_method: z.string().optional(),
    housing_id: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const wa = val.hr_work_authorization_id;
    const requiresHousing = !!wa && wa !== 'Local' && wa !== '1099';
    if (requiresHousing && !val.housing_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['housing_id'],
        message: 'Housing is required for this work authorization',
      });
    }
  });

export const hrEmployeeConfig: CrudModuleConfig<typeof hrEmployeeSchema> = {
  tableName: 'hr_employee',
  pkType: 'text',
  pkColumn: 'id',
  orgScoped: true,

  generatePk: (data) => {
    const last = String(data.last_name ?? '')
      .toLowerCase()
      .replace(/\s+/g, '_');
    const first = String(data.first_name ?? '')
      .toLowerCase()
      .replace(/\s+/g, '_');
    return `${last}_${first}`;
  },

  views: {
    list: 'hr_employee',
    detail: 'hr_employee',
  },

  select: [
    '*',
    'hr_department:hr_department!hr_department_id(name:id)',
    'hr_work_authorization:hr_work_authorization!hr_work_authorization_id(name:id)',
    'housing:org_site_housing!housing_id(name:id)',
  ].join(', '),

  selfJoins: {
    compensation_manager_id: 'preferred_name',
    team_lead_id: 'preferred_name',
  },

  columns: [
    {
      key: 'last_name',
      label: 'Employee',
      sortable: true,
      render: 'full_name',
    },
    { key: 'preferred_name', label: 'Alias', sortable: true },
    {
      key: 'hr_department_name',
      label: 'Department',
      sortable: true,
      render: 'badge',
    },
    {
      key: 'hr_work_authorization_name',
      label: 'Work Auth',
      sortable: true,
      render: 'badge',
    },
    { key: 'wc', label: 'WC', sortable: true },
    { key: 'gender', label: 'Gender', sortable: true },
    { key: 'compensation_manager_id_preferred_name', label: 'Manager' },
    { key: 'team_lead_id_preferred_name', label: 'Team Lead' },
    { key: 'overtime_threshold', label: 'OT Threshold' },
    {
      key: 'pay_structure',
      label: 'Pay Structure',
      render: 'badge',
      priority: 'low',
    },
    { key: 'payroll_id', label: 'Payroll ID', render: 'code', priority: 'low' },
    {
      key: 'payroll_processor',
      label: 'Payroll Processor',
      render: 'badge',
      priority: 'low',
    },
    {
      key: 'pay_delivery_method',
      label: 'Pay Delivery Method',
      render: 'badge',
      priority: 'low',
    },
    { key: 'housing_site_name', label: 'Housing', priority: 'low' },
    {
      key: 'company_email',
      label: 'Company Email',
      render: 'email',
      priority: 'low',
    },
    {
      key: 'date_of_birth',
      label: 'DOB',
      type: 'date',
      sortable: true,
      priority: 'low',
    },
    { key: 'phone', label: 'Phone', render: 'phone', priority: 'low' },
    { key: 'email', label: 'Email', render: 'email', priority: 'low' },
  ],

  search: {
    columns: ['first_name', 'last_name', 'company_email', 'email', 'phone'],
    placeholder: 'Search employees...',
  },

  filters: [],

  formFields: [
    // --- Personal ---
    {
      key: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true,
      section: 'Personal',
    },
    { key: 'last_name', label: 'Last Name', type: 'text', required: true },
    { key: 'preferred_name', label: 'Alias', type: 'text' },
    { key: 'ethnicity', label: 'Ethnicity', type: 'combobox' },
    {
      key: 'gender',
      label: 'Gender',
      type: 'radio',
      options: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
      ],
      defaultValue: 'Female',
    },
    { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },

    // --- Contact ---
    { key: 'phone', label: 'Phone', type: 'text', section: 'Contact' },
    { key: 'email', label: 'Personal Email', type: 'text' },

    // --- App Access & Role ---
    {
      key: 'company_email',
      label: 'Company Email',
      type: 'text',
      section: 'App Access',
    },
    {
      key: 'sys_access_level_id',
      label: 'Access Level',
      type: 'fk',
      fkTable: 'sys_access_level',
      fkLabelColumn: 'id',
      fkOrgScoped: false,
      fkOrderColumn: 'level',
      required: true,
    },
    {
      key: 'hr_department_id',
      label: 'Department',
      type: 'fk',
      fkTable: 'hr_department',
      fkLabelColumn: 'id',
    },
    {
      key: 'hr_work_authorization_id',
      label: 'Work Authorization',
      type: 'fk',
      fkTable: 'hr_work_authorization',
      fkLabelColumn: 'id',
    },
    {
      key: 'compensation_manager_id',
      label: 'Manager',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumn: 'preferred_name',
      fkFilter: { sys_access_level_id: 'Manager' },
    },
    {
      key: 'team_lead_id',
      label: 'Team Lead',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumn: 'preferred_name',
      fkFilter: { sys_access_level_id: 'Team Lead' },
    },

    // --- Employment ---
    {
      key: 'start_date',
      label: 'Start Date',
      type: 'date',
      section: 'Employment',
    },
    { key: 'end_date', label: 'End Date', type: 'date' },

    // --- Compensation ---
    {
      key: 'pay_structure',
      label: 'Pay Structure',
      type: 'radio',
      options: [
        { value: 'Hourly', label: 'Hourly' },
        { value: 'Salary', label: 'Salary' },
      ],
      section: 'Compensation',
      defaultValue: 'Hourly',
    },
    {
      key: 'overtime_threshold',
      label: 'OT Threshold',
      type: 'combobox',
    },
    { key: 'wc', label: 'WC Code', type: 'combobox', defaultValue: '0008' },
    { key: 'payroll_id', label: 'Payroll ID', type: 'text' },
    {
      key: 'payroll_processor',
      label: 'Payroll Processor',
      type: 'combobox',
      defaultValue: 'HRB',
    },
    {
      key: 'pay_delivery_method',
      label: 'Pay Check Delivery',
      type: 'combobox',
      defaultValue: 'Electronic',
    },
    {
      key: 'housing_id',
      label: 'Housing',
      type: 'fk',
      fkTable: 'org_site_housing',
      fkLabelColumn: 'id',
    },
  ],

  viewType: {
    list: 'agGrid',
  },

  noPagination: true,
  schema: hrEmployeeSchema,
};
