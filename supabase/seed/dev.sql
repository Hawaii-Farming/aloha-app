-- Seed Data: Test data for LOCAL DEVELOPMENT ONLY
--
-- Tables are created in schemas/04-tables.sql.
-- This file only inserts test data — do not run in production.

-- ============================================================
-- Test auth user (email: test@test.com / password: password123)
-- ============================================================

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_sso_user, is_anonymous,
  confirmation_token, recovery_token, reauthentication_token,
  email_change, email_change_token_current, email_change_token_new, email_change_confirm_status,
  phone, phone_change, phone_change_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'authenticated', 'authenticated',
  'test@test.com',
  crypt('password123', gen_salt('bf', 10)),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Test User"}',
  false, false,
  '', '', '',
  '', '', '', 0,
  NULL, '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  jsonb_build_object('sub', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'email', 'test@test.com', 'email_verified', true, 'phone_verified', false),
  'email', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  now(), now(), now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- ============================================================
-- Access levels (5-tier hierarchy)
-- ============================================================

INSERT INTO public.sys_access_level (id, name, level, display_order) VALUES
  ('employee', 'Employee', 10, 1),
  ('team_lead', 'Team Lead', 20, 2),
  ('manager', 'Manager', 30, 3),
  ('admin', 'Admin', 40, 4),
  ('owner', 'Owner', 50, 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Orgs
-- ============================================================

INSERT INTO public.org (id, name) VALUES
  ('acme-farms', 'Acme Farms'),
  ('kona-coffee', 'Kona Coffee Co')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Employee records
-- ============================================================

INSERT INTO public.hr_employee (id, org_id, user_id, first_name, last_name, sys_access_level_id) VALUES
  ('emp-001', 'acme-farms', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Test', 'User', 'admin'),
  ('emp-002', 'kona-coffee', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Test', 'User', 'employee')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- System modules
-- ============================================================

INSERT INTO public.sys_module (id, name, display_order) VALUES
  ('human_resources', 'Human Resources', 1),
  ('inventory', 'Inventory', 2),
  ('operations', 'Operations', 3),
  ('growing', 'Growing', 4),
  ('food_safety', 'Food Safety', 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- System sub-modules
-- ============================================================

INSERT INTO public.sys_sub_module (id, sys_module_id, name, sys_access_level_id, display_order) VALUES
  ('employees', 'human_resources', 'Employees', 'employee', 1),
  ('departments', 'human_resources', 'Departments', 'manager', 2),
  ('time_off', 'human_resources', 'Time Off', 'employee', 3),
  ('payroll', 'human_resources', 'Payroll', 'admin', 4),
  ('products', 'inventory', 'Products', 'employee', 1),
  ('warehouses', 'inventory', 'Warehouses', 'team_lead', 2),
  ('stock_counts', 'inventory', 'Stock Counts', 'employee', 3),
  ('task_tracking', 'operations', 'Task Tracking', 'employee', 1),
  ('checklists', 'operations', 'Checklists', 'team_lead', 2),
  ('seed_batches', 'growing', 'Seed Batches', 'employee', 1),
  ('harvests', 'growing', 'Harvests', 'employee', 2),
  ('inspections', 'food_safety', 'Inspections', 'team_lead', 1),
  ('incidents', 'food_safety', 'Incidents', 'manager', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Org modules: acme-farms (all modules enabled)
-- ============================================================

INSERT INTO public.org_module (id, org_id, sys_module_id, display_name, display_order, is_enabled) VALUES
  ('acme-hr', 'acme-farms', 'human_resources', 'Human Resources', 1, true),
  ('acme-inv', 'acme-farms', 'inventory', 'Inventory', 2, true),
  ('acme-ops', 'acme-farms', 'operations', 'Operations', 3, true),
  ('acme-grow', 'acme-farms', 'growing', 'Growing', 4, true),
  ('acme-fs', 'acme-farms', 'food_safety', 'Food Safety', 5, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Org modules: kona-coffee (only HR and inventory enabled)
-- ============================================================

INSERT INTO public.org_module (id, org_id, sys_module_id, display_name, display_order, is_enabled) VALUES
  ('kona-hr', 'kona-coffee', 'human_resources', 'Human Resources', 1, true),
  ('kona-inv', 'kona-coffee', 'inventory', 'Inventory', 2, true),
  ('kona-ops', 'kona-coffee', 'operations', 'Operations', 3, false),
  ('kona-grow', 'kona-coffee', 'growing', 'Growing', 4, false),
  ('kona-fs', 'kona-coffee', 'food_safety', 'Food Safety', 5, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Org sub-modules: acme-farms (all sub-modules with default access levels)
-- ============================================================

INSERT INTO public.org_sub_module (id, org_id, sys_module_id, sys_sub_module_id, sys_access_level_id, display_name, display_order) VALUES
  ('acme-employees', 'acme-farms', 'human_resources', 'employees', 'employee', 'Employees', 1),
  ('acme-departments', 'acme-farms', 'human_resources', 'departments', 'manager', 'Departments', 2),
  ('acme-time-off', 'acme-farms', 'human_resources', 'time_off', 'employee', 'Time Off', 3),
  ('acme-payroll', 'acme-farms', 'human_resources', 'payroll', 'admin', 'Payroll', 4),
  ('acme-products', 'acme-farms', 'inventory', 'products', 'employee', 'Products', 1),
  ('acme-warehouses', 'acme-farms', 'inventory', 'warehouses', 'team_lead', 'Warehouses', 2),
  ('acme-stock-counts', 'acme-farms', 'inventory', 'stock_counts', 'employee', 'Stock Counts', 3),
  ('acme-task-tracking', 'acme-farms', 'operations', 'task_tracking', 'employee', 'Task Tracking', 1),
  ('acme-checklists', 'acme-farms', 'operations', 'checklists', 'team_lead', 'Checklists', 2),
  ('acme-seed-batches', 'acme-farms', 'growing', 'seed_batches', 'employee', 'Seed Batches', 1),
  ('acme-harvests', 'acme-farms', 'growing', 'harvests', 'employee', 'Harvests', 2),
  ('acme-inspections', 'acme-farms', 'food_safety', 'inspections', 'team_lead', 'Inspections', 1),
  ('acme-incidents', 'acme-farms', 'food_safety', 'incidents', 'manager', 'Incidents', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Org sub-modules: kona-coffee (only HR and inventory sub-modules)
-- ============================================================

INSERT INTO public.org_sub_module (id, org_id, sys_module_id, sys_sub_module_id, sys_access_level_id, display_name, display_order) VALUES
  ('kona-employees', 'kona-coffee', 'human_resources', 'employees', 'employee', 'Employees', 1),
  ('kona-departments', 'kona-coffee', 'human_resources', 'departments', 'manager', 'Departments', 2),
  ('kona-time-off', 'kona-coffee', 'human_resources', 'time_off', 'employee', 'Time Off', 3),
  ('kona-products', 'kona-coffee', 'inventory', 'products', 'employee', 'Products', 1),
  ('kona-warehouses', 'kona-coffee', 'inventory', 'warehouses', 'team_lead', 'Warehouses', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Module access: emp-001 (admin at acme-farms, all modules, full permissions)
-- ============================================================

INSERT INTO public.hr_module_access (org_id, hr_employee_id, org_module_id, is_enabled, can_edit, can_delete, can_verify) VALUES
  ('acme-farms', 'emp-001', 'acme-hr', true, true, true, true),
  ('acme-farms', 'emp-001', 'acme-inv', true, true, true, true),
  ('acme-farms', 'emp-001', 'acme-ops', true, true, false, true),
  ('acme-farms', 'emp-001', 'acme-grow', true, true, false, false),
  ('acme-farms', 'emp-001', 'acme-fs', true, true, false, true)
ON CONFLICT (hr_employee_id, org_module_id) DO NOTHING;

-- ============================================================
-- Module access: emp-002 (employee at kona-coffee, HR only, limited permissions)
-- ============================================================

INSERT INTO public.hr_module_access (org_id, hr_employee_id, org_module_id, is_enabled, can_edit, can_delete, can_verify) VALUES
  ('kona-coffee', 'emp-002', 'kona-hr', true, true, false, false),
  ('kona-coffee', 'emp-002', 'kona-inv', false, false, false, false)
ON CONFLICT (hr_employee_id, org_module_id) DO NOTHING;

-- ============================================================
-- CRUD Demo: hr_department seed data
-- ============================================================

INSERT INTO public.hr_department (id, org_id, name, description, is_deleted, created_by, updated_by) VALUES
  ('engineering', 'acme-farms', 'Engineering', 'Software and hardware engineering', false, 'emp-001', 'emp-001'),
  ('operations', 'acme-farms', 'Operations', 'Farm operations and logistics', false, 'emp-001', 'emp-001'),
  ('finance', 'acme-farms', 'Finance', 'Accounting and financial planning', false, 'emp-001', 'emp-001'),
  ('hr', 'acme-farms', 'Human Resources', 'People and culture', false, 'emp-001', 'emp-001'),
  ('deleted-dept', 'acme-farms', 'Old Department', 'This department was deleted', true, 'emp-001', 'emp-001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CRUD Demo: inv_product seed data (exercises all field types + workflow)
-- ============================================================

INSERT INTO public.inv_product (org_id, name, description, quantity, unit_price, purchase_date, is_active, category, department_id, status, created_by, updated_by) VALUES
  ('acme-farms', 'John Deere Tractor', 'Main field tractor for plowing', 2, 45000.00, '2024-01-15', true, 'Equipment', 'operations', 'active', 'emp-001', 'emp-001'),
  ('acme-farms', 'Irrigation Hoses', 'Drip irrigation hose 100ft rolls', 50, 25.99, '2024-03-01', true, 'Supplies', 'operations', 'active', 'emp-001', 'emp-001'),
  ('acme-farms', 'Soil pH Meter', 'Digital soil pH and moisture tester', 5, 89.00, '2024-06-10', true, 'Tools', 'engineering', 'draft', 'emp-001', 'emp-001'),
  ('acme-farms', 'Tomato Seeds - Roma', 'Organic Roma tomato seeds 1lb bags', 100, 12.50, '2025-01-20', true, 'Seeds', NULL, 'active', 'emp-001', 'emp-001'),
  ('acme-farms', 'Old Sprayer', 'Backpack sprayer - needs repair', 1, 150.00, '2022-05-01', false, 'Equipment', 'operations', 'retired', 'emp-001', 'emp-001')
ON CONFLICT DO NOTHING;
