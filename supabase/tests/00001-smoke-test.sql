-- Smoke Test: Verify pgTAP framework and test helpers work

BEGIN;

SELECT plan(4);

-- Test 1: pgTAP extension is available
SELECT has_extension('pgtap', 'pgTAP extension is installed');

-- Test 2: test_as_user helper exists
SELECT has_function(
  'public', 'test_as_user', ARRAY['uuid'],
  'test_as_user() helper function exists'
);

-- Test 3: test_as_anon helper exists
SELECT has_function(
  'public', 'test_as_anon', '{}',
  'test_as_anon() helper function exists'
);

-- Test 4: RLS helper function exists
SELECT has_function(
  'public', 'get_user_org_ids', '{}',
  'get_user_org_ids() RLS helper exists'
);

SELECT * FROM finish();

ROLLBACK;
