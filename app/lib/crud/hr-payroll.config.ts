import { z } from 'zod';

import type { CrudModuleConfig } from '~/lib/crud/types';

const hrPayrollSchema = z.object({
  hr_employee_id: z.string().min(1, 'Employee is required'),
  employee_name: z.string().min(1, 'Employee name is required'),
  payroll_id: z.string().min(1, 'Payroll ID is required'),
  payroll_processor: z.string().min(1, 'Payroll processor is required'),
  check_date: z.string().min(1, 'Check date is required'),
  pay_period_start: z.string().min(1, 'Pay period start is required'),
  pay_period_end: z.string().min(1, 'Pay period end is required'),
  regular_hours: z.number().default(0),
  overtime_hours: z.number().default(0),
  gross_wage: z.number().default(0),
  net_pay: z.number().default(0),
});

export const hrPayrollConfig: CrudModuleConfig<typeof hrPayrollSchema> = {
  tableName: 'hr_payroll',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'hr_payroll',
    detail: 'hr_payroll',
  },

  columns: [
    { key: 'employee_name', label: 'Employee', sortable: true },
    { key: 'payroll_id', label: 'Payroll ID', sortable: true, priority: 'low' },
    { key: 'check_date', label: 'Check Date', type: 'date', sortable: true },
    { key: 'pay_period_start', label: 'Period Start', type: 'date', priority: 'low' },
    { key: 'pay_period_end', label: 'Period End', type: 'date', priority: 'low' },
    { key: 'regular_hours', label: 'Reg Hours', type: 'number', priority: 'low' },
    { key: 'overtime_hours', label: 'OT Hours', type: 'number', priority: 'low' },
    { key: 'gross_wage', label: 'Gross', type: 'number', sortable: true },
    { key: 'net_pay', label: 'Net Pay', type: 'number', sortable: true },
  ],

  search: {
    columns: ['employee_name', 'payroll_id'],
    placeholder: 'Search payroll records...',
  },

  filters: [],

  formFields: [
    {
      key: 'hr_employee_id',
      label: 'Employee',
      type: 'fk',
      fkTable: 'hr_employee',
      fkLabelColumn: 'preferred_name',
      required: true,
    },
    {
      key: 'employee_name',
      label: 'Employee Name',
      type: 'text',
      required: true,
    },
    { key: 'payroll_id', label: 'Payroll ID', type: 'text', required: true },
    {
      key: 'payroll_processor',
      label: 'Payroll Processor',
      type: 'text',
      required: true,
    },
    { key: 'check_date', label: 'Check Date', type: 'date', required: true },
    {
      key: 'pay_period_start',
      label: 'Period Start',
      type: 'date',
      required: true,
    },
    {
      key: 'pay_period_end',
      label: 'Period End',
      type: 'date',
      required: true,
    },
    { key: 'regular_hours', label: 'Regular Hours', type: 'number' },
    { key: 'overtime_hours', label: 'Overtime Hours', type: 'number' },
    { key: 'gross_wage', label: 'Gross Wage', type: 'number' },
    { key: 'net_pay', label: 'Net Pay', type: 'number' },
  ],

  schema: hrPayrollSchema,
};
