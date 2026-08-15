-- =====================================================
-- Janzu Community Portal - System Settings Schema
-- =====================================================

CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Note: We assume roles are set later by the admin, so we will not seed role IDs here
-- However, we can create the keys with null values as placeholders
INSERT INTO system_settings (key, value, description) VALUES 
    ('default_practitioner_role_id', 'null'::jsonb, 'Role assigned to new practitioners'),
    ('default_participant_role_id', 'null'::jsonb, 'Role assigned to new participants/clients')
ON CONFLICT (key) DO NOTHING;

-- Verification
DO $$
DECLARE
    settings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO settings_count FROM system_settings;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'System Settings Created (Total Keys: %)', settings_count;
    RAISE NOTICE '========================================';
END $$;
