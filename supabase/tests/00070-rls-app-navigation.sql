-- App Navigation View Tenant Isolation Tests
--
-- Verifies the app_navigation view enforces tenant scoping via
-- auth.uid() — users only see navigation for orgs where they
-- have an hr_employee membership.

BEGIN;

SELECT plan(5);

-- ============================================================
-- Test data setup
-- ============================================================

-- Isolated user for kona-coffee-only access
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
-- Seed user (a1b2c3d4-...) — member of acme-farms + kona-coffee
-- ============================================================

-- Test 1: Seed user sees app_navigation rows for acme-farms
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT ok(
  (SELECT count(*)::integer FROM app_navigation WHERE org_id = 'acme-farms') > 0,
  'APP_NAV: seed user sees acme-farms navigation rows'
);
RESET ROLE;

-- Test 2: Seed user sees app_navigation rows for kona-coffee
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT ok(
  (SELECT count(*)::integer FROM app_navigation WHERE org_id = 'kona-coffee') > 0,
  'APP_NAV: seed user sees kona-coffee navigation rows'
);
RESET ROLE;

-- ============================================================
-- Isolated user (b2c3d4e5-...) — kona-coffee only
-- ============================================================

-- Test 3: Isolated user sees kona-coffee navigation rows
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT ok(
  (SELECT count(*)::integer FROM app_navigation WHERE org_id = 'kona-coffee') > 0,
  'APP_NAV: isolated user sees kona-coffee navigation rows'
);
RESET ROLE;

-- Test 4: Isolated user sees ZERO acme-farms rows
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM app_navigation WHERE org_id = 'acme-farms'),
  0,
  'APP_NAV: isolated user sees 0 acme-farms navigation rows'
);
RESET ROLE;

-- Test 5: Unknown user sees ZERO rows total
SELECT test_as_user('00000000-0000-0000-0000-000000000001'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM app_navigation),
  0,
  'APP_NAV: unknown user sees 0 navigation rows'
);
RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
