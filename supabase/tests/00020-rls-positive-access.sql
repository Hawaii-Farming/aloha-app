-- RLS Positive Access Tests
--
-- Verifies authenticated users CAN read/write data in their own org.

BEGIN;

SELECT plan(16);

-- ============================================================
-- Test data setup
-- ============================================================

-- Isolated user for kona-coffee-only tests
SELECT create_test_user(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid,
  'test-isolated@test.com'
);
SELECT create_test_employee(
  'emp-isolated', 'kona-coffee',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid,
  'employee'
);

-- ============================================================
-- SELECT on own org data
-- ============================================================

-- Test 1: Seed user can read hr_department in acme-farms (5 seeded rows)
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM hr_department WHERE org_id = 'acme-farms'),
  5,
  'SELECT: seed user sees 5 hr_department rows in acme-farms'
);
RESET ROLE;

-- Test 2: Seed user can read invnt_item in acme-farms (5 seeded rows)
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM invnt_item WHERE org_id = 'acme-farms'),
  5,
  'SELECT: seed user sees 5 invnt_item rows in acme-farms'
);
RESET ROLE;

-- Test 3: Seed user can read invnt_category in acme-farms (5 seeded rows)
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM invnt_category WHERE org_id = 'acme-farms'),
  5,
  'SELECT: seed user sees 5 invnt_category rows in acme-farms'
);
RESET ROLE;

-- Test 4: Seed user can read org_module rows for acme-farms
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM org_module WHERE org_id = 'acme-farms'),
  5,
  'SELECT: seed user sees 5 org_module rows in acme-farms'
);
RESET ROLE;

-- ============================================================
-- INSERT into own org
-- ============================================================

-- Test 5: Seed user can INSERT into hr_department in acme-farms
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT lives_ok(
  $$INSERT INTO hr_department (id, org_id, name, created_by, updated_by)
    VALUES ('test-dept-1', 'acme-farms', 'Test Department', 'emp-001', 'emp-001')$$,
  'INSERT: seed user can insert hr_department in acme-farms'
);
RESET ROLE;

-- Test 6: Seed user can INSERT into invnt_category in acme-farms
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT lives_ok(
  $$INSERT INTO invnt_category (id, org_id, category_name, created_by, updated_by)
    VALUES ('cat-test-1', 'acme-farms', 'Test Category', 'emp-001', 'emp-001')$$,
  'INSERT: seed user can insert invnt_category in acme-farms'
);
RESET ROLE;

-- Test 7: Seed user can INSERT into org_farm in acme-farms
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT lives_ok(
  $$INSERT INTO org_farm (id, org_id, name, created_by, updated_by)
    VALUES ('farm-test-1', 'acme-farms', 'Test Farm', 'emp-001', 'emp-001')$$,
  'INSERT: seed user can insert org_farm in acme-farms'
);
RESET ROLE;

-- Test 8: Seed user can INSERT into sales_customer in acme-farms
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT lives_ok(
  $$INSERT INTO sales_customer (id, org_id, name, created_by, updated_by)
    VALUES ('cust-test-1', 'acme-farms', 'Test Customer', 'emp-001', 'emp-001')$$,
  'INSERT: seed user can insert sales_customer in acme-farms'
);
RESET ROLE;

-- ============================================================
-- UPDATE on own org data
-- ============================================================

-- Test 9: Seed user can UPDATE hr_department in acme-farms
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT lives_ok(
  $$UPDATE hr_department SET description = 'updated by test' WHERE id = 'test-dept-1'$$,
  'UPDATE: seed user can update hr_department in acme-farms'
);
RESET ROLE;

-- Test 10: Verify the UPDATE actually changed the row
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT description FROM hr_department WHERE id = 'test-dept-1'),
  'updated by test',
  'UPDATE: hr_department row was actually modified'
);
RESET ROLE;

-- Test 11: Seed user can UPDATE invnt_item in acme-farms
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT lives_ok(
  $$UPDATE invnt_item SET description = 'updated' WHERE id = 'item-tractor'$$,
  'UPDATE: seed user can update invnt_item in acme-farms'
);
RESET ROLE;

-- ============================================================
-- Multi-org user sees data from all their orgs
-- ============================================================

-- Insert test data into kona-coffee as superuser
INSERT INTO hr_department (id, org_id, name, created_by, updated_by)
VALUES ('kona-dept-1', 'kona-coffee', 'Kona Test Dept', 'emp-002', 'emp-002');

-- Test 12: Seed user (both orgs) sees hr_department from both orgs
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT ok(
  (SELECT count(DISTINCT org_id)::integer FROM hr_department) >= 2,
  'MULTI-ORG: seed user sees hr_department from multiple orgs'
);
RESET ROLE;

-- Test 13: Seed user sees kona-coffee org_module rows too
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM org_module WHERE org_id = 'kona-coffee'),
  5,
  'MULTI-ORG: seed user sees kona-coffee org_module rows'
);
RESET ROLE;

-- Test 14: Seed user can INSERT into kona-coffee (member of both)
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT lives_ok(
  $$INSERT INTO hr_department (id, org_id, name, created_by, updated_by)
    VALUES ('kona-dept-2', 'kona-coffee', 'Another Kona Dept', 'emp-002', 'emp-002')$$,
  'MULTI-ORG: seed user can insert into kona-coffee'
);
RESET ROLE;

-- ============================================================
-- Isolated user positive access
-- ============================================================

-- Test 15: Isolated user can SELECT from kona-coffee
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT ok(
  (SELECT count(*)::integer FROM hr_department WHERE org_id = 'kona-coffee') > 0,
  'ISOLATED: isolated user sees kona-coffee hr_department'
);
RESET ROLE;

-- Test 16: Isolated user can INSERT into kona-coffee
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT lives_ok(
  $$INSERT INTO hr_department (id, org_id, name, created_by, updated_by)
    VALUES ('kona-dept-3', 'kona-coffee', 'Isolated Dept', 'emp-isolated', 'emp-isolated')$$,
  'ISOLATED: isolated user can insert into kona-coffee'
);
RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
