-- =====================================================
-- Application Permissions
-- =====================================================

-- Add application permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('applications.read', 'View applications', 'applications', 'read'),
    ('applications.update', 'Update application', 'applications', 'update')
ON CONFLICT (name) DO NOTHING;

-- Grant all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
AND p.name IN (
    'applications.read',
    'applications.update'
)
ON CONFLICT DO NOTHING;

-- Verification
DO $$
DECLARE
    perm_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO perm_count FROM permissions WHERE resource = 'applications';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Application Permissions Seed (Total: %)', perm_count;
    RAISE NOTICE '========================================';
END $$;
