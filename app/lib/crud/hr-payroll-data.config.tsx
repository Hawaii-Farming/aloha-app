import type { ColDef, ColGroupDef } from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { z } from 'zod';

import { DatePillRenderer } from '~/components/ag-grid/cell-renderers/date-pill-renderer';
import {
  CurrencyRenderer,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import type { CrudModuleConfig } from '~/lib/crud/types';

function EmployeeInfoRenderer(props: CustomCellRendererProps) {
  const data = props.data as Record<string, unknown> | undefined;
  if (!data) return null;
  const name = String(data.employee_name ?? '');
  const dept = data.department_name ? String(data.department_name) : '';
  const wa = data.work_authorization_name
    ? String(data.work_authorization_name)
    : '';

  return (
    <div className="flex h-full items-center gap-2">
      <div className="flex flex-col justify-center leading-tight">
        <span className="text-sm font-medium">{name}</span>
        <div className="flex items-center gap-1.5">
          {dept && (
            <span className="text-muted-foreground text-xs">{dept}</span>
          )}
          {wa && (
            <span className="inline-flex items-center rounded bg-blue-500/10 px-1 py-0 text-[10px] font-medium text-blue-600 dark:text-blue-400">
              {wa}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const schema = z.object({});

const agGridColDefs: (ColDef | ColGroupDef)[] = [
  // Employee pinned group
  {
    headerName: '',
    marryChildren: true,
    children: [
      {
        field: 'employee_name',
        headerName: 'Employee',
        cellRenderer: EmployeeInfoRenderer,
        sortable: true,
        filter: true,
        minWidth: 240,
        pinned: 'left',
      },
    ],
  } as ColGroupDef,
  // Employee Info group (remaining fields)
  {
    headerName: 'Employee Info',
    children: [
      { field: 'pay_structure', headerName: 'Pay Structure', filter: true },
      {
        field: 'hourly_rate',
        headerName: 'Hourly Rate',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
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
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'overtime_pay',
        headerName: 'Overtime',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'holiday_pay',
        headerName: 'Holiday',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'pto_pay',
        headerName: 'PTO',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'sick_pay',
        headerName: 'Sick',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'funeral_pay',
        headerName: 'Funeral',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'other_pay',
        headerName: 'Other',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'bonus_pay',
        headerName: 'Bonus',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'auto_allowance',
        headerName: 'Auto Allow',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'per_diem',
        headerName: 'Per Diem',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'salary',
        headerName: 'Salary',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'gross_wage',
        headerName: 'Gross Wage',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
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
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'sit',
        headerName: 'SIT',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'social_security',
        headerName: 'SS',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'medicare',
        headerName: 'Medicare',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'comp_plus',
        headerName: 'Comp Plus',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'hds_dental',
        headerName: 'HDS Dental',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'pre_tax_401k',
        headerName: '401k',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'auto_deduction',
        headerName: 'Auto Ded',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'child_support',
        headerName: 'Child Supp',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'program_fees',
        headerName: 'Program Fees',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'net_pay',
        headerName: 'Net Pay',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
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
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'other_tax',
        headerName: 'Other Tax',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'workers_compensation',
        headerName: 'Workers Comp',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'health_benefits',
        headerName: 'Health',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'other_health_charges',
        headerName: 'Other Health',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'admin_fees',
        headerName: 'Admin Fees',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'hawaii_get',
        headerName: 'HI GET',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'other_charges',
        headerName: 'Other',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'tdi',
        headerName: 'TDI',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
      },
      {
        field: 'total_cost',
        headerName: 'Total Cost',
        type: 'numericColumn',
        cellRenderer: CurrencyRenderer,
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
    { key: 'employee_name', label: 'Employee', sortable: true },
    { key: 'department_name', label: 'Department', sortable: true },
    { key: 'check_date', label: 'Check Date', type: 'date', sortable: true },
    { key: 'gross_wage', label: 'Gross Wage', type: 'number' },
    { key: 'net_pay', label: 'Net Pay', type: 'number' },
    { key: 'total_cost', label: 'Total Cost', type: 'number' },
  ],

  search: {
    columns: ['employee_name', 'department_name'],
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
  noDetailRow: true,
};
