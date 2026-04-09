-- RLS Helper Function Tests
--
-- Verifies get_user_org_ids(), user_has_org_access(),
-- get_user_employee_id(), and get_user_access_level()
-- return correct values for different user/org combinations.

BEGIN;

SELECT plan(20);

-- ============================================================
-- Test data setup
-- ============================================================

-- Seed user: a1b2c3d4-... (already exists, member of acme-farms + kona-coffee)
-- Isolated user: b2c3d4e5-... (kona-coffee only)
-- Phantom org: no employees

SELECT create_test_user(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid,
  'test-isolated@test.com'
);
SELECT create_test_org('phantom-org', 'Phantom Org');
SELECT create_test_employee(
  'emp-isolated', 'kona-coffee',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid,
  'employee'
);

-- ============================================================
-- get_user_org_ids()
-- ============================================================

-- Test 1: Seed user returns both orgs
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT ok(
  (SELECT ARRAY(SELECT get_user_org_ids()) @> ARRAY['acme-farms', 'kona-coffee']),
  'get_user_org_ids: seed user returns both orgs'
);
RESET ROLE;

-- Test 2: Isolated user returns only kona-coffee
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT ok(
  (SELECT ARRAY(SELECT get_user_org_ids()) = ARRAY['kona-coffee']),
  'get_user_org_ids: isolated user returns one org'
);
RESET ROLE;

-- Test 3: Unknown user returns empty array
SELECT test_as_user('00000000-0000-0000-0000-000000000001'::uuid);
SELECT ok(
  (SELECT ARRAY(SELECT get_user_org_ids()) = '{}'::text[]),
  'get_user_org_ids: unknown user returns empty array'
);
RESET ROLE;

-- Test 4: Anon cannot call helper functions (no EXECUTE grant)
SELECT test_as_anon();
SELECT throws_ok(
  'SELECT get_user_org_ids()',
  42883,  -- function not visible to anon
  NULL,
  'get_user_org_ids: anon denied (function not accessible)'
);
RESET ROLE;

-- ============================================================
-- user_has_org_access()
-- ============================================================

-- Test 5: Seed user + acme-farms → true
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT ok(
  (SELECT user_has_org_access('acme-farms')),
  'user_has_org_access: seed user has acme-farms access'
);
RESET ROLE;

-- Test 6: Seed user + kona-coffee → true
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT ok(
  (SELECT user_has_org_access('kona-coffee')),
  'user_has_org_access: seed user has kona-coffee access'
);
RESET ROLE;

-- Test 7: Seed user + phantom-org → false
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT ok(
  NOT (SELECT user_has_org_access('phantom-org')),
  'user_has_org_access: seed user denied phantom-org'
);
RESET ROLE;

-- Test 8: Isolated user + acme-farms → false
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT ok(
  NOT (SELECT user_has_org_access('acme-farms')),
  'user_has_org_access: isolated user denied acme-farms'
);
RESET ROLE;

-- Test 9: Isolated user + kona-coffee → true
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT ok(
  (SELECT user_has_org_access('kona-coffee')),
  'user_has_org_access: isolated user has kona-coffee access'
);
RESET ROLE;

-- ============================================================
-- get_user_employee_id()
-- ============================================================

-- Test 10: Seed user + acme-farms → emp-001
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT get_user_employee_id('acme-farms')),
  'emp-001',
  'get_user_employee_id: seed user in acme-farms is emp-001'
);
RESET ROLE;

-- Test 11: Seed user + kona-coffee → emp-002
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT get_user_employee_id('kona-coffee')),
  'emp-002',
  'get_user_employee_id: seed user in kona-coffee is emp-002'
);
RESET ROLE;

-- Test 12: Seed user + phantom-org → NULL
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT get_user_employee_id('phantom-org')),
  NULL,
  'get_user_employee_id: seed user in phantom-org is NULL'
);
RESET ROLE;

-- Test 13: Isolated user + kona-coffee → emp-isolated
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT get_user_employee_id('kona-coffee')),
  'emp-isolated',
  'get_user_employee_id: isolated user in kona-coffee is emp-isolated'
);
RESET ROLE;

-- Test 14: Isolated user + acme-farms → NULL
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT get_user_employee_id('acme-farms')),
  NULL,
  'get_user_employee_id: isolated user in acme-farms is NULL'
);
RESET ROLE;

-- ============================================================
-- get_user_access_level()
-- ============================================================

-- Test 15: Seed user + acme-farms → 40 (admin)
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT get_user_access_level('acme-farms')),
  40,
  'get_user_access_level: seed user in acme-farms is 40 (admin)'
);
RESET ROLE;

-- Test 16: Seed user + kona-coffee → 10 (employee)
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT get_user_access_level('kona-coffee')),
  10,
  'get_user_access_level: seed user in kona-coffee is 10 (employee)'
);
RESET ROLE;

-- Test 17: Isolated user + kona-coffee → 10 (employee)
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT get_user_access_level('kona-coffee')),
  10,
  'get_user_access_level: isolated user in kona-coffee is 10'
);
RESET ROLE;

-- Test 18: Seed user + phantom-org → NULL
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT is(
  (SELECT get_user_access_level('phantom-org')),
  NULL,
  'get_user_access_level: seed user in phantom-org is NULL'
);
RESET ROLE;

-- Test 19: Isolated user + acme-farms → NULL
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT get_user_access_level('acme-farms')),
  NULL,
  'get_user_access_level: isolated user in acme-farms is NULL'
);
RESET ROLE;

-- Test 20: Anon cannot call get_user_access_level
SELECT test_as_anon();
SELECT throws_ok(
  $$SELECT get_user_access_level('acme-farms')$$,
  42883,
  NULL,
  'get_user_access_level: anon denied (function not accessible)'
);
RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
