import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { CustomCellRendererProps } from 'ag-grid-react';
import { z } from 'zod';

import { DatePillRenderer } from '~/components/ag-grid/cell-renderers/pill-renderer';
import type { CrudModuleConfig } from '~/lib/crud/types';

// Show decimals only when the value actually has them: 8 → "8",
// 8.5 → "8.5", 8.25 → "8.25". Two-decimal cap matches payroll rounding.
function smartDecimal(value: number): string {
  return Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function HoursRenderer(props: CustomCellRendererProps) {
  const value = props.value as number | null;
  if (value == null) return null;
  if (value === 0) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-end font-mono">
        —
      </div>
    );
  }
  const formatted = smartDecimal(value);
  const isNeg = value < 0;
  return (
    <div className="flex h-full w-full items-center justify-end font-mono">
      {isNeg ? `-${formatted}` : formatted}
    </div>
  );
}

function BoolTextRenderer(props: CustomCellRendererProps) {
  const value = props.value as boolean | null;
  if (value == null) return null;
  return <span>{value ? 'True' : 'False'}</span>;
}

function CurrencyRenderer(props: CustomCellRendererProps) {
  const value = props.value as number | null;
  if (value == null) return null;
  if (value === 0) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-end font-mono">
        —
      </div>
    );
  }
  const formatted = smartDecimal(value);
  const isNeg = value < 0;
  return (
    <div className="flex h-full w-full items-center justify-end font-mono">
      {isNeg ? `-${formatted}` : formatted}
    </div>
  );
}

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
  cellRenderer: HoursRenderer,
});

const rateFormatter = (params: ValueFormatterParams): string => {
  const value = params.value as number | null;
  if (value == null) return '';
  const n = Number(value);
  if (n === 0) return '—';
  return smartDecimal(n);
};

const wholeNumberFormatter = (params: ValueFormatterParams): string => {
  const value = params.value as number | null;
  if (value == null) return '';
  return smartDecimal(Number(value));
};

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
  {
    field: 'hourly_rate',
    headerName: 'Hourly Rate',
    type: 'numericColumn',
    valueFormatter: rateFormatter,
  },
  {
    field: 'overtime_threshold',
    headerName: 'OT Threshold',
    type: 'numericColumn',
    valueFormatter: wholeNumberFormatter,
  },
  { field: 'payroll_id', headerName: 'Payroll ID', cellClass: 'font-mono' },
  {
    field: 'is_standard',
    headerName: 'Is Standard',
    cellRenderer: BoolTextRenderer,
    cellDataType: 'text',
    maxWidth: 110,
  },
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
  {
    field: 'invoice_number',
    headerName: 'Invoice #',
    type: 'numericColumn',
    cellClass: 'font-mono text-right',
  },
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

  // hr_payroll_data_secure is a SECURITY-DEFINER-helper-gated wrapper
  // over hr_payroll: row scope per access_level, $ columns NULL for
  // Team Lead. Defined in aloha-data-migrations migration
  // 20260501120100_hr_payroll_rbac_views.sql. Not yet in
  // database.types — the sub-module loader uses queryUntypedView so
  // this is fine.
  views: {
    list: 'hr_payroll_data_secure',
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

  // Detail page mirrors the list columns so a row click opens a
  // read-only facts view of the same payroll record. All fields are
  // hidden from create/edit since payroll rows are ingested, not
  // hand-edited.
  formFields: [
    {
      key: 'employee_name',
      label: 'Employee',
      type: 'text',
      section: 'Identity',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'hr_department_id',
      label: 'Department',
      type: 'text',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'hr_work_authorization_id',
      label: 'Work Auth',
      type: 'text',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'pay_structure',
      label: 'Pay Structure',
      type: 'text',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'hourly_rate',
      label: 'Hourly Rate',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'overtime_threshold',
      label: 'OT Threshold',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'payroll_id',
      label: 'Payroll ID',
      type: 'text',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'is_standard',
      label: 'Is Standard',
      type: 'boolean',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'invoice_number',
      label: 'Invoice #',
      type: 'text',
      showOnCreate: false,
      showOnEdit: false,
    },

    {
      key: 'check_date',
      label: 'Check Date',
      type: 'date',
      section: 'Period',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'pay_period_start',
      label: 'Period Start',
      type: 'date',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'pay_period_end',
      label: 'Period End',
      type: 'date',
      showOnCreate: false,
      showOnEdit: false,
    },

    {
      key: 'regular_hours',
      label: 'Regular Hrs',
      type: 'number',
      section: 'Hours',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'overtime_hours',
      label: 'OT Hrs',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'holiday_hours',
      label: 'Holiday Hrs',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'pto_hours',
      label: 'PTO Hrs',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'sick_hours',
      label: 'Sick Hrs',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'funeral_hours',
      label: 'Funeral Hrs',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'total_hours',
      label: 'Total Hrs',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'pto_hours_accrued',
      label: 'PTO Accrued',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },

    {
      key: 'regular_pay',
      label: 'Regular Pay',
      type: 'number',
      section: 'Pay',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'overtime_pay',
      label: 'OT Pay',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'holiday_pay',
      label: 'Holiday Pay',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'pto_pay',
      label: 'PTO Pay',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'sick_pay',
      label: 'Sick Pay',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'funeral_pay',
      label: 'Funeral Pay',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'other_pay',
      label: 'Other Pay',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'bonus_pay',
      label: 'Bonus Pay',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'auto_allowance',
      label: 'Auto Allow',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'per_diem',
      label: 'Per Diem',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'salary',
      label: 'Salary',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'gross_wage',
      label: 'Gross Wage',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },

    {
      key: 'fit',
      label: 'FIT',
      type: 'number',
      section: 'Taxes',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'sit',
      label: 'SIT',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'social_security',
      label: 'SS',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'medicare',
      label: 'Medicare',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },

    {
      key: 'comp_plus',
      label: 'Comp Plus',
      type: 'number',
      section: 'Deductions',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'hds_dental',
      label: 'HDS Dental',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'pre_tax_401k',
      label: '401k',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'auto_deduction',
      label: 'Auto Ded',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'child_support',
      label: 'Child Supp',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'program_fees',
      label: 'Program Fees',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },

    {
      key: 'net_pay',
      label: 'Net Pay',
      type: 'number',
      section: 'Costs',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'labor_tax',
      label: 'Labor Tax',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'other_tax',
      label: 'Other Tax',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'workers_compensation',
      label: 'Workers Comp',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'health_benefits',
      label: 'Health',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'other_health_charges',
      label: 'Other Health',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'admin_fees',
      label: 'Admin Fees',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'hawaii_get',
      label: 'HI GET',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'other_charges',
      label: 'Other Charges',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'tdi',
      label: 'TDI',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
    {
      key: 'total_cost',
      label: 'Total Cost',
      type: 'number',
      showOnCreate: false,
      showOnEdit: false,
    },
  ],
  schema,
  agGridColDefs,

  viewType: { list: 'custom' },
  customViews: {
    list: () => import('~/components/ag-grid/payroll-data-list-view'),
  },
  noPagination: true,
  noDetailRow: true,
};
