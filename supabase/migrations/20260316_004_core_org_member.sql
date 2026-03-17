CREATE TABLE IF NOT EXISTS org_member (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     TEXT NOT NULL REFERENCES org(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES util_role(id),
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT uq_org_member UNIQUE (org_id, user_id)
);

CREATE INDEX idx_org_member_user_id ON org_member (user_id);

COMMENT ON TABLE org_member IS 'Links auth.users to organizations with a role; a user can belong to multiple orgs with different roles';
COMMENT ON COLUMN org_member.id IS 'Unique identifier for the membership record';
COMMENT ON COLUMN org_member.org_id IS 'Organization the user belongs to';
COMMENT ON COLUMN org_member.user_id IS 'Supabase auth user, references auth.users(id)';
COMMENT ON COLUMN org_member.role_id IS 'Assigned access role within this organization';
COMMENT ON COLUMN org_member.is_active IS 'Soft delete flag; false disables the membership without removing the record';
COMMENT ON COLUMN org_member.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN org_member.created_by IS 'User who created the record, references auth.users(id)';
COMMENT ON COLUMN org_member.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN org_member.updated_by IS 'User who last updated the record, references auth.users(id)';
