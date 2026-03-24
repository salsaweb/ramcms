-- =====================================================
-- Janzu Community Portal - Practitioner Permissions
-- =====================================================

-- Add Practitioner permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('practitioners.create', 'Create practitioner profiles', 'practitioners', 'create'),
    ('practitioners.read', 'View practitioner profiles', 'practitioners', 'read'),
    ('practitioners.update', 'Update practitioner profiles', 'practitioners', 'update'),
    ('practitioners.delete', 'Delete practitioner profiles', 'practitioners', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Grant all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
AND p.name IN (
    'practitioners.create',
    'practitioners.read',
    'practitioners.update',
    'practitioners.delete'
)
ON CONFLICT DO NOTHING;

-- Verification
DO $$
DECLARE
    perm_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO perm_count FROM permissions WHERE resource = 'practitioners';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Practitioner Permissions Seed (Total: %)', perm_count;
    RAISE NOTICE '========================================';
END $$;
