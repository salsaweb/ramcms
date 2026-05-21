-- =====================================================
-- Janzu Community Portal - Locations
-- =====================================================

BEGIN;

-- 1. Create Location Type Enum
DO $$ BEGIN
    CREATE TYPE location_type AS ENUM ('pool', 'sea', 'cenote', 'river', 'lake', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Location Status Enum
DO $$ BEGIN
    CREATE TYPE location_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create the Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type location_type NOT NULL DEFAULT 'pool',
    
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    
    water_temperature VARCHAR(50), 
    price_guide VARCHAR(100),
    image_urls TEXT[] DEFAULT '{}',
    
    status location_status NOT NULL DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_created_by ON locations(created_by);

COMMENT ON TABLE locations IS 'Directory of water spots suitable for Janzu sessions.';

-- 4. Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_locations_updated_at') THEN
        CREATE TRIGGER set_locations_updated_at
            BEFORE UPDATE ON locations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- 5. Insert new permissions into RBAC
INSERT INTO permissions (name, description, resource, action) VALUES
    ('locations.create', 'Submit a new location', 'locations', 'create'),
    ('locations.read', 'Read locations directory', 'locations', 'read'),
    ('locations.update', 'Update own location submission', 'locations', 'update'),
    ('locations.manage', 'Approve/Reject/Edit any locations', 'locations', 'manage')
ON CONFLICT (name) DO NOTHING;

-- 6. Seed Permissions into Roles
DO $$ 
DECLARE 
  v_admin_role_id INT := 1;
  v_practitioner_role_id INT := 3;
BEGIN
  -- Check if admin role exists before inserting
  IF EXISTS (SELECT 1 FROM roles WHERE id = v_admin_role_id) THEN
    -- Admin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, id 
    FROM permissions 
    WHERE resource = 'locations'
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check if practitioner role exists before inserting
  IF EXISTS (SELECT 1 FROM roles WHERE id = v_practitioner_role_id) THEN
    -- Practitioners can create, update their own, and read approved ones.
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_practitioner_role_id, id 
    FROM permissions 
    WHERE resource = 'locations' AND action IN ('create', 'read', 'update')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
