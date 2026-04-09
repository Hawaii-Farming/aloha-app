-- Auth Auto-Link Trigger Tests
--
-- Verifies handle_new_auth_user() trigger fires correctly:
--   - Skips link when email_confirmed_at IS NULL
--   - Links employee when email_confirmed_at IS NOT NULL
--   - Multi-org linking (same email in multiple orgs)
--   - No-match produces no log entries
--   - Already-linked employees not overwritten
--   - UPDATE trigger fires on email confirmation
--   - auth_link_log not readable by authenticated role

BEGIN;

SELECT plan(12);

-- ============================================================
-- Test data setup
-- ============================================================

-- Create employees with company_email for trigger tests.
-- NOTE: We do NOT use create_test_user() for the auth.users inserts
-- because we need to control email_confirmed_at (NULL vs now()).

-- Employee for test 1 (unconfirmed email)
INSERT INTO public.hr_employee (id, org_id, first_name, last_name, company_email, sys_access_level_id)
VALUES ('emp-trigger-01', 'acme-farms', 'Unconfirmed', 'User', 'unconfirmed@test.com', 'employee')
ON CONFLICT (id) DO NOTHING;

-- Employee for test 2 (confirmed email)
INSERT INTO public.hr_employee (id, org_id, first_name, last_name, company_email, sys_access_level_id)
VALUES ('emp-trigger-02', 'acme-farms', 'Confirmed', 'User', 'confirmed@test.com', 'employee')
ON CONFLICT (id) DO NOTHING;

-- Employees for test 3 (multi-org link)
INSERT INTO public.hr_employee (id, org_id, first_name, last_name, company_email, sys_access_level_id)
VALUES ('emp-trigger-03a', 'acme-farms', 'Multi', 'UserAcme', 'multi@test.com', 'employee')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hr_employee (id, org_id, first_name, last_name, company_email, sys_access_level_id)
VALUES ('emp-trigger-03b', 'kona-coffee', 'Multi', 'UserKona', 'multi@test.com', 'employee')
ON CONFLICT (id) DO NOTHING;

-- Employee for test 5 (already linked — backfill safety)
SELECT create_test_user('deadbeef-dead-beef-dead-beefdeadbeef'::uuid, 'taken-user@test.com');
INSERT INTO public.hr_employee (id, org_id, first_name, last_name, company_email, user_id, sys_access_level_id)
VALUES ('emp-trigger-05', 'acme-farms', 'Taken', 'User', 'taken@test.com', 'deadbeef-dead-beef-dead-beefdeadbeef'::uuid, 'employee')
ON CONFLICT (id) DO NOTHING;

-- Employee for test 6 (UPDATE trigger — email confirmation flow)
INSERT INTO public.hr_employee (id, org_id, first_name, last_name, company_email, sys_access_level_id)
VALUES ('emp-trigger-06', 'acme-farms', 'Update', 'User', 'update-confirm@test.com', 'employee')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Test 1: email_confirmed_at NULL skips link
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
  '11111111-1111-1111-1111-111111111001'::uuid,
  'authenticated', 'authenticated',
  'unconfirmed@test.com',
  crypt('testpassword', gen_salt('bf', 4)),
  NULL,  -- email NOT confirmed
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"unconfirmed@test.com"}'::jsonb,
  false, false,
  '', '', '',
  '', '', '', 0,
  NULL, '', ''
);

SELECT is(
  (SELECT user_id FROM public.hr_employee WHERE id = 'emp-trigger-01'),
  NULL,
  'TRIGGER: unconfirmed email — hr_employee.user_id stays NULL'
);

SELECT is(
  (SELECT count(*)::integer FROM public.auth_link_log
   WHERE auth_user_id = '11111111-1111-1111-1111-111111111001'::uuid),
  0,
  'TRIGGER: unconfirmed email — no auth_link_log row'
);

-- ============================================================
-- Test 2: email_confirmed_at NOT NULL links employee
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
  '11111111-1111-1111-1111-111111111002'::uuid,
  'authenticated', 'authenticated',
  'confirmed@test.com',
  crypt('testpassword', gen_salt('bf', 4)),
  now(),  -- email IS confirmed
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"confirmed@test.com"}'::jsonb,
  false, false,
  '', '', '',
  '', '', '', 0,
  NULL, '', ''
);

SELECT is(
  (SELECT user_id FROM public.hr_employee WHERE id = 'emp-trigger-02'),
  '11111111-1111-1111-1111-111111111002'::uuid,
  'TRIGGER: confirmed email — hr_employee.user_id set to auth user UUID'
);

SELECT is(
  (SELECT count(*)::integer FROM public.auth_link_log
   WHERE auth_user_id = '11111111-1111-1111-1111-111111111002'::uuid),
  1,
  'TRIGGER: confirmed email — exactly 1 auth_link_log row'
);

-- ============================================================
-- Test 3: Multi-org link
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
  '11111111-1111-1111-1111-111111111003'::uuid,
  'authenticated', 'authenticated',
  'multi@test.com',
  crypt('testpassword', gen_salt('bf', 4)),
  now(),
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"multi@test.com"}'::jsonb,
  false, false,
  '', '', '',
  '', '', '', 0,
  NULL, '', ''
);

SELECT ok(
  (SELECT user_id FROM public.hr_employee WHERE id = 'emp-trigger-03a')
    = '11111111-1111-1111-1111-111111111003'::uuid
  AND
  (SELECT user_id FROM public.hr_employee WHERE id = 'emp-trigger-03b')
    = '11111111-1111-1111-1111-111111111003'::uuid,
  'TRIGGER: multi-org — both hr_employee rows linked to same auth user'
);

SELECT is(
  (SELECT count(*)::integer FROM public.auth_link_log
   WHERE auth_user_id = '11111111-1111-1111-1111-111111111003'::uuid),
  2,
  'TRIGGER: multi-org — 2 auth_link_log rows'
);

-- ============================================================
-- Test 4: No matching employee — no link, no log
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
  '11111111-1111-1111-1111-111111111004'::uuid,
  'authenticated', 'authenticated',
  'nobody@test.com',
  crypt('testpassword', gen_salt('bf', 4)),
  now(),
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"nobody@test.com"}'::jsonb,
  false, false,
  '', '', '',
  '', '', '', 0,
  NULL, '', ''
);

SELECT is(
  (SELECT count(*)::integer FROM public.auth_link_log
   WHERE auth_user_id = '11111111-1111-1111-1111-111111111004'::uuid),
  0,
  'TRIGGER: no matching employee — 0 auth_link_log rows'
);

-- ============================================================
-- Test 5: Backfill safety — already linked employee not overwritten
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
  '11111111-1111-1111-1111-111111111005'::uuid,
  'authenticated', 'authenticated',
  'taken@test.com',
  crypt('testpassword', gen_salt('bf', 4)),
  now(),
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"taken@test.com"}'::jsonb,
  false, false,
  '', '', '',
  '', '', '', 0,
  NULL, '', ''
);

SELECT is(
  (SELECT user_id FROM public.hr_employee WHERE id = 'emp-trigger-05'),
  'deadbeef-dead-beef-dead-beefdeadbeef'::uuid,
  'TRIGGER: backfill safety — already-linked user_id NOT overwritten'
);

-- ============================================================
-- Test 6: UPDATE trigger fires on email confirmation
-- ============================================================

-- Insert unconfirmed user first
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
  '11111111-1111-1111-1111-111111111006'::uuid,
  'authenticated', 'authenticated',
  'update-confirm@test.com',
  crypt('testpassword', gen_salt('bf', 4)),
  NULL,  -- starts unconfirmed
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"update-confirm@test.com"}'::jsonb,
  false, false,
  '', '', '',
  '', '', '', 0,
  NULL, '', ''
);

-- Verify not linked yet
SELECT is(
  (SELECT user_id FROM public.hr_employee WHERE id = 'emp-trigger-06'),
  NULL,
  'TRIGGER UPDATE: before confirmation — hr_employee.user_id is NULL'
);

-- Simulate email confirmation
UPDATE auth.users
SET email_confirmed_at = now(), updated_at = now()
WHERE id = '11111111-1111-1111-1111-111111111006'::uuid;

SELECT is(
  (SELECT user_id FROM public.hr_employee WHERE id = 'emp-trigger-06'),
  '11111111-1111-1111-1111-111111111006'::uuid,
  'TRIGGER UPDATE: after confirmation — hr_employee.user_id linked'
);

-- ============================================================
-- Test 7: auth_link_log not readable by authenticated role
-- ============================================================

-- Verify rows exist as superuser (tests 2-3 created at least 3)
SELECT ok(
  (SELECT count(*)::integer FROM public.auth_link_log) >= 3,
  'RLS: auth_link_log has rows (superuser can see them)'
);

-- Switch to authenticated role to test access
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111002", "role": "authenticated"}';

SELECT is(
  (SELECT count(*)::integer FROM public.auth_link_log),
  0,
  'RLS: authenticated role cannot read auth_link_log'
);

-- Reset to superuser for finish()
RESET ROLE;

SELECT * FROM finish();

ROLLBACK;
