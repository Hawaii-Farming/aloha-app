import type { ColDef, ColGroupDef } from 'ag-grid-community';
import { z } from 'zod';

import { AvatarRenderer } from '~/components/ag-grid/cell-renderers/avatar-renderer';
import { DatePillRenderer } from '~/components/ag-grid/cell-renderers/date-pill-renderer';
import {
  currencyFormatter,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import type { CrudModuleConfig } from '~/lib/crud/types';

const schema = z.object({});

const agGridColDefs: (ColDef | ColGroupDef)[] = [
  // Avatar column (not in a group)
  {
    headerName: '',
    field: 'profile_photo_url',
    cellRenderer: AvatarRenderer,
    maxWidth: 60,
    minWidth: 60,
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
    pinned: 'left',
    lockPosition: true,
  },
  // Employee Info group
  {
    headerName: 'Employee Info',
    children: [
      {
        field: 'full_name',
        headerName: 'Employee',
        sortable: true,
        filter: true,
        minWidth: 180,
        pinned: 'left',
      },
      {
        field: 'department_name',
        headerName: 'Department',
        sortable: true,
        filter: true,
      },
      {
        field: 'work_authorization_name',
        headerName: 'Work Auth',
        sortable: true,
        filter: true,
      },
      { field: 'pay_structure', headerName: 'Pay Structure', filter: true },
      {
        field: 'hourly_rate',
        headerName: 'Hourly Rate',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'overtime_threshold',
        headerName: 'OT Threshold',
        type: 'numericColumn',
        valueFormatter: hoursFormatter,
      },
    ],
  },
  // Pay Period group
  {
    headerName: 'Pay Period',
    children: [
      { field: 'payroll_id', headerName: 'Payroll ID', filter: true },
      { field: 'payroll_processor', headerName: 'Processor', filter: true },
      {
        field: 'check_date',
        headerName: 'Check Date',
        cellRenderer: DatePillRenderer,
        sortable: true,
      },
      {
        field: 'pay_period_start',
        headerName: 'Period Start',
        cellRenderer: DatePillRenderer,
      },
      {
        field: 'pay_period_end',
        headerName: 'Period End',
        cellRenderer: DatePillRenderer,
      },
      { field: 'invoice_number', headerName: 'Invoice #', filter: true },
    ],
  },
  // Hours group
  {
    headerName: 'Hours',
    children: [
      {
        field: 'regular_hours',
        headerName: 'Regular',
        type: 'numericColumn',
        valueFormatter: hoursFormatter,
      },
      {
        field: 'overtime_hours',
        headerName: 'Overtime',
        type: 'numericColumn',
        valueFormatter: hoursFormatter,
      },
      {
        field: 'holiday_hours',
        headerName: 'Holiday',
        type: 'numericColumn',
        valueFormatter: hoursFormatter,
      },
      {
        field: 'pto_hours',
        headerName: 'PTO',
        type: 'numericColumn',
        valueFormatter: hoursFormatter,
      },
      {
        field: 'sick_hours',
        headerName: 'Sick',
        type: 'numericColumn',
        valueFormatter: hoursFormatter,
      },
      {
        field: 'funeral_hours',
        headerName: 'Funeral',
        type: 'numericColumn',
        valueFormatter: hoursFormatter,
      },
      {
        field: 'total_hours',
        headerName: 'Total',
        type: 'numericColumn',
        valueFormatter: hoursFormatter,
      },
      {
        field: 'pto_hours_accrued',
        headerName: 'PTO Accrued',
        type: 'numericColumn',
        valueFormatter: hoursFormatter,
      },
    ],
  },
  // Earnings group
  {
    headerName: 'Earnings',
    children: [
      {
        field: 'regular_pay',
        headerName: 'Regular',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'overtime_pay',
        headerName: 'Overtime',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'holiday_pay',
        headerName: 'Holiday',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'pto_pay',
        headerName: 'PTO',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'sick_pay',
        headerName: 'Sick',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'funeral_pay',
        headerName: 'Funeral',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'other_pay',
        headerName: 'Other',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'bonus_pay',
        headerName: 'Bonus',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'auto_allowance',
        headerName: 'Auto Allow',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'per_diem',
        headerName: 'Per Diem',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'salary',
        headerName: 'Salary',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'gross_wage',
        headerName: 'Gross Wage',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
    ],
  },
  // Deductions group
  {
    headerName: 'Deductions',
    children: [
      {
        field: 'fit',
        headerName: 'FIT',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'sit',
        headerName: 'SIT',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'social_security',
        headerName: 'SS',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'medicare',
        headerName: 'Medicare',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'comp_plus',
        headerName: 'Comp Plus',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'hds_dental',
        headerName: 'HDS Dental',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'pre_tax_401k',
        headerName: '401k',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'auto_deduction',
        headerName: 'Auto Ded',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'child_support',
        headerName: 'Child Supp',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'program_fees',
        headerName: 'Program Fees',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'net_pay',
        headerName: 'Net Pay',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
    ],
  },
  // Employer Costs group
  {
    headerName: 'Employer Costs',
    children: [
      {
        field: 'labor_tax',
        headerName: 'Labor Tax',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'other_tax',
        headerName: 'Other Tax',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'workers_compensation',
        headerName: 'Workers Comp',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'health_benefits',
        headerName: 'Health',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'other_health_charges',
        headerName: 'Other Health',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'admin_fees',
        headerName: 'Admin Fees',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'hawaii_get',
        headerName: 'HI GET',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'other_charges',
        headerName: 'Other',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'tdi',
        headerName: 'TDI',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
      {
        field: 'total_cost',
        headerName: 'Total Cost',
        type: 'numericColumn',
        valueFormatter: currencyFormatter,
      },
    ],
  },
];

export const hrPayrollDataConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'hr_payroll',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'app_hr_payroll_detail',
    detail: 'hr_payroll',
  },

  columns: [
    { key: 'full_name', label: 'Employee', sortable: true },
    { key: 'department_name', label: 'Department', sortable: true },
    { key: 'check_date', label: 'Check Date', type: 'date', sortable: true },
    { key: 'gross_wage', label: 'Gross Wage', type: 'number' },
    { key: 'net_pay', label: 'Net Pay', type: 'number' },
    { key: 'total_cost', label: 'Total Cost', type: 'number' },
  ],

  search: {
    columns: ['full_name', 'department_name'],
    placeholder: 'Search payroll data...',
  },

  formFields: [],
  schema,
  agGridColDefs,

  viewType: { list: 'custom' },
  customViews: {
    list: () => import('~/components/ag-grid/ag-grid-list-view'),
  },
  noPagination: true,
};
