-- Consumer Dev Tables: Minimal stand-ins for local development
--
-- In production, the consumer project (e.g. aloha-app) provides these tables.
-- Here we create minimal versions so the view contracts in 19-view-contracts.sql
-- and 20-nav-view-contracts.sql can be tested locally.
--
-- Table creation order matters due to FK constraints:
-- org -> sys_access_level -> hr_employee -> sys_module -> sys_sub_module
-- -> org_module -> org_sub_module -> hr_module_access

-- ============================================================
-- Core tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.org (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.sys_access_level (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.hr_employee (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES public.org(id),
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  sys_access_level_id TEXT NOT NULL DEFAULT 'employee'
    REFERENCES public.sys_access_level(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- ============================================================
-- Module / sub-module system tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sys_module (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.sys_sub_module (
  id TEXT PRIMARY KEY,
  sys_module_id TEXT NOT NULL REFERENCES public.sys_module(id),
  name TEXT NOT NULL,
  description TEXT,
  sys_access_level_id TEXT NOT NULL REFERENCES public.sys_access_level(id),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(sys_module_id, name)
);

-- ============================================================
-- Org-level module configuration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.org_module (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES public.org(id),
  sys_module_id TEXT NOT NULL REFERENCES public.sys_module(id),
  display_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(org_id, sys_module_id)
);

CREATE TABLE IF NOT EXISTS public.org_sub_module (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES public.org(id),
  sys_module_id TEXT NOT NULL REFERENCES public.sys_module(id),
  sys_sub_module_id TEXT NOT NULL REFERENCES public.sys_sub_module(id),
  sys_access_level_id TEXT NOT NULL REFERENCES public.sys_access_level(id),
  display_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(org_id, sys_module_id, sys_sub_module_id)
);

-- ============================================================
-- Per-employee module access
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES public.org(id),
  hr_employee_id TEXT NOT NULL REFERENCES public.hr_employee(id),
  org_module_id TEXT NOT NULL REFERENCES public.org_module(id),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  can_edit BOOLEAN NOT NULL DEFAULT true,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_verify BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(hr_employee_id, org_module_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.org ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_access_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_sub_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_sub_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_module_access ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read orgs they belong to
CREATE POLICY "org_read" ON public.org FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = org.id AND e.user_id = auth.uid() AND e.is_deleted = false
  ));

-- RLS: authenticated users can read their own employee records
CREATE POLICY "employee_read" ON public.hr_employee FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND is_deleted = false);

-- RLS: system lookup tables readable by any authenticated user
CREATE POLICY "sys_access_level_read" ON public.sys_access_level
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sys_module_read" ON public.sys_module
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sys_sub_module_read" ON public.sys_sub_module
  FOR SELECT TO authenticated USING (true);

-- RLS: org-scoped tables readable by employees of that org
CREATE POLICY "org_module_read" ON public.org_module
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = org_module.org_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));

CREATE POLICY "org_sub_module_read" ON public.org_sub_module
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.org_id = org_sub_module.org_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));

-- RLS: hr_module_access readable by the employee it belongs to
CREATE POLICY "hr_module_access_read" ON public.hr_module_access
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.hr_employee e
    WHERE e.id = hr_module_access.hr_employee_id
      AND e.user_id = auth.uid()
      AND e.is_deleted = false
  ));

-- ============================================================
-- Grants
-- ============================================================

GRANT SELECT ON public.org TO authenticated;
GRANT SELECT ON public.sys_access_level TO authenticated;
GRANT SELECT ON public.hr_employee TO authenticated;
GRANT SELECT ON public.sys_module TO authenticated;
GRANT SELECT ON public.sys_sub_module TO authenticated;
GRANT SELECT ON public.org_module TO authenticated;
GRANT SELECT ON public.org_sub_module TO authenticated;
GRANT SELECT ON public.hr_module_access TO authenticated;
