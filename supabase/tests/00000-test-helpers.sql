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
  VALUES (p_id, p_org_id, p_user_uuid, 'Test', 'Employee', p_access_level_id)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Minimal TAP output so pg_prove doesn't complain
SELECT plan(1);
SELECT pass('Test helpers loaded successfully');
SELECT * FROM finish();
