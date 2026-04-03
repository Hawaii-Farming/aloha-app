-- RLS Cross-Org Denial Tests
--
-- Verifies authenticated users CANNOT read or write data in orgs they don't belong to.

BEGIN;

SELECT plan(17);

-- ============================================================
-- Test data setup
-- ============================================================

-- Isolated user: only in kona-coffee
SELECT create_test_user(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid,
  'test-isolated@test.com'
);
SELECT create_test_employee(
  'emp-isolated', 'kona-coffee',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid,
  'employee'
);

-- Ensure acme-farms has test data (from seed: 5 departments, 5 items, 5 categories)

-- ============================================================
-- SELECT denied for non-member org
-- ============================================================

-- Test 1: Isolated user sees 0 acme-farms hr_department rows
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM hr_department WHERE org_id = 'acme-farms'),
  0,
  'DENY SELECT: isolated user sees 0 acme-farms hr_department rows'
);
RESET ROLE;

-- Test 2: Isolated user sees 0 acme-farms invnt_item rows
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM invnt_item WHERE org_id = 'acme-farms'),
  0,
  'DENY SELECT: isolated user sees 0 acme-farms invnt_item rows'
);
RESET ROLE;

-- Test 3: Isolated user sees 0 acme-farms invnt_category rows
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM invnt_category WHERE org_id = 'acme-farms'),
  0,
  'DENY SELECT: isolated user sees 0 acme-farms invnt_category rows'
);
RESET ROLE;

-- Test 4: Isolated user sees 0 acme-farms org_module rows
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM org_module WHERE org_id = 'acme-farms'),
  0,
  'DENY SELECT: isolated user sees 0 acme-farms org_module rows'
);
RESET ROLE;

-- Test 5: Isolated user total hr_department count excludes acme-farms
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM hr_department),
  0,
  'DENY SELECT: isolated user total hr_department has no acme-farms rows'
);
RESET ROLE;

-- ============================================================
-- INSERT denied for non-member org
-- ============================================================

-- Test 6: Isolated user cannot INSERT into acme-farms hr_department
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT throws_ok(
  $$INSERT INTO hr_department (id, org_id, name, created_by, updated_by)
    VALUES ('hack-dept', 'acme-farms', 'Hacked', 'emp-isolated', 'emp-isolated')$$,
  42501,
  NULL,
  'DENY INSERT: isolated user cannot insert into acme-farms hr_department'
);
RESET ROLE;

-- Test 7: Isolated user cannot INSERT into acme-farms invnt_category
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT throws_ok(
  $$INSERT INTO invnt_category (id, org_id, category_name, created_by, updated_by)
    VALUES ('hack-cat', 'acme-farms', 'Hacked', 'emp-isolated', 'emp-isolated')$$,
  42501,
  NULL,
  'DENY INSERT: isolated user cannot insert into acme-farms invnt_category'
);
RESET ROLE;

-- Test 8: Isolated user cannot INSERT into acme-farms org_farm
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT throws_ok(
  $$INSERT INTO org_farm (id, org_id, name, created_by, updated_by)
    VALUES ('hack-farm', 'acme-farms', 'Hacked Farm', 'emp-isolated', 'emp-isolated')$$,
  42501,
  NULL,
  'DENY INSERT: isolated user cannot insert into acme-farms org_farm'
);
RESET ROLE;

-- Test 9: Isolated user cannot INSERT into acme-farms sales_customer
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT throws_ok(
  $$INSERT INTO sales_customer (id, org_id, name, created_by, updated_by)
    VALUES ('hack-cust', 'acme-farms', 'Hacked Customer', 'emp-isolated', 'emp-isolated')$$,
  42501,
  NULL,
  'DENY INSERT: isolated user cannot insert into acme-farms sales_customer'
);
RESET ROLE;

-- ============================================================
-- UPDATE denied for non-member org
-- ============================================================

-- Test 10: Isolated user UPDATE on acme-farms hr_department affects 0 rows
-- (RLS filters out rows the user can't see, so UPDATE silently affects 0)
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT lives_ok(
  $$UPDATE hr_department SET description = 'hacked' WHERE org_id = 'acme-farms'$$,
  'DENY UPDATE: isolated user update on acme-farms hr_department runs without error'
);
RESET ROLE;

-- Verify no rows were actually changed
SELECT is(
  (SELECT description FROM hr_department WHERE id = 'engineering'),
  'Software and hardware engineering',
  'DENY UPDATE: acme-farms hr_department was not modified'
);

-- Test 11: Isolated user UPDATE on specific acme-farms row affects 0 rows
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT lives_ok(
  $$UPDATE hr_department SET description = 'hacked' WHERE id = 'engineering'$$,
  'DENY UPDATE: isolated user update on specific acme-farms row silently no-ops'
);
RESET ROLE;

-- ============================================================
-- Anon role denied everywhere
-- ============================================================

-- Test 12: Anon cannot access hr_department (no table permission)
SELECT test_as_anon();
SELECT throws_ok(
  'SELECT count(*) FROM hr_department',
  '42P01',
  NULL,
  'DENY ANON: anon cannot access hr_department'
);
RESET ROLE;

-- Test 13: Anon cannot access invnt_item
SELECT test_as_anon();
SELECT throws_ok(
  'SELECT count(*) FROM invnt_item',
  '42P01',
  NULL,
  'DENY ANON: anon cannot access invnt_item'
);
RESET ROLE;

-- Test 14: Anon cannot access org_module
SELECT test_as_anon();
SELECT throws_ok(
  'SELECT count(*) FROM org_module',
  '42P01',
  NULL,
  'DENY ANON: anon cannot access org_module'
);
RESET ROLE;

-- Test 15: Anon cannot INSERT into hr_department
SELECT test_as_anon();
SELECT throws_ok(
  $$INSERT INTO hr_department (id, org_id, name)
    VALUES ('anon-dept', 'acme-farms', 'Anon Dept')$$,
  '42P01',
  NULL,
  'DENY ANON: anon cannot insert into hr_department'
);
RESET ROLE;

-- Test 16: Anon cannot access sys_access_level (requires authenticated)
SELECT test_as_anon();
SELECT throws_ok(
  'SELECT count(*) FROM sys_access_level',
  '42P01',
  NULL,
  'DENY ANON: anon cannot access sys_access_level'
);
RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
