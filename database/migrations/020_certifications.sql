-- =====================================================
-- Janzu Community Portal - Certifications
-- =====================================================

BEGIN;

-- 1. Create Status Enum
DO $$ BEGIN
    CREATE TYPE certification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the Certifications Table
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL DEFAULT 'Janzu Practitioner', -- Support future levels
    status certification_status NOT NULL DEFAULT 'pending',
    
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    
    -- A practitioner can only have one active request per type at a time.
    CONSTRAINT unique_certification_practitioner_type UNIQUE (practitioner_id, type)
);

CREATE INDEX IF NOT EXISTS idx_certifications_practitioner ON certifications(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(status);

COMMENT ON TABLE certifications IS 'Tracks the formal certification progress and approval queue for practitioners.';

-- 3. Insert new permissions into RBAC
INSERT INTO permissions (name, description, resource, action) VALUES
    ('certifications.request', 'Apply for certification', 'certifications', 'request'),
    ('certifications.read', 'Read certification status', 'certifications', 'read'),
    ('certifications.manage', 'Approve or Reject certifications', 'certifications', 'manage')
ON CONFLICT (name) DO NOTHING;

-- 4. Seed Permissions into Roles
DO $$ 
DECLARE 
  v_admin_role_id INT := 1;
  v_practitioner_role_id INT := 3;
BEGIN
  -- Check if admin role exists before inserting
  IF EXISTS (SELECT 1 FROM roles WHERE id = v_admin_role_id) THEN
    -- Admin can read and manage (approve/reject)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, id 
    FROM permissions 
    WHERE resource = 'certifications' AND action IN ('read', 'manage')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check if practitioner role exists before inserting
  IF EXISTS (SELECT 1 FROM roles WHERE id = v_practitioner_role_id) THEN
    -- Practitioners can read and request
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_practitioner_role_id, id 
    FROM permissions 
    WHERE resource = 'certifications' AND action IN ('request', 'read')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
