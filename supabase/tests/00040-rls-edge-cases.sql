-- RLS Edge Cases, System Tables & Views Tests
--
-- Covers deleted employees, system lookup tables, security_invoker views,
-- and metadata verification that all tables have RLS enabled.

BEGIN;

SELECT plan(15);

-- ============================================================
-- Test data setup
-- ============================================================

-- Create a user who will be soft-deleted
SELECT create_test_user(
  'c3d4e5f6-a7b8-9012-cdef-123456789012'::uuid,
  'test-deleted@test.com'
);
SELECT create_test_org('phantom-org', 'Phantom Org');

-- Create employee, then soft-delete them
INSERT INTO public.hr_employee (id, org_id, user_id, first_name, last_name, sys_access_level_id, is_deleted)
VALUES ('emp-deleted', 'acme-farms', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Deleted', 'Employee', 'employee', true)
ON CONFLICT (id) DO NOTHING;

-- Create isolated user for view tests
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
-- Deleted employee loses access
-- ============================================================

-- Test 1: Deleted employee's user_has_org_access returns false
SELECT test_as_user('c3d4e5f6-a7b8-9012-cdef-123456789012'::uuid);
SELECT ok(
  NOT (SELECT user_has_org_access('acme-farms')),
  'DELETED: soft-deleted employee has no org access'
);
RESET ROLE;

-- Test 2: Deleted employee gets 0 rows from hr_department
SELECT test_as_user('c3d4e5f6-a7b8-9012-cdef-123456789012'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM hr_department),
  0,
  'DELETED: soft-deleted employee sees 0 hr_department rows'
);
RESET ROLE;

-- Test 3: Deleted employee gets empty org_ids
SELECT test_as_user('c3d4e5f6-a7b8-9012-cdef-123456789012'::uuid);
SELECT ok(
  (SELECT get_user_org_ids() = '{}'::text[]),
  'DELETED: soft-deleted employee get_user_org_ids returns empty'
);
RESET ROLE;

-- ============================================================
-- System lookup tables — public read for authenticated
-- ============================================================

-- Test 4: Any authenticated user can access sys_uom (may be empty but doesn't error)
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT lives_ok(
  'SELECT count(*) FROM sys_uom',
  'SYS: authenticated user can read sys_uom'
);
RESET ROLE;

-- Test 5: Any authenticated user can read sys_access_level (5 rows)
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM sys_access_level),
  5,
  'SYS: authenticated user sees 5 sys_access_level rows'
);
RESET ROLE;

-- Test 6: Any authenticated user can read sys_module
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT ok(
  (SELECT count(*)::integer FROM sys_module) > 0,
  'SYS: authenticated user can read sys_module'
);
RESET ROLE;

-- Test 7: Any authenticated user can read sys_sub_module
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT ok(
  (SELECT count(*)::integer FROM sys_sub_module) > 0,
  'SYS: authenticated user can read sys_sub_module'
);
RESET ROLE;

-- ============================================================
-- System lookup tables — no write for authenticated
-- ============================================================

-- Test 8: Authenticated user cannot INSERT into sys_access_level
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT throws_ok(
  $$INSERT INTO sys_access_level (id, name, level, display_order)
    VALUES ('hacker', 'Hacker', 99, 99)$$,
  42501,
  NULL,
  'SYS: authenticated user cannot insert into sys_access_level'
);
RESET ROLE;

-- Test 9: Authenticated user UPDATE on sys_access_level affects 0 rows (no UPDATE policy)
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT results_eq(
  $$UPDATE sys_access_level SET level = 99 WHERE id = 'employee' RETURNING id$$,
  $$VALUES (NULL::text) LIMIT 0$$,
  'SYS: authenticated user update on sys_access_level affects 0 rows'
);
RESET ROLE;

-- ============================================================
-- Views with security_invoker respect RLS
-- ============================================================

-- Test 10: Isolated user (kona-coffee only) sees 0 rows from invnt_item_summary
-- (all invnt_item seed data belongs to acme-farms)
SELECT test_as_user('b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid);
SELECT is(
  (SELECT count(*)::integer FROM invnt_item_summary),
  0,
  'VIEW: isolated user sees 0 invnt_item_summary rows (security_invoker)'
);
RESET ROLE;

-- Test 11: Seed user (acme-farms member) sees invnt_item_summary rows
SELECT test_as_user('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid);
SELECT ok(
  (SELECT count(*)::integer FROM invnt_item_summary) > 0,
  'VIEW: seed user sees invnt_item_summary rows (security_invoker)'
);
RESET ROLE;

-- ============================================================
-- Metadata: All tables have RLS enabled
-- ============================================================

-- Test 12: No public tables are missing RLS
SELECT is(
  (SELECT count(*)::integer
   FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relname NOT LIKE 'pg_%'
     AND c.relrowsecurity = false),
  0,
  'METADATA: all public tables have RLS enabled (none missing)'
);

-- Test 13: Total count of RLS-enabled tables matches expected
SELECT ok(
  (SELECT count(*)::integer
   FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relname NOT LIKE 'pg_%'
     AND c.relrowsecurity = true) >= 90,
  'METADATA: at least 90 public tables have RLS enabled'
);

-- Test 14: All aloha business tables (org_, hr_, invnt_, etc.) have RLS
SELECT is(
  (SELECT count(*)::integer
   FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND (c.relname LIKE 'org_%' OR c.relname LIKE 'hr_%'
       OR c.relname LIKE 'invnt_%' OR c.relname LIKE 'grow_%'
       OR c.relname LIKE 'pack_%' OR c.relname LIKE 'sales_%'
       OR c.relname LIKE 'ops_%' OR c.relname LIKE 'maint_%'
       OR c.relname LIKE 'fsafe_%' OR c.relname LIKE 'sys_%')
     AND c.relrowsecurity = false),
  0,
  'METADATA: all aloha business tables have RLS enabled'
);

-- Test 15: All sys_ tables have at least one SELECT policy for authenticated
SELECT is(
  (SELECT count(DISTINCT t.tablename)::integer
   FROM pg_tables t
   JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
   WHERE t.schemaname = 'public'
     AND t.tablename LIKE 'sys_%'
     AND p.cmd = 'SELECT'
     AND p.roles @> ARRAY['authenticated']::name[]),
  4,
  'METADATA: all 4 sys_ tables have authenticated SELECT policies'
);

SELECT * FROM finish();

ROLLBACK;
