-- Test Helpers: Reusable functions for pgTAP RLS tests
--
-- Provides auth impersonation and test data setup.
-- Loaded before all other test files (alphabetical order).
-- NOTE: No BEGIN/ROLLBACK — functions must persist for subsequent test files.
--
-- Usage pattern in tests:
--   SELECT test_as_user('uuid'::uuid);
--   SELECT ok(...);  -- runs as authenticated user
--   RESET ROLE;      -- back to postgres (superuser)

-- ============================================================
-- Auth impersonation helpers
-- ============================================================

-- Impersonate an authenticated user by setting role + JWT claims.
-- Must be called from postgres (superuser) context.
-- To return to postgres, use: RESET ROLE;
CREATE OR REPLACE FUNCTION test_as_user(user_uuid UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', user_uuid::text,
    'role', 'authenticated',
    'aud', 'authenticated'
  )::text, true);
  PERFORM set_config('role', 'authenticated', true);
END;
$$;

-- Impersonate anon role (no JWT).
-- Must be called from postgres (superuser) context.
-- To return to postgres, use: RESET ROLE;
CREATE OR REPLACE FUNCTION test_as_anon()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{}'::text, true);
  PERFORM set_config('role', 'anon', true);
END;
$$;

-- ============================================================
-- Test data creation helpers
-- ============================================================

-- Create a test user in auth.users + auth.identities
CREATE OR REPLACE FUNCTION create_test_user(p_uuid UUID, p_email TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
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
    p_uuid,
    'authenticated', 'authenticated',
    p_email,
    crypt('testpassword', gen_salt('bf', 4)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    format('{"display_name":"%s"}', p_email)::jsonb,
    false, false,
    '', '', '',
    '', '', '', 0,
    NULL, '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    p_uuid,
    p_uuid,
    jsonb_build_object('sub', p_uuid::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
    'email', p_uuid::text,
    now(), now(), now()
  ) ON CONFLICT (provider_id, provider) DO NOTHING;
END;
$$;

-- Create a test org
CREATE OR REPLACE FUNCTION create_test_org(p_id TEXT, p_name TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.org (id, name)
  VALUES (p_id, p_name)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Create a test employee linking a user to an org
CREATE OR REPLACE FUNCTION create_test_employee(
  p_id TEXT,
  p_org_id TEXT,
  p_user_uuid UUID,
  p_access_level_id TEXT
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.hr_employee (id, org_id, user_id, first_name, last_name, sys_access_level_id)
  VALUES (p_id, p_org_id, p_user_uuid, 'Test-' || p_id, 'Emp-' || p_org_id, p_access_level_id)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- ============================================================
-- Convenience functions used by tests
-- ============================================================

-- Check if the current user has access to a specific org.
-- Tests reference this but it was never created in migrations.
CREATE OR REPLACE FUNCTION user_has_org_access(p_org_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN p_org_id = ANY(public.get_user_org_ids());
END;
$$;

-- Get the employee ID for the current user in a specific org
CREATE OR REPLACE FUNCTION get_user_employee_id(p_org_id TEXT)
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT e.id FROM public.hr_employee e
  WHERE e.org_id = p_org_id
    AND e.user_id = auth.uid()
    AND e.is_deleted = false
  LIMIT 1;
$$;

-- Get the access level for the current user in a specific org
CREATE OR REPLACE FUNCTION get_user_access_level(p_org_id TEXT)
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT e.sys_access_level_id FROM public.hr_employee e
  WHERE e.org_id = p_org_id
    AND e.user_id = auth.uid()
    AND e.is_deleted = false
  LIMIT 1;
$$;

-- ============================================================
-- Shared seed data (persists across test files)
-- ============================================================

-- Access levels (referenced by hr_employee FK)
INSERT INTO public.sys_access_level (id, name, level, display_order)
VALUES
  ('employee', 'Employee', 1, 1),
  ('team_lead', 'Team Lead', 2, 2),
  ('manager', 'Manager', 3, 3),
  ('admin', 'Admin', 4, 4),
  ('owner', 'Owner', 5, 5)
ON CONFLICT (id) DO NOTHING;

-- Orgs used by all RLS tests
SELECT create_test_org('acme-farms', 'Acme Farms');
SELECT create_test_org('kona-coffee', 'Kona Coffee');

-- Seed user: member of both orgs
SELECT create_test_user(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'seed-user@test.com'
);
SELECT create_test_employee(
  'emp-seed-acme', 'acme-farms',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'owner'
);
SELECT create_test_employee(
  'emp-seed-kona', 'kona-coffee',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'owner'
);

-- Minimal TAP output so pg_prove doesn't complain
SELECT plan(1);
SELECT pass('Test helpers loaded successfully');
SELECT * FROM finish();
