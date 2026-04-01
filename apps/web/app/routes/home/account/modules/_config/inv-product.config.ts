import { z } from 'zod';

import type { CrudModuleConfig } from '@aloha/crud/types';

const invProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Quantity must be >= 0').optional(),
  unit_price: z.coerce.number().min(0, 'Price must be >= 0').optional(),
  purchase_date: z.string().optional(),
  is_active: z.boolean().default(true),
  category: z.string().min(1, 'Category is required'),
  department_id: z.string().optional(),
});

export const invProductConfig: CrudModuleConfig<typeof invProductSchema> = {
  tableName: 'inv_product',
  pkType: 'uuid',
  pkColumn: 'id',
  orgScoped: true,

  views: {
    list: 'inv_product',
    detail: 'inv_product',
  },

  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'quantity', label: 'Quantity', sortable: true, type: 'number' },
    {
      key: 'unit_price',
      label: 'Unit Price',
      sortable: true,
      type: 'number',
    },
    { key: 'status', label: 'Status', type: 'workflow' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
    {
      key: 'purchase_date',
      label: 'Purchase Date',
      sortable: true,
      type: 'date',
    },
  ],

  search: {
    columns: ['name', 'description'],
    placeholder: 'Search products...',
  },

  filters: [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: ['Equipment', 'Supplies', 'Tools', 'Seeds'],
    },
    { key: 'is_active', label: 'Active', type: 'boolean' },
  ],

  formFields: [
    { key: 'name', label: 'Product Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'unit_price', label: 'Unit Price', type: 'number' },
    { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    { key: 'is_active', label: 'Active', type: 'boolean' },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: ['Equipment', 'Supplies', 'Tools', 'Seeds'],
    },
    {
      key: 'department_id',
      label: 'Department',
      type: 'fk',
      fkTable: 'hr_department',
      fkLabelColumn: 'name',
    },
  ],

  workflow: {
    statusColumn: 'status',
    states: {
      draft: { label: 'Draft', color: 'secondary' },
      active: { label: 'Active', color: 'success' },
      maintenance: { label: 'Maintenance', color: 'warning' },
      retired: { label: 'Retired', color: 'destructive' },
    },
    transitions: {
      draft: ['active'],
      active: ['maintenance', 'retired'],
      maintenance: ['active', 'retired'],
      retired: [],
    },
    transitionFields: {
      active: { activated_at: 'now', activated_by: 'currentEmployee' },
      retired: { retired_at: 'now', retired_by: 'currentEmployee' },
    },
  },

  schema: invProductSchema,
};
