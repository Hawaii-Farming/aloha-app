import type { ColDef } from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { z } from 'zod';

import { DatePillRenderer } from '~/components/ag-grid/cell-renderers/pill-renderer';
import {
  CurrencyRenderer,
  hoursFormatter,
} from '~/components/ag-grid/payroll-formatters';
import type { CrudModuleConfig } from '~/lib/crud/types';

function EmployeeInfoRenderer(props: CustomCellRendererProps) {
  const data = props.data as Record<string, unknown> | undefined;
  if (!data) return null;
  const name = String(data.employee_name ?? '');

  return (
    <span className="flex h-full items-center truncate text-sm font-medium">
      {name}
    </span>
  );
}

const schema = z.object({});

const currency = (field: string, headerName: string): ColDef => ({
  field,
  headerName,
  type: 'numericColumn',
  cellRenderer: CurrencyRenderer,
});

const hours = (field: string, headerName: string): ColDef => ({
  field,
  headerName,
  type: 'numericColumn',
  valueFormatter: hoursFormatter,
});

const agGridColDefs: ColDef[] = [
  {
    field: 'employee_name',
    headerName: 'Employee',
    cellRenderer: EmployeeInfoRenderer,
    minWidth: 200,
    pinned: 'left',
  },
  { field: 'hr_department_id', headerName: 'Department', minWidth: 140 },
  {
    field: 'hr_work_authorization_id',
    headerName: 'Work Auth',
    minWidth: 120,
  },
  { field: 'pay_structure', headerName: 'Pay Structure' },
  currency('hourly_rate', 'Hourly Rate'),
  hours('overtime_threshold', 'OT Threshold'),
  { field: 'payroll_id', headerName: 'Payroll ID' },
  { field: 'payroll_processor', headerName: 'Processor' },
  {
    field: 'check_date',
    headerName: 'Check Date',
    cellRenderer: DatePillRenderer,
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
  { field: 'invoice_number', headerName: 'Invoice #' },
  hours('regular_hours', 'Regular Hrs'),
  hours('overtime_hours', 'OT Hrs'),
  hours('holiday_hours', 'Holiday Hrs'),
  hours('pto_hours', 'PTO Hrs'),
  hours('sick_hours', 'Sick Hrs'),
  hours('funeral_hours', 'Funeral Hrs'),
  hours('total_hours', 'Total Hrs'),
  hours('pto_hours_accrued', 'PTO Accrued'),
  currency('regular_pay', 'Regular Pay'),
  currency('overtime_pay', 'OT Pay'),
  currency('holiday_pay', 'Holiday Pay'),
  currency('pto_pay', 'PTO Pay'),
  currency('sick_pay', 'Sick Pay'),
  currency('funeral_pay', 'Funeral Pay'),
  currency('other_pay', 'Other Pay'),
  currency('bonus_pay', 'Bonus Pay'),
  currency('auto_allowance', 'Auto Allow'),
  currency('per_diem', 'Per Diem'),
  currency('salary', 'Salary'),
  currency('gross_wage', 'Gross Wage'),
  currency('fit', 'FIT'),
  currency('sit', 'SIT'),
  currency('social_security', 'SS'),
  currency('medicare', 'Medicare'),
  currency('comp_plus', 'Comp Plus'),
  currency('hds_dental', 'HDS Dental'),
  currency('pre_tax_401k', '401k'),
  currency('auto_deduction', 'Auto Ded'),
  currency('child_support', 'Child Supp'),
  currency('program_fees', 'Program Fees'),
  currency('net_pay', 'Net Pay'),
  currency('labor_tax', 'Labor Tax'),
  currency('other_tax', 'Other Tax'),
  currency('workers_compensation', 'Workers Comp'),
  currency('health_benefits', 'Health'),
  currency('other_health_charges', 'Other Health'),
  currency('admin_fees', 'Admin Fees'),
  currency('hawaii_get', 'HI GET'),
  currency('other_charges', 'Other Charges'),
  currency('tdi', 'TDI'),
  currency('total_cost', 'Total Cost'),
];

export const hrPayrollDataConfig: CrudModuleConfig<typeof schema> = {
  tableName: 'hr_payroll',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'hr_payroll',
    detail: 'hr_payroll',
  },

  // hr_payroll exposes hr_department_id and hr_work_authorization_id
  // directly; per the 5dfb5f5 slug-indirection drop, those id values
  // ARE the display strings ('GH', '1099', ...). No embed needed.

  columns: [
    { key: 'employee_name', label: 'Employee', sortable: true },
    { key: 'hr_department_id', label: 'Department' },
    { key: 'check_date', label: 'Check Date', type: 'date', sortable: true },
    { key: 'gross_wage', label: 'Gross Wage', type: 'number' },
    { key: 'net_pay', label: 'Net Pay', type: 'number' },
    { key: 'total_cost', label: 'Total Cost', type: 'number' },
  ],

  // Only real base-table text columns are searchable via PostgREST .or().
  search: {
    columns: ['employee_name'],
    placeholder: 'Search payroll data...',
  },

  formFields: [],
  schema,
  agGridColDefs,

  noRowClickNav: true,

  viewType: { list: 'custom' },
  customViews: {
    list: () => import('~/components/ag-grid/ag-grid-list-view'),
  },
  noPagination: true,
  noDetailRow: true,
};
