-- =====================================================
-- Janzu Community Portal - Practitioners Module
-- =====================================================

DO $$ BEGIN
    CREATE TYPE practitioner_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS practitioners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile Details
    bio TEXT,
    website VARCHAR(255),
    social_links JSONB DEFAULT '{}',
    
    -- Location & Geo
    location_name VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Status & Certification
    status practitioner_status DEFAULT 'pending',
    certified_at TIMESTAMPTZ,
    
    -- Metadata
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practitioners_user ON practitioners(user_id);
CREATE INDEX IF NOT EXISTS idx_practitioners_status ON practitioners(status);
CREATE INDEX IF NOT EXISTS idx_practitioners_geo ON practitioners(latitude, longitude);

-- Practitioner Badges
CREATE TABLE IF NOT EXISTS practitioner_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    awarded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_practitioner_badges_practitioner ON practitioner_badges(practitioner_id);

-- Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'practitioners_updated_at') THEN
        CREATE TRIGGER practitioners_updated_at
            BEFORE UPDATE ON practitioners
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

COMMENT ON TABLE practitioners IS 'Extended profile for Janzu practitioners linked to users';
COMMENT ON TABLE practitioner_badges IS 'Badges awarded to practitioners for achievements';
